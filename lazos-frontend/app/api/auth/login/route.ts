import { NextResponse } from "next/server";

import { createSession, verifyPassword } from "@/app/lib/auth.server";
import { getUserByEmail, toUserSnapshot } from "@/app/lib/db.server";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim();
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email y password son obligatorios" }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 });
  }

  await createSession({
    userId: user.id,
    email: user.email,
    issuedAt: Date.now()
  });

  return NextResponse.json({ user: toUserSnapshot(user) });
}
