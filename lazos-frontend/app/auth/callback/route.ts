import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getOrCreateUserFromAuth } from "@/app/lib/db.server";
import { getSupabaseConfig } from "@/app/lib/supabase/config";

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
    const cookieStore = await cookies();
    const cookiesToSet: {
      name: string;
      value: string;
      options: CookieOptions;
    }[] = [];
    const { publishableKey, url: supabaseUrl } = getSupabaseConfig();
    const supabase = createServerClient(supabaseUrl, publishableKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(nextCookies) {
          nextCookies.forEach(({ name, value, options }) => {
            cookiesToSet.push({ name, value, options });
            cookieStore.set(name, value, options);
          });
        }
      }
    });
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

      const response = NextResponse.redirect(`${getRequestOrigin(request)}${next}`);
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });

      return response;
    }
  }

  const redirectUrl = new URL("/", getRequestOrigin(request));
  redirectUrl.searchParams.set("auth", "callback-error");

  return NextResponse.redirect(redirectUrl);
}
