import { NextResponse } from "next/server";

import { assetMaterialProfiles } from "@/app/lib/asset-layer/config";
import {
  AssetLayerRequestError,
  assetLayerErrorResponse,
  digestRecord,
  parseAction,
  requireAssetLayerContext
} from "@/app/lib/asset-layer/server";

const rolesByAction = {
  passport: ["admin", "operator"],
  verify: ["admin", "verifier", "auditor"],
  custody: ["admin", "operator"],
  transform: ["admin", "operator"],
  certificate: ["admin", "auditor"],
  redeem: ["admin", "operator"]
} as const;

export async function POST(
  request: Request,
  routeContext: { params: Promise<{ assetId: string }> }
) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = parseAction(body);
    const context = await requireAssetLayerContext([...rolesByAction[action]]);
    const { assetId } = await routeContext.params;
    const { data: asset, error: assetError } = await context.supabase
      .from("asset_layer_assets")
      .select("id, organization_id, asset_ref, material_type, quantity_grams, origin_general, metadata_uri, current_custodian, status, passport_version")
      .eq("id", assetId)
      .eq("organization_id", context.organization.id)
      .maybeSingle();

    if (assetError) throw new AssetLayerRequestError("No se pudo consultar el lote", 500);
    if (!asset) throw new AssetLayerRequestError("Lote no encontrado", 404);

    if (action === "passport") {
      const version = Number(asset.passport_version) + 1;
      const metadataDigest = digestRecord({
        assetRef: asset.asset_ref,
        materialType: asset.material_type,
        quantityGrams: asset.quantity_grams,
        metadataUri: asset.metadata_uri,
        version
      });
      const { error } = await context.supabase.from("asset_layer_passports").insert({
        organization_id: context.organization.id,
        asset_id: asset.id,
        version,
        metadata_digest: metadataDigest,
        metadata_uri: asset.metadata_uri,
        issued_by: context.user.id
      });
      if (error) throw new AssetLayerRequestError(error.message, 400);
    }

    if (action === "verify") {
      const approved = body.approved !== false;
      const verifiedQuantityGrams = Number(body.verifiedQuantityGrams ?? asset.quantity_grams);
      const evidenceUri = String(body.evidenceUri ?? asset.metadata_uri);
      const evidenceDigest = digestRecord({
        assetRef: asset.asset_ref,
        approved,
        verifiedQuantityGrams,
        evidenceUri
      });
      const { error } = await context.supabase.from("asset_layer_verifications").insert({
        organization_id: context.organization.id,
        asset_id: asset.id,
        verification_type: "EXISTENCE_WEIGHT_ORIGIN",
        verified_quantity_grams: verifiedQuantityGrams,
        approved,
        evidence_digest: evidenceDigest,
        evidence_uri: evidenceUri,
        verified_by: context.user.id
      });
      if (error) throw new AssetLayerRequestError(error.message, 400);
    }

    if (action === "custody") {
      const toCustodian = String(body.toCustodian ?? "").trim();
      if (toCustodian.length < 2 || toCustodian.length > 160) {
        throw new AssetLayerRequestError("El nuevo custodio no es válido", 400);
      }
      const manifestUri = String(body.manifestUri ?? asset.metadata_uri);
      const manifestDigest = digestRecord({
        assetRef: asset.asset_ref,
        fromCustodian: asset.current_custodian,
        toCustodian,
        manifestUri
      });
      const { error } = await context.supabase.from("asset_layer_custody_events").insert({
        organization_id: context.organization.id,
        asset_id: asset.id,
        from_custodian: asset.current_custodian,
        to_custodian: toCustodian,
        manifest_digest: manifestDigest,
        manifest_uri: manifestUri,
        recorded_by: context.user.id
      });
      if (error) throw new AssetLayerRequestError(error.message, 400);
    }

    if (action === "transform") {
      const profile = assetMaterialProfiles[asset.material_type as keyof typeof assetMaterialProfiles];
      if (!profile) throw new AssetLayerRequestError("El material no tiene transformación configurada", 400);
      const outputAssetRef = String(body.outputAssetRef ?? "").trim().toUpperCase();
      const outputQuantityGrams = Number(body.outputQuantityGrams);
      const rejectedQuantityGrams = Number(body.rejectedQuantityGrams);
      if (!/^[A-Z0-9][A-Z0-9._-]{4,79}$/.test(outputAssetRef)) {
        throw new AssetLayerRequestError("La referencia de salida no es válida", 400);
      }
      if (
        !Number.isSafeInteger(outputQuantityGrams) ||
        outputQuantityGrams < 1 ||
        !Number.isSafeInteger(rejectedQuantityGrams) ||
        rejectedQuantityGrams < 0 ||
        outputQuantityGrams + rejectedQuantityGrams !== Number(asset.quantity_grams)
      ) {
        throw new AssetLayerRequestError("Salida más rechazo debe ser igual al peso de entrada", 400);
      }
      const evidenceUri = String(body.evidenceUri ?? asset.metadata_uri);
      const evidenceDigest = digestRecord({
        inputAssetRef: asset.asset_ref,
        outputAssetRef,
        outputQuantityGrams,
        rejectedQuantityGrams,
        evidenceUri
      });
      const outputMetadataUri = `${new URL(request.url).origin}/reciclaje/lotes/${encodeURIComponent(outputAssetRef)}`;
      const { error } = await context.supabase.rpc("transform_asset_layer_lot", {
        target_asset_id: asset.id,
        output_asset_ref: outputAssetRef,
        output_material_type: profile.outputType,
        output_quantity_grams: outputQuantityGrams,
        rejected_quantity_grams: rejectedQuantityGrams,
        evidence_digest: evidenceDigest,
        evidence_uri: evidenceUri,
        output_metadata_uri: outputMetadataUri
      });
      if (error) throw new AssetLayerRequestError(error.message, 400);
    }

    if (action === "certificate") {
      const publicUri = `${new URL(request.url).origin}/reciclaje/lotes/${encodeURIComponent(asset.asset_ref)}`;
      const digest = digestRecord({
        assetRef: asset.asset_ref,
        materialType: asset.material_type,
        quantityGrams: asset.quantity_grams,
        publicUri,
        certificateType: "TRACEABILITY_CERTIFICATE"
      });
      const { error } = await context.supabase.from("asset_layer_certificates").insert({
        organization_id: context.organization.id,
        asset_id: asset.id,
        certificate_type: "TRACEABILITY_CERTIFICATE",
        digest,
        public_uri: publicUri,
        issued_by: context.user.id
      });
      if (error) throw new AssetLayerRequestError(error.message, 400);
    }

    if (action === "redeem") {
      const redemptionUri = `${new URL(request.url).origin}/reciclaje/lotes/${encodeURIComponent(asset.asset_ref)}`;
      const redemptionDigest = digestRecord({
        assetRef: asset.asset_ref,
        redemptionUri,
        reason: String(body.reason ?? "processed")
      });
      const { error } = await context.supabase.from("asset_layer_redemptions").insert({
        organization_id: context.organization.id,
        asset_id: asset.id,
        redemption_digest: redemptionDigest,
        redemption_uri: redemptionUri,
        redeemed_by: context.user.id
      });
      if (error) throw new AssetLayerRequestError(error.message, 400);
    }

    return NextResponse.json({ ok: true, action });
  } catch (error) {
    return assetLayerErrorResponse(error);
  }
}
