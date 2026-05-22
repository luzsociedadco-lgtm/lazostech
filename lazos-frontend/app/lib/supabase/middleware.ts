import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseConfig } from "@/app/lib/supabase/config";

const protectedPagePrefixes = ["/perfil", "/tickets", "/reciclaje", "/marketplace", "/dao"];
const protectedApiPrefixes = ["/api/profile", "/api/wallet", "/api/notifications"];

function isProtectedPath(pathname: string) {
  return (
    protectedPagePrefixes.some(prefix => pathname.startsWith(prefix)) ||
    protectedApiPrefixes.some(prefix => pathname.startsWith(prefix))
  );
}

function isProtectedApiPath(pathname: string) {
  return protectedApiPrefixes.some(prefix => pathname.startsWith(prefix));
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next({ request });
  }

  if (!hasSupabaseConfig()) {
    if (isProtectedApiPath(pathname)) {
      return NextResponse.json(
        { error: "Supabase Auth no esta configurado." },
        { status: 503 }
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth", "missing-config");
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims) {
    if (isProtectedApiPath(pathname)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
