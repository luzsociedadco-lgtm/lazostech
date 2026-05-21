import { NextResponse } from "next/server";

import { addUserNotification, getUserById, toUserSnapshot, updateUserWalletSyncState } from "@/app/lib/db.server";
import { syncWalletToDiamond } from "@/app/lib/diamondSync.server";
import { getSessionUser, unauthorizedResponse } from "@/app/lib/session.server";

export async function POST() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return unauthorizedResponse();
  }

  const appUser = await getUserById(sessionUser.id);
  if (!appUser) {
    return unauthorizedResponse();
  }

  if (!appUser.linkedWallet?.address) {
    return NextResponse.json({ error: "No hay una wallet vinculada para sincronizar." }, { status: 400 });
  }

  try {
    const syncResult = await syncWalletToDiamond(appUser);
    await updateUserWalletSyncState(appUser.id, {
      onchainProfileRegistered: syncResult.onchainProfileRegistered,
      onchainAffiliationSynced: syncResult.onchainAffiliationSynced
    });

    await addUserNotification(appUser.id, {
      type: "profile",
      title: "Wallet sincronizada",
      body: syncResult.usedGenericAffiliation
        ? "Tu wallet quedo enlazada con Diamond usando afiliacion generica."
        : "Tu wallet quedo enlazada con Diamond y con tu afiliacion institucional.",
      href: null
    });

    const updatedUser = await getUserById(appUser.id);
    if (!updatedUser) {
      return unauthorizedResponse();
    }

    return NextResponse.json({
      user: toUserSnapshot(updatedUser),
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
