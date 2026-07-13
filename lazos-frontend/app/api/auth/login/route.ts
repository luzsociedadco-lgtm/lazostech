import { NextResponse } from "next/server";

import { getSessionUser } from "@/app/lib/session.server";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email y password son obligatorios" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user?.email) {
      return NextResponse.json({ error: "Credenciales invalidas" }, { status: 401 });
    }

    return NextResponse.json({ user: await getSessionUser() });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "SUPABASE_ENV_MISSING"
        ? "Supabase Auth no esta configurado."
        : "No se pudo iniciar sesion";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
