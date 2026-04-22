import { NextResponse } from "next/server";

import { readSession } from "@/app/lib/auth.server";
import { getUserById, toUserSnapshot } from "@/app/lib/db.server";

export async function getSessionUser() {
  const session = await readSession();
  if (!session) return null;

  const user = await getUserById(session.userId);
  if (!user) return null;

  return toUserSnapshot(user);
}

export function unauthorizedResponse(message = "No autorizado") {
  return NextResponse.json({ error: message }, { status: 401 });
}
