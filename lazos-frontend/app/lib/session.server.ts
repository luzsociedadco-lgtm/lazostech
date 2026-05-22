import { NextResponse } from "next/server";

import { getOrCreateUserFromAuth, getUserByEmail, getUserById, toUserSnapshot } from "@/app/lib/db.server";
import { createClient } from "@/app/lib/supabase/server";

export async function getSessionUser() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims;

    if (error || !claims?.sub) return null;

    const authUserId = String(claims.sub);
    const email = typeof claims.email === "string" ? claims.email : "";

    const user =
      (await getUserById(authUserId)) ||
      (email ? await getUserByEmail(email) : null) ||
      (email
        ? await getOrCreateUserFromAuth({
            id: authUserId,
            email,
            authProvider: "email"
          })
        : null);

    if (!user) return null;

    return toUserSnapshot(user);
  } catch {
    return null;
  }
}

export function unauthorizedResponse(message = "No autorizado") {
  return NextResponse.json({ error: message }, { status: 401 });
}
