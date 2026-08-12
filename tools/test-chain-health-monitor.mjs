import assert from "node:assert/strict";
import { createServer } from "node:http";

import { runChainHealthMonitor } from "../lazos-frontend/app/lib/ops/chain-health.ts";

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
      eth_getBlockByNumber: {
        timestamp: `0x${(Math.floor(Date.now() / 1000) - (stale ? 600 : 0)).toString(16)}`,
      },
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

const fixtures = await Promise.all([
  startFixtureServer({ fail: true }),
  startFixtureServer({}),
  startFixtureServer({ stale: true }),
  startFixtureServer({ missingCode: true }),
]);

try {
  const base = {
    expectedChainId: 8453,
    timeoutMs: 2_000,
    maxBlockAgeSeconds: 120,
    contracts: [],
  };
  const failover = await runChainHealthMonitor({
    ...base,
    providers: [
      { label: "primary", index: 0, url: fixtures[0].url },
      { label: "secondary", index: 1, url: fixtures[1].url },
    ],
  });
  assert.equal(failover.status, "DEGRADED");
  assert.equal(failover.failoverUsed, true);
  assert.ok(failover.alerts.some(alert => alert.id === "rpc_failover_used"));

  const stale = await runChainHealthMonitor({
    ...base,
    providers: [{ label: "primary", index: 0, url: fixtures[2].url }],
  });
  assert.equal(stale.status, "ALERT");
  assert.ok(stale.alerts.some(alert => alert.id === "stale_block"));

  const missingCode = await runChainHealthMonitor({
    ...base,
    providers: [{ label: "primary", index: 0, url: fixtures[3].url }],
    contracts: [{ label: "diamond", address: "0x0000000000000000000000000000000000000001" }],
  });
  assert.equal(missingCode.status, "ALERT");
  assert.ok(missingCode.alerts.some(alert => alert.id === "missing_contract_code"));

  console.log(
    JSON.stringify({
      status: "PASS",
      checks: ["primary-to-secondary failover", "stale-block alert", "missing-contract-code alert"],
    }),
  );
} finally {
  await Promise.all(fixtures.map(({ server }) => new Promise(resolve => server.close(resolve))));
}
