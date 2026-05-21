import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createPublicClient, formatUnits, http } from "viem";
import { baseSepolia } from "viem/chains";

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

function readContractAddress(sourceText, exportName) {
  const blockMatch = sourceText.match(new RegExp(`export\\s+const\\s+${exportName}\\s*=\\s*{([\\s\\S]*?)}`, "m"));
  const block = blockMatch?.[1] ?? sourceText;
  const match = block.match(/address:\s*['"](0x[a-fA-F0-9]{40})['"]/);
  if (!match) {
    throw new Error(`No se encontro ${exportName}.address en el frontend.`);
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
  const diamondAddress = readAddress(diamondText, "NUDOS_DIAMOND_ADDRESS");
  const tokenAddress = readContractAddress(tokenText, "NUDOS_CONTRACT");
  const walletAddress = process.env.NUDOS_E2E_WALLET;

  const client = createPublicClient({
    chain: baseSepolia,
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

  assert(chainId === baseSepolia.id, `RPC conectado a chainId ${chainId}, se esperaba Base Sepolia ${baseSepolia.id}.`);
  assert(Boolean(diamondCode) && diamondCode !== "0x", "El Diamond configurado en frontend no tiene bytecode.");
  assert(Boolean(tokenCode) && tokenCode !== "0x", "El token NUDOS configurado en frontend no tiene bytecode.");
  assert(quoteOne > 0n, "quoteTicketRedemption(1) debe devolver un precio positivo.");
  assert(quoteThree === quoteOne * 3n, "quoteTicketRedemption(3) no coincide con 3x quoteTicketRedemption(1).");
  assert(symbol === "NUDOS", `El token reporta symbol=${symbol}, se esperaba NUDOS.`);
  assert(decimals === 18, `El token reporta decimals=${decimals}, se esperaba 18.`);

  const result = {
    ok: true,
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
