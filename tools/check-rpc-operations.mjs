import { createServer } from "node:http";
import process from "node:process";

const args = new Set(process.argv.slice(2));
const jsonOutput = args.has("--json");
const selfTest = args.has("--self-test");
const expectFailover = args.has("--expect-failover");

function emit(value) {
  console.log(jsonOutput ? JSON.stringify(value, null, 2) : value);
}

function parsePositiveInteger(value, fallback, label) {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}

function requireHttpUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }
  if (!new Set(["http:", "https:"]).has(parsed.protocol)) {
    throw new Error(`${label} must use http or https`);
  }
  return value;
}

async function rpcRequest(url, method, params, timeoutMs) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(`RPC ${payload.error.code ?? "error"}`);
  if (payload.result === undefined || payload.result === null) {
    throw new Error("RPC result missing");
  }
  return payload.result;
}

function isAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value || "");
}

async function inspectProvider(provider, options) {
  const startedAt = Date.now();
  const chainHex = await rpcRequest(provider.url, "eth_chainId", [], options.timeoutMs);
  const chainId = Number.parseInt(chainHex, 16);
  if (chainId !== options.expectedChainId) {
    throw new Error(`unexpected chain ${chainId}`);
  }

  const blockHex = await rpcRequest(provider.url, "eth_blockNumber", [], options.timeoutMs);
  const blockNumber = Number.parseInt(blockHex, 16);
  const block = await rpcRequest(provider.url, "eth_getBlockByNumber", [blockHex, false], options.timeoutMs);
  const blockTimestamp = Number.parseInt(block.timestamp, 16);
  if (!Number.isSafeInteger(blockNumber) || !Number.isSafeInteger(blockTimestamp)) {
    throw new Error("invalid block response");
  }

  const contracts = [];
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
  };
}

async function runMonitor(options) {
  const failures = [];
  let observation;

  for (const provider of options.providers) {
    try {
      observation = await inspectProvider(provider, options);
      break;
    } catch (error) {
      failures.push({ provider: provider.label, error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (!observation) {
    return {
      status: "ALERT",
      alerts: [{ severity: "critical", id: "all_rpc_unavailable" }],
      providerFailures: failures,
    };
  }

  const alerts = [];
  if (observation.providerIndex > 0) {
    alerts.push({ severity: "warning", id: "rpc_failover_used", provider: observation.provider });
  }

  const blockAgeSeconds = Math.max(0, Math.floor(Date.now() / 1000) - observation.blockTimestamp);
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
    checkedAt: new Date().toISOString(),
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

function startFixtureServer({ fail = false, stale = false, missingCode = false }) {
  const server = createServer(async (request, response) => {
    if (fail) {
      response.writeHead(503).end("unavailable");
      return;
    }
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const results = {
      eth_chainId: "0x2105",
      eth_blockNumber: "0x100",
      eth_getBlockByNumber: { timestamp: `0x${(Math.floor(Date.now() / 1000) - (stale ? 600 : 0)).toString(16)}` },
      eth_getCode: missingCode ? "0x" : "0x6000",
    };
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ jsonrpc: "2.0", id: payload.id, result: results[payload.method] }));
  });

  return new Promise(resolve => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function runSelfTest() {
  const primary = await startFixtureServer({ fail: true });
  const secondary = await startFixtureServer({});
  const stale = await startFixtureServer({ stale: true });
  const missingCode = await startFixtureServer({ missingCode: true });
  const servers = [primary.server, secondary.server, stale.server, missingCode.server];

  try {
    const baseOptions = {
      expectedChainId: 8453,
      timeoutMs: 2_000,
      maxBlockAgeSeconds: 120,
      contracts: [],
    };
    const failoverResult = await runMonitor({
      ...baseOptions,
      providers: [
        { label: "primary", index: 0, url: primary.url },
        { label: "secondary", index: 1, url: secondary.url },
      ],
    });
    if (!failoverResult.failoverUsed || !failoverResult.alerts.some(alert => alert.id === "rpc_failover_used")) {
      throw new Error("failover alert was not generated");
    }

    const staleResult = await runMonitor({
      ...baseOptions,
      providers: [{ label: "primary", index: 0, url: stale.url }],
    });
    if (!staleResult.alerts.some(alert => alert.id === "stale_block")) {
      throw new Error("stale-block alert was not generated");
    }

    const codeResult = await runMonitor({
      ...baseOptions,
      providers: [{ label: "primary", index: 0, url: missingCode.url }],
      contracts: [{ label: "diamond", address: "0x0000000000000000000000000000000000000001" }],
    });
    if (!codeResult.alerts.some(alert => alert.id === "missing_contract_code")) {
      throw new Error("missing-code alert was not generated");
    }

    emit({
      status: "PASS",
      checks: ["primary-to-secondary failover", "stale-block alert", "missing-contract-code alert"],
    });
  } finally {
    await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve))));
  }
}

async function main() {
  if (selfTest) {
    await runSelfTest();
    return;
  }

  const providers = [];
  if (process.env.PRIMARY_RPC_URL) {
    providers.push({ label: "primary", index: 0, url: requireHttpUrl(process.env.PRIMARY_RPC_URL, "PRIMARY_RPC_URL") });
  }
  if (process.env.FAILOVER_RPC_URL) {
    providers.push({ label: "secondary", index: providers.length, url: requireHttpUrl(process.env.FAILOVER_RPC_URL, "FAILOVER_RPC_URL") });
  }
  if (providers.length === 0) throw new Error("PRIMARY_RPC_URL or FAILOVER_RPC_URL is required");

  const contracts = [];
  for (const [label, value] of [["diamond", process.env.DIAMOND], ["token", process.env.NUDOS_TOKEN]]) {
    if (value) {
      if (!isAddress(value)) throw new Error(`${label.toUpperCase()} must be a 20-byte address`);
      contracts.push({ label, address: value });
    }
  }

  const result = await runMonitor({
    providers,
    contracts,
    expectedChainId: parsePositiveInteger(process.env.EXPECTED_CHAIN_ID, 8453, "EXPECTED_CHAIN_ID"),
    timeoutMs: parsePositiveInteger(process.env.RPC_TIMEOUT_MS, 8_000, "RPC_TIMEOUT_MS"),
    maxBlockAgeSeconds: parsePositiveInteger(process.env.MAX_BLOCK_AGE_SECONDS, 120, "MAX_BLOCK_AGE_SECONDS"),
  });

  emit(result);
  if (expectFailover && !result.failoverUsed) throw new Error("failover was expected but primary provider was used");
  if (result.status === "ALERT") process.exitCode = 1;
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
