import { NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // A missing/expired session should still leave the client logged out locally.
  }

  return NextResponse.json({ ok: true });
}
