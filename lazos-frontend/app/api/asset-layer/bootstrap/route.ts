import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { LAZOSTECH_ASSET_ORGANIZATION_ID } from "@/app/lib/asset-layer/config";
import { getSessionUser, unauthorizedResponse } from "@/app/lib/session.server";

export const runtime = "nodejs";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const expectedHash = process.env.ASSET_LAYER_ADMIN_EMAIL_SHA256?.trim().toLowerCase();
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!expectedHash || !/^[a-f0-9]{64}$/.test(expectedHash) || !secretKey || !supabaseUrl) {
    return NextResponse.json({ error: "El onboarding empresarial no está configurado" }, { status: 503 });
  }

  const actualHash = createHash("sha256").update(user.email.trim().toLowerCase()).digest("hex");
  if (!timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"))) {
    return NextResponse.json({ error: "Tu cuenta no está autorizada como administradora empresarial" }, { status: 403 });
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { error } = await admin.from("asset_layer_members").upsert(
    {
      organization_id: LAZOSTECH_ASSET_ORGANIZATION_ID,
      user_id: user.id,
      role: "admin",
      is_active: true
    },
    { onConflict: "organization_id,user_id,role" }
  );

  if (error) return NextResponse.json({ error: "No se pudo activar el rol empresarial" }, { status: 500 });
  return NextResponse.json({ ok: true, role: "admin" });
}
