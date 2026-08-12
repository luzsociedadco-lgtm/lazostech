import { NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { LAZOSTECH_ASSET_ORGANIZATION_ID } from "@/app/lib/asset-layer/config";

export async function GET(_request: Request, context: { params: Promise<{ assetRef: string }> }) {
  const { assetRef } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("asset_layer_public_passports")
    .select("asset_ref, organization_name, enterprise_id, root_address, chain_id, material_type, quantity_grams, origin_general, status, passport_version, passport_digest, certificate_digest, chain_asset_id, chain_tx_hash, updated_at")
    .eq("asset_ref", decodeURIComponent(assetRef).toUpperCase())
    .eq("organization_id", LAZOSTECH_ASSET_ORGANIZATION_ID)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "No se pudo consultar el pasaporte" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
  return NextResponse.json({ passport: data });
}
