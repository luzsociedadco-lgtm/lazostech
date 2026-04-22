import { NextResponse } from "next/server";

import { getSessionUser } from "@/app/lib/session.server";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}
