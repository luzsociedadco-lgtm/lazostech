export type ChainHealthAlert = {
  severity: "warning" | "critical";
  id: "rpc_failover_used" | "stale_block" | "missing_contract_code" | "all_rpc_unavailable";
  provider?: string;
  blockAgeSeconds?: number;
  contract?: string;
};

export type ChainHealthProvider = {
  label: string;
  index: number;
  url: string;
};

export type MonitoredContract = {
  label: string;
  address: string;
};

export type ChainHealthOptions = {
  providers: ChainHealthProvider[];
  contracts: MonitoredContract[];
  expectedChainId: number;
  timeoutMs: number;
  maxBlockAgeSeconds: number;
  nowMs?: number;
};

type ProviderFailure = { provider: string; error: string };

type ProviderObservation = {
  provider: string;
  providerIndex: number;
  chainId: number;
  blockNumber: number;
  blockTimestamp: number;
  latencyMs: number;
  contracts: Array<{ label: string; codePresent: boolean }>;
};

export type ChainHealthResult = {
  status: "OK" | "DEGRADED" | "ALERT";
  checkedAt: string;
  provider?: string;
  failoverUsed?: boolean;
  chainId?: number;
  blockNumber?: number;
  blockAgeSeconds?: number;
  latencyMs?: number;
  contracts?: Array<{ label: string; codePresent: boolean }>;
  alerts: ChainHealthAlert[];
  providerFailures: ProviderFailure[];
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function rpcRequest(url: string, method: string, params: unknown[], timeoutMs: number) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const payload = (await response.json()) as {
    result?: unknown;
    error?: { code?: number };
  };
  if (payload.error) throw new Error(`RPC ${payload.error.code ?? "error"}`);
  if (payload.result === undefined || payload.result === null) throw new Error("RPC result missing");
  return payload.result;
}

async function inspectProvider(provider: ChainHealthProvider, options: ChainHealthOptions) {
  const startedAt = Date.now();
  const chainHex = await rpcRequest(provider.url, "eth_chainId", [], options.timeoutMs);
  const chainId = Number.parseInt(String(chainHex), 16);
  if (chainId !== options.expectedChainId) throw new Error(`unexpected chain ${chainId}`);

  const blockHex = await rpcRequest(provider.url, "eth_blockNumber", [], options.timeoutMs);
  const blockNumber = Number.parseInt(String(blockHex), 16);
  const block = (await rpcRequest(
    provider.url,
    "eth_getBlockByNumber",
    [blockHex, false],
    options.timeoutMs,
  )) as { timestamp?: string };
  const blockTimestamp = Number.parseInt(String(block.timestamp), 16);
  if (!Number.isSafeInteger(blockNumber) || !Number.isSafeInteger(blockTimestamp)) {
    throw new Error("invalid block response");
  }

  const contracts: Array<{ label: string; codePresent: boolean }> = [];
  for (const contract of options.contracts) {
    const code = await rpcRequest(provider.url, "eth_getCode", [contract.address, "latest"], options.timeoutMs);
    contracts.push({ label: contract.label, codePresent: code !== "0x" && code !== "0x0" });
  }

  return {
    provider: provider.label,
    providerIndex: provider.index,
    chainId,
    blockNumber,
    blockTimestamp,
    latencyMs: Date.now() - startedAt,
    contracts,
  } satisfies ProviderObservation;
}

export async function runChainHealthMonitor(options: ChainHealthOptions): Promise<ChainHealthResult> {
  const failures: ProviderFailure[] = [];
  let observation: ProviderObservation | undefined;
  const nowMs = options.nowMs ?? Date.now();

  for (const provider of options.providers) {
    try {
      observation = await inspectProvider(provider, options);
      break;
    } catch (error) {
      failures.push({ provider: provider.label, error: errorMessage(error) });
    }
  }

  if (!observation) {
    return {
      status: "ALERT",
      checkedAt: new Date(nowMs).toISOString(),
      alerts: [{ severity: "critical", id: "all_rpc_unavailable" }],
      providerFailures: failures,
    };
  }

  const alerts: ChainHealthAlert[] = [];
  if (observation.providerIndex > 0) {
    alerts.push({ severity: "warning", id: "rpc_failover_used", provider: observation.provider });
  }

  const blockAgeSeconds = Math.max(0, Math.floor(nowMs / 1000) - observation.blockTimestamp);
  if (blockAgeSeconds > options.maxBlockAgeSeconds) {
    alerts.push({ severity: "critical", id: "stale_block", blockAgeSeconds });
  }

  for (const contract of observation.contracts) {
    if (!contract.codePresent) {
      alerts.push({ severity: "critical", id: "missing_contract_code", contract: contract.label });
    }
  }

  return {
    status: alerts.some(alert => alert.severity === "critical") ? "ALERT" : alerts.length ? "DEGRADED" : "OK",
    checkedAt: new Date(nowMs).toISOString(),
    provider: observation.provider,
    failoverUsed: observation.providerIndex > 0,
    chainId: observation.chainId,
    blockNumber: observation.blockNumber,
    blockAgeSeconds,
    latencyMs: observation.latencyMs,
    contracts: observation.contracts,
    alerts,
    providerFailures: failures,
  };
}

export function isEvmAddress(value: string | undefined): value is string {
  return /^0x[a-fA-F0-9]{40}$/.test(value ?? "");
}

export function parsePositiveInteger(value: string | undefined, fallback: number, label: string) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${label} must be a positive integer`);
  return parsed;
}

export function requireHttpUrl(value: string, label: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${label} must use http or https`);
  }
  return value;
}
