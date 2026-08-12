import { NextResponse } from "next/server";

import {
  assetLayerErrorResponse,
  digestRecord,
  parseRegistration,
  requireAssetLayerContext
} from "@/app/lib/asset-layer/server";

export async function GET() {
  try {
    const context = await requireAssetLayerContext();
    const [assetsResult, eventsResult, outboxResult] = await Promise.all([
      context.supabase
        .from("asset_layer_assets")
        .select("id, asset_ref, material_type, quantity_grams, origin_general, current_custodian, status, passport_version, chain_asset_id, chain_tx_hash, anchor_status, created_at, updated_at")
        .eq("organization_id", context.organization.id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("asset_layer_events")
        .select("id, asset_id, event_type, payload, chain_tx_hash, created_at")
        .eq("organization_id", context.organization.id)
        .order("created_at", { ascending: false })
        .limit(40),
      context.supabase
        .from("asset_layer_outbox")
        .select("id, asset_id, operation, status, attempts, chain_tx_hash, last_error, created_at")
        .eq("organization_id", context.organization.id)
        .order("created_at", { ascending: false })
        .limit(40)
    ]);

    const error = assetsResult.error || eventsResult.error || outboxResult.error;
    if (error) return NextResponse.json({ error: "No se pudo cargar la operación empresarial" }, { status: 500 });

    const assets = assetsResult.data ?? [];
    return NextResponse.json({
      organization: context.organization,
      role: context.membership.role,
      assets,
      events: eventsResult.data ?? [],
      outbox: outboxResult.data ?? [],
      metrics: {
        assets: assets.length,
        grams: assets.reduce((total, asset) => total + Number(asset.quantity_grams), 0),
        verified: assets.filter(asset => asset.status === "verified").length,
        certified: assets.filter(asset => asset.status === "certified").length,
        redeemed: assets.filter(asset => asset.status === "redeemed").length,
        pendingAnchors: assets.filter(asset => asset.anchor_status !== "confirmed").length
      }
    });
  } catch (error) {
    return assetLayerErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireAssetLayerContext(["admin", "operator"]);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const input = parseRegistration(body);
    const metadataUri = `${new URL(request.url).origin}/reciclaje/lotes/${encodeURIComponent(input.assetRef)}`;
    const originDigest = digestRecord({
      assetRef: input.assetRef,
      materialType: input.materialType,
      quantityGrams: input.quantityGrams,
      originGeneral: input.originGeneral
    });

    const { data: asset, error } = await context.supabase
      .from("asset_layer_assets")
      .insert({
        organization_id: context.organization.id,
        asset_ref: input.assetRef,
        material_type: input.materialType,
        quantity_grams: input.quantityGrams,
        origin_general: input.originGeneral,
        origin_digest: originDigest,
        metadata_uri: metadataUri,
        current_custodian: input.custodian,
        created_by: context.user.id
      })
      .select("id, asset_ref, material_type, quantity_grams, status, anchor_status, created_at")
      .single();

    if (error?.code === "23505") {
      return NextResponse.json({ error: "Esa referencia de lote ya existe" }, { status: 409 });
    }
    if (error || !asset) {
      return NextResponse.json({ error: "No se pudo registrar el lote" }, { status: 500 });
    }

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    return assetLayerErrorResponse(error);
  }
}
