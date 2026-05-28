import { NextResponse } from "next/server";

import { getOrCreateUserFromAuth } from "@/app/lib/db.server";
import { createClient } from "@/app/lib/supabase/server";

function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    return `${forwardedProto || url.protocol.replace(":", "")}://${forwardedHost}`;
  }

  return url.origin;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  let next = url.searchParams.get("next") ?? "/perfil";

  if (!next.startsWith("/")) {
    next = "/perfil";
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const authUser = data.session?.user;
      const email = authUser?.email;

      if (authUser?.id && email) {
        try {
          await getOrCreateUserFromAuth({
            id: authUser.id,
            email,
            authProvider: "google"
          });
        } catch {
          // Supabase Auth is the source of truth for the session; profile storage can be reconciled later.
        }
      }

      return NextResponse.redirect(`${getRequestOrigin(request)}${next}`);
    }
  }

  const redirectUrl = new URL("/", getRequestOrigin(request));
  redirectUrl.searchParams.set("auth", "callback-error");

  return NextResponse.redirect(redirectUrl);
}
