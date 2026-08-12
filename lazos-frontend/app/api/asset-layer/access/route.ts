import { NextResponse } from "next/server";

import { requireAssetLayerContext } from "@/app/lib/asset-layer/server";

export async function GET() {
  try {
    await requireAssetLayerContext(["admin"]);
    return NextResponse.json({ enterpriseAdmin: true });
  } catch {
    return NextResponse.json({ enterpriseAdmin: false });
  }
}
