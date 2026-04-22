import { NextResponse } from "next/server";

import { getUniversityDirectory } from "@/app/lib/db.server";

export async function GET() {
  return NextResponse.json(getUniversityDirectory());
}
