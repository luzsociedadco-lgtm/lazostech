import { keccak256, toUtf8Bytes } from "ethers";

import { createClient } from "@/app/lib/supabase/server";
import { getSessionUser } from "@/app/lib/session.server";
import {
  assetMaterialProfiles,
  LAZOSTECH_ASSET_ORGANIZATION_ID,
  type AssetInputMaterial,
  type AssetLayerRole
} from "@/app/lib/asset-layer/config";

const allRoles: AssetLayerRole[] = ["admin", "operator", "verifier", "auditor", "viewer"];

export class AssetLayerRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export function digestRecord(value: unknown) {
  return keccak256(toUtf8Bytes(JSON.stringify(value)));
}

export async function requireAssetLayerContext(allowedRoles: AssetLayerRole[] = allRoles) {
  const user = await getSessionUser();
  if (!user) throw new AssetLayerRequestError("No autorizado", 401);

  const supabase = await createClient();
  const { data: membership, error: membershipError } = await supabase
    .from("asset_layer_members")
    .select("organization_id, role")
    .eq("organization_id", LAZOSTECH_ASSET_ORGANIZATION_ID)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .in("role", allowedRoles)
    .limit(1)
    .maybeSingle();

  if (membershipError) throw new AssetLayerRequestError("No se pudo validar el rol empresarial", 500);
  if (!membership) {
    throw new AssetLayerRequestError(
      "Tu cuenta no tiene un rol activo en la operación empresarial de Asset Layer.",
      403
    );
  }

  const { data: organization, error: organizationError } = await supabase
    .from("asset_layer_organizations")
    .select("id, legal_name, enterprise_id, root_address, chain_id, priority_material, material_scope, base_unit")
    .eq("id", membership.organization_id)
    .single();

  if (organizationError || !organization) {
    throw new AssetLayerRequestError("La organización empresarial no está disponible", 500);
  }

  return {
    user,
    supabase,
    membership: membership as { organization_id: string; role: AssetLayerRole },
    organization
  };
}

export function parseRegistration(body: Record<string, unknown>) {
  const assetRef = String(body.assetRef ?? "").trim().toUpperCase();
  const materialType = String(body.materialType ?? "") as AssetInputMaterial;
  const quantityGrams = Number(body.quantityGrams);
  const originGeneral = String(body.originGeneral ?? "").trim();
  const custodian = String(body.custodian ?? "LazosTech").trim();

  if (!/^[A-Z0-9][A-Z0-9._-]{4,79}$/.test(assetRef)) {
    throw new AssetLayerRequestError("La referencia del lote no es válida", 400);
  }
  if (!(materialType in assetMaterialProfiles)) {
    throw new AssetLayerRequestError("El material no está habilitado", 400);
  }
  if (!Number.isSafeInteger(quantityGrams) || quantityGrams < 1) {
    throw new AssetLayerRequestError("La cantidad debe ser un número entero positivo de gramos", 400);
  }
  if (originGeneral.length < 2 || originGeneral.length > 240) {
    throw new AssetLayerRequestError("El origen general debe tener entre 2 y 240 caracteres", 400);
  }
  if (custodian.length < 2 || custodian.length > 160) {
    throw new AssetLayerRequestError("El custodio no es válido", 400);
  }

  return { assetRef, materialType, quantityGrams, originGeneral, custodian };
}

export function parseAction(body: Record<string, unknown>) {
  const action = String(body.action ?? "");
  if (!["passport", "verify", "custody", "transform", "certificate", "redeem"].includes(action)) {
    throw new AssetLayerRequestError("La acción solicitada no existe", 400);
  }
  return action as "passport" | "verify" | "custody" | "transform" | "certificate" | "redeem";
}

export async function enqueueAssetOperation(
  context: Awaited<ReturnType<typeof requireAssetLayerContext>>,
  assetId: string,
  operation: string,
  payload: Record<string, unknown>
) {
  const idempotencyKey = `${assetId}:${operation}:${digestRecord(payload)}`;
  const { error } = await context.supabase.from("asset_layer_outbox").upsert(
    {
      organization_id: context.organization.id,
      asset_id: assetId,
      operation,
      idempotency_key: idempotencyKey,
      payload,
      status: "pending"
    },
    { onConflict: "idempotency_key", ignoreDuplicates: true }
  );
  if (error) throw new AssetLayerRequestError("No se pudo encolar el anclaje blockchain", 500);
}

export function assetLayerErrorResponse(error: unknown) {
  if (error instanceof AssetLayerRequestError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json({ error: "Asset Layer no pudo completar la operación" }, { status: 500 });
}
