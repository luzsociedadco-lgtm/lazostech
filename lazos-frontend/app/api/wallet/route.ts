import { NextResponse } from "next/server";

import { linkUserWallet, toUserSnapshot, unlinkUserWallet } from "@/app/lib/db.server";
import { getSessionUser, unauthorizedResponse } from "@/app/lib/session.server";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return unauthorizedResponse();
  }

  const body = await request.json();
  const address = String(body.address || "").trim();

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Direccion de wallet invalida" }, { status: 400 });
  }

  try {
    const user = await linkUserWallet(sessionUser.id, address);
    return NextResponse.json({ user: toUserSnapshot(user) });
  } catch (error) {
    if (error instanceof Error && error.message === "WALLET_ALREADY_LINKED") {
      return NextResponse.json({ error: "Esa wallet ya esta vinculada" }, { status: 409 });
    }

    return NextResponse.json({ error: "No se pudo vincular la wallet" }, { status: 500 });
  }
}

export async function DELETE() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return unauthorizedResponse();
  }

  const user = await unlinkUserWallet(sessionUser.id);
  return NextResponse.json({ user: toUserSnapshot(user) });
}
