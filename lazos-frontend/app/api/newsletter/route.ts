import { NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_INTERESTS = new Set(["estudiante", "universidad", "aliado", "emprendimiento", "comunidad"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const city = String(body.city || "").trim();
    const organization = String(body.organization || "").trim();
    const interest = String(body.interest || "").trim();
    const message = String(body.message || "").trim();

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Ingresa un nombre valido." }, { status: 400 });
    }

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Ingresa un correo valido." }, { status: 400 });
    }

    if (city && (city.length < 2 || city.length > 100)) {
      return NextResponse.json({ error: "Ingresa una ciudad valida." }, { status: 400 });
    }

    if (organization && (organization.length < 2 || organization.length > 140)) {
      return NextResponse.json(
        { error: "Ingresa tu universidad u organizacion." },
        { status: 400 }
      );
    }

    if (interest && !VALID_INTERESTS.has(interest)) {
      return NextResponse.json({ error: "Selecciona un interes valido." }, { status: 400 });
    }

    if (message.length > 600) {
      return NextResponse.json(
        { error: "El mensaje debe tener maximo 600 caracteres." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("newsletter_interests").insert({
      name,
      email,
      city: city || null,
      organization: organization || null,
      interest: interest || null,
      message: message || null,
      consent: true,
      source: "we_landing",
      user_agent: request.headers.get("user-agent"),
      referrer: request.headers.get("referer")
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, alreadySubscribed: true });
      }

      return NextResponse.json({ error: "No pudimos registrar tu correo." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "SUPABASE_ENV_MISSING"
        ? "Supabase no esta configurado para recibir registros."
        : "No pudimos registrar tu correo.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
