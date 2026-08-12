import { NextResponse } from "next/server";

import { processAssetLayerOutbox } from "@/app/lib/asset-layer/relay.server";
import { assetLayerErrorResponse, requireAssetLayerContext } from "@/app/lib/asset-layer/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  return Boolean(cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`);
}

async function runCron(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json(await processAssetLayerOutbox(5));
  } catch (error) {
    const message = error instanceof Error ? error.message : "El relayer no pudo iniciar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return runCron(request);
}

export async function POST() {
  try {
    await requireAssetLayerContext(["admin"]);
    return NextResponse.json(await processAssetLayerOutbox(5));
  } catch (error) {
    return assetLayerErrorResponse(error);
  }
}
