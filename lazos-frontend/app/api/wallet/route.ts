import { NextResponse } from "next/server";

import { getSessionUser, unauthorizedResponse } from "@/app/lib/session.server";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorizedResponse();

  const body = await request.json().catch(() => ({}));
  const address = String(body.address || "").trim().toLowerCase();

  if (!/^0x[a-f0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Direccion de wallet invalida" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: sessionUser.id,
      email: sessionUser.email,
      linked_wallet: address,
      wallet_linked_at: new Date().toISOString(),
      onchain_profile_registered: false,
      onchain_affiliation_synced: false
    },
    { onConflict: "user_id" }
  );

  if (error?.code === "23505") {
    return NextResponse.json({ error: "Esa wallet ya esta vinculada" }, { status: 409 });
  }
  if (error) {
    return NextResponse.json({ error: "No se pudo vincular la wallet" }, { status: 500 });
  }

  return NextResponse.json({ user: await getSessionUser() });
}

export async function DELETE() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorizedResponse();

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({
      linked_wallet: null,
      wallet_linked_at: null,
      onchain_profile_registered: false,
      onchain_affiliation_synced: false
    })
    .eq("user_id", sessionUser.id);

  if (error) {
    return NextResponse.json({ error: "No se pudo desvincular la wallet" }, { status: 500 });
  }

  return NextResponse.json({ user: await getSessionUser() });
}
