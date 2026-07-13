import { NextResponse } from "next/server";

import { syncWalletToDiamond } from "@/app/lib/diamondSync.server";
import { getSessionUser, unauthorizedResponse } from "@/app/lib/session.server";
import { createClient } from "@/app/lib/supabase/server";

export async function POST() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorizedResponse();

  if (!sessionUser.linkedWallet?.address) {
    return NextResponse.json({ error: "No hay una wallet vinculada para sincronizar." }, { status: 400 });
  }

  try {
    const syncResult = await syncWalletToDiamond(sessionUser);
    const supabase = await createClient();
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({
        onchain_profile_registered: syncResult.onchainProfileRegistered,
        onchain_affiliation_synced: syncResult.onchainAffiliationSynced
      })
      .eq("user_id", sessionUser.id);

    if (profileError) throw profileError;

    const { error: notificationError } = await supabase.from("user_notifications").insert({
      user_id: sessionUser.id,
      type: "profile",
      title: "Wallet sincronizada",
      body: syncResult.usedGenericAffiliation
        ? "Tu wallet quedo enlazada con Diamond usando afiliacion generica."
        : "Tu wallet quedo enlazada con Diamond y con tu afiliacion institucional.",
      href: null
    });

    if (notificationError) throw notificationError;

    return NextResponse.json({
      user: await getSessionUser(),
      sync: syncResult
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo sincronizar la wallet con Diamond";

    if (message === "DIAMOND_SYNC_ENV_MISSING") {
      return NextResponse.json(
        { error: "Faltan variables del operador para sincronizar la wallet con Diamond." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: message || "No se pudo sincronizar la wallet con Diamond" },
      { status: 500 }
    );
  }
}
