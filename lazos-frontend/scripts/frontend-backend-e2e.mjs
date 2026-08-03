import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createPublicClient, formatUnits, http } from "viem";
import { base, baseSepolia } from "viem/chains";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

async function readText(relativePath) {
  return readFile(path.join(appRoot, relativePath), "utf8");
}

function readEnvValue(envText, key) {
  const match = envText.match(new RegExp(`^${key}=([^\\r\\n]+)`, "m"));
  return match?.[1]?.trim();
}

function readAddress(sourceText, constantName) {
  const match = sourceText.match(new RegExp(`${constantName}\\s*=\\s*["'](0x[a-fA-F0-9]{40})["']`));
  if (!match) {
    throw new Error(`No se encontro ${constantName} en el frontend.`);
  }
  return match[1];
}

const ticketsFacetAbi = [
  {
    type: "function",
    name: "quoteTicketRedemption",
    stateMutability: "view",
    inputs: [{ name: "ticketsAmount", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];

const erc20Abi = [
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const [envText, diamondText, tokenText] = await Promise.all([
    readText(".env.local").catch(() => ""),
    readText("app/lib/diamondContracts.ts"),
    readText("src/config/contracts.ts"),
  ]);

  const rpcUrl =
    process.env.NEXT_PUBLIC_RPC_URL ||
    readEnvValue(envText, "NEXT_PUBLIC_RPC_URL") ||
    "https://sepolia.base.org";
  const expectedChainId = Number(
    process.env.NEXT_PUBLIC_CHAIN_ID ||
      readEnvValue(envText, "NEXT_PUBLIC_CHAIN_ID") ||
      baseSepolia.id,
  );
  const chain = expectedChainId === base.id ? base : expectedChainId === baseSepolia.id ? baseSepolia : null;

  assert(chain, `NEXT_PUBLIC_CHAIN_ID no soportado: ${expectedChainId}.`);
  assert(
    chain.id !== base.id || (rpcUrl && rpcUrl !== "https://mainnet.base.org"),
    "Base Mainnet requiere un proveedor RPC dedicado.",
  );

  const diamondAddress =
    process.env.NEXT_PUBLIC_NUDOS_DIAMOND_ADDRESS ||
    readEnvValue(envText, "NEXT_PUBLIC_NUDOS_DIAMOND_ADDRESS") ||
    (chain.id === baseSepolia.id ? readAddress(diamondText, "SEPOLIA_DIAMOND_ADDRESS") : null);
  const tokenAddress =
    process.env.NEXT_PUBLIC_NUDOS_TOKEN_ADDRESS ||
    readEnvValue(envText, "NEXT_PUBLIC_NUDOS_TOKEN_ADDRESS") ||
    (chain.id === baseSepolia.id ? readAddress(tokenText, "SEPOLIA_NUDOS_TOKEN_ADDRESS") : null);

  assert(diamondAddress, "Falta NEXT_PUBLIC_NUDOS_DIAMOND_ADDRESS para la red seleccionada.");
  assert(tokenAddress, "Falta NEXT_PUBLIC_NUDOS_TOKEN_ADDRESS para la red seleccionada.");
  const walletAddress = process.env.NUDOS_E2E_WALLET;

  const client = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const [chainId, blockNumber, diamondCode, tokenCode, quoteOne, quoteThree, symbol, decimals] = await Promise.all([
    client.getChainId(),
    client.getBlockNumber(),
    client.getCode({ address: diamondAddress }),
    client.getCode({ address: tokenAddress }),
    client.readContract({
      address: diamondAddress,
      abi: ticketsFacetAbi,
      functionName: "quoteTicketRedemption",
      args: [1n],
    }),
    client.readContract({
      address: diamondAddress,
      abi: ticketsFacetAbi,
      functionName: "quoteTicketRedemption",
      args: [3n],
    }),
    client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "symbol" }),
    client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "decimals" }),
  ]);

  assert(chainId === chain.id, `RPC conectado a chainId ${chainId}, se esperaba ${chain.name} ${chain.id}.`);
  assert(Boolean(diamondCode) && diamondCode !== "0x", "El Diamond configurado en frontend no tiene bytecode.");
  assert(Boolean(tokenCode) && tokenCode !== "0x", "El token NUDOS configurado en frontend no tiene bytecode.");
  assert(quoteOne > 0n, "quoteTicketRedemption(1) debe devolver un precio positivo.");
  assert(quoteThree === quoteOne * 3n, "quoteTicketRedemption(3) no coincide con 3x quoteTicketRedemption(1).");
  assert(symbol === "NUDOS", `El token reporta symbol=${symbol}, se esperaba NUDOS.`);
  assert(decimals === 18, `El token reporta decimals=${decimals}, se esperaba 18.`);

  const result = {
    ok: true,
    network: chain.name,
    chainId,
    blockNumber: blockNumber.toString(),
    frontendConfig: {
      diamondAddress,
      tokenAddress,
    },
    ticketQuote: {
      oneTicketWei: quoteOne.toString(),
      oneTicket: `${formatUnits(quoteOne, decimals)} ${symbol}`,
      defaultThreeTicketsWei: quoteThree.toString(),
      defaultThreeTickets: `${formatUnits(quoteThree, decimals)} ${symbol}`,
    },
  };

  if (walletAddress) {
    const allowance = await client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "allowance",
      args: [walletAddress, diamondAddress],
    });
    result.wallet = {
      address: walletAddress,
      allowanceWei: allowance.toString(),
      allowance: `${formatUnits(allowance, decimals)} ${symbol}`,
      canRedeemDefaultQuantity: allowance >= quoteThree,
    };
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  console.error(`Frontend/backend E2E failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
