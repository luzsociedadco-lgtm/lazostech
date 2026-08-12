import { keccak256 } from "ethers";
import { NextResponse } from "next/server";

import {
  AssetLayerRequestError,
  assetLayerErrorResponse,
  requireAssetLayerContext
} from "@/app/lib/asset-layer/server";

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "text/csv", "application/json"]);

export async function POST(
  request: Request,
  routeContext: { params: Promise<{ assetId: string }> }
) {
  try {
    const context = await requireAssetLayerContext(["admin", "operator", "verifier", "auditor"]);
    const { assetId } = await routeContext.params;
    const formData = await request.formData();
    const file = formData.get("file");
    const evidenceType = String(formData.get("evidenceType") ?? "GENERAL_EVIDENCE").trim().toUpperCase();
    if (!(file instanceof File)) throw new AssetLayerRequestError("Selecciona un archivo", 400);
    if (!allowedTypes.has(file.type)) throw new AssetLayerRequestError("El tipo de archivo no está permitido", 400);
    if (file.size < 1 || file.size > 15 * 1024 * 1024) {
      throw new AssetLayerRequestError("La evidencia debe pesar entre 1 byte y 15 MB", 400);
    }
    if (!/^[A-Z0-9_]{2,80}$/.test(evidenceType)) {
      throw new AssetLayerRequestError("El tipo de evidencia no es válido", 400);
    }

    const { data: asset } = await context.supabase
      .from("asset_layer_assets")
      .select("id")
      .eq("id", assetId)
      .eq("organization_id", context.organization.id)
      .maybeSingle();
    if (!asset) throw new AssetLayerRequestError("Lote no encontrado", 404);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const digest = keccak256(bytes);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120) || "evidence";
    const storagePath = `${context.organization.id}/${assetId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await context.supabase.storage
      .from("asset-layer-evidence")
      .upload(storagePath, bytes, { contentType: file.type, upsert: false });
    if (uploadError) throw new AssetLayerRequestError("No se pudo almacenar la evidencia", 500);

    const { data: evidence, error: evidenceError } = await context.supabase
      .from("asset_layer_evidence")
      .insert({
        organization_id: context.organization.id,
        asset_id: assetId,
        evidence_type: evidenceType,
        digest,
        storage_path: storagePath,
        content_type: file.type,
        recorded_by: context.user.id
      })
      .select("id, evidence_type, digest, storage_path, created_at")
      .single();
    if (evidenceError) {
      throw new AssetLayerRequestError("No se pudo registrar la evidencia", 500);
    }

    return NextResponse.json({ evidence }, { status: 201 });
  } catch (error) {
    return assetLayerErrorResponse(error);
  }
}
