import { NextResponse } from "next/server";

import { getOrCreateUserFromAuth, toUserSnapshot } from "@/app/lib/db.server";
import { createClient } from "@/app/lib/supabase/server";

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

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      const alreadyRegistered = error.message.toLowerCase().includes("already registered");
      return NextResponse.json(
        { error: alreadyRegistered ? "Ese email ya existe" : error.message },
        { status: alreadyRegistered ? 409 : 400 }
      );
    }

    if (!data.user?.email) {
      return NextResponse.json({ error: "No se pudo crear la cuenta" }, { status: 500 });
    }

    const user = await getOrCreateUserFromAuth({
      id: data.user.id,
      email: data.user.email,
      authProvider: "email"
    });

    if (!data.session) {
      return NextResponse.json(
        { user: null, message: "Cuenta creada. Revisa tu email para confirmar el acceso." },
        { status: 202 }
      );
    }

    return NextResponse.json({ user: toUserSnapshot(user) });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "SUPABASE_ENV_MISSING"
        ? "Supabase Auth no esta configurado."
        : "No se pudo crear la cuenta";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
