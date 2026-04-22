import { NextResponse } from "next/server";

import { clearSession } from "@/app/lib/auth.server";

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
