import { NextResponse } from "next/server";

import { createSession, hashPassword } from "@/app/lib/auth.server";
import { createUser, toUserSnapshot } from "@/app/lib/db.server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email y password son obligatorios" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "La password debe tener al menos 8 caracteres" }, { status: 400 });
    }

    const user = await createUser({
      email,
      passwordHash: hashPassword(password),
      authProvider: "email"
    });

    await createSession({
      userId: user.id,
      email: user.email,
      issuedAt: Date.now()
    });

    return NextResponse.json({ user: toUserSnapshot(user) });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return NextResponse.json({ error: "Ese email ya existe" }, { status: 409 });
    }

    return NextResponse.json({ error: "No se pudo crear la cuenta" }, { status: 500 });
  }
}
