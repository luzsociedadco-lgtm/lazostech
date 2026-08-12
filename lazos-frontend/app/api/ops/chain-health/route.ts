import { NextResponse } from "next/server";

import {
  isEvmAddress,
  parsePositiveInteger,
  requireHttpUrl,
  runChainHealthMonitor,
  type ChainHealthProvider,
  type MonitoredContract,
} from "@/app/lib/ops/chain-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const route = "/api/ops/chain-health";

function authorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  return Boolean(cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`);
}

function monitorConfiguration() {
  const providers: ChainHealthProvider[] = [];
  if (process.env.OPS_PRIMARY_RPC_URL) {
    providers.push({
      label: "primary",
      index: 0,
      url: requireHttpUrl(process.env.OPS_PRIMARY_RPC_URL, "OPS_PRIMARY_RPC_URL"),
    });
  }
  if (process.env.OPS_FAILOVER_RPC_URL) {
    providers.push({
      label: "secondary",
      index: providers.length,
      url: requireHttpUrl(process.env.OPS_FAILOVER_RPC_URL, "OPS_FAILOVER_RPC_URL"),
    });
  }
  if (providers.length === 0) throw new Error("OPS_PRIMARY_RPC_URL or OPS_FAILOVER_RPC_URL is required");

  const contracts: MonitoredContract[] = [];
  for (const [label, value] of [
    ["diamond", process.env.OPS_DIAMOND_ADDRESS],
    ["token", process.env.OPS_NUDOS_TOKEN_ADDRESS],
  ] as const) {
    if (!value) continue;
    if (!isEvmAddress(value)) throw new Error(`${label.toUpperCase()} must be a 20-byte address`);
    contracts.push({ label, address: value });
  }

  return {
    providers,
    contracts,
    expectedChainId: parsePositiveInteger(process.env.OPS_EXPECTED_CHAIN_ID, 8453, "OPS_EXPECTED_CHAIN_ID"),
    timeoutMs: parsePositiveInteger(process.env.OPS_RPC_TIMEOUT_MS, 8_000, "OPS_RPC_TIMEOUT_MS"),
    maxBlockAgeSeconds: parsePositiveInteger(
      process.env.OPS_MAX_BLOCK_AGE_SECONDS,
      120,
      "OPS_MAX_BLOCK_AGE_SECONDS",
    ),
  };
}

async function deliverAlert(payload: unknown) {
  const webhookUrl = process.env.OPS_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return { configured: false, delivered: false };

  requireHttpUrl(webhookUrl, "OPS_ALERT_WEBHOOK_URL");
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.OPS_ALERT_WEBHOOK_BEARER_TOKEN) {
    headers.authorization = `Bearer ${process.env.OPS_ALERT_WEBHOOK_BEARER_TOKEN}`;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Alert webhook HTTP ${response.status}`);
  return { configured: true, delivered: true };
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = request.headers.get("x-vercel-id") ?? "local";
  if (!authorized(request)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  console.log(JSON.stringify({ level: "info", msg: "chain_health_start", route, requestId }));
  try {
    const result = await runChainHealthMonitor(monitorConfiguration());
    let alertDelivery = { configured: Boolean(process.env.OPS_ALERT_WEBHOOK_URL), delivered: false };

    if (result.status !== "OK") {
      try {
        alertDelivery = await deliverAlert({ source: "nudos-chain-health", requestId, ...result });
      } catch (error) {
        console.error(
          JSON.stringify({
            level: "error",
            msg: "chain_health_alert_delivery_failed",
            route,
            requestId,
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    }

    console.log(
      JSON.stringify({
        level: result.status === "OK" ? "info" : "warn",
        msg: "chain_health_done",
        route,
        requestId,
        status: result.status,
        provider: result.provider,
        alerts: result.alerts.map(alert => alert.id),
        alertDelivery,
        ms: Date.now() - startedAt,
      }),
    );

    return NextResponse.json(
      { ...result, alertDelivery },
      { status: result.status === "ALERT" ? 503 : 200, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      JSON.stringify({
        level: "error",
        msg: "chain_health_failed",
        route,
        requestId,
        error: message,
        ms: Date.now() - startedAt,
      }),
    );
    return NextResponse.json({ status: "CONFIG_ERROR", error: message }, { status: 503 });
  }
}
