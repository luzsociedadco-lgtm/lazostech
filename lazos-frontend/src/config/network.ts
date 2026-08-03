import { base, baseSepolia } from "wagmi/chains";

const configuredChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || baseSepolia.id);

if (configuredChainId !== base.id && configuredChainId !== baseSepolia.id) {
  throw new Error(
    `NEXT_PUBLIC_CHAIN_ID must be ${base.id} (Base Mainnet) or ${baseSepolia.id} (Base Sepolia)`,
  );
}

export const appChain = configuredChainId === base.id ? base : baseSepolia;
export const isMainnet = appChain.id === base.id;

const configuredRpcUrl = process.env.NEXT_PUBLIC_RPC_URL?.trim();

if (isMainnet && (!configuredRpcUrl || configuredRpcUrl === "https://mainnet.base.org")) {
  throw new Error("Base Mainnet requires a dedicated NEXT_PUBLIC_RPC_URL provider endpoint");
}

export const appRpcUrl = configuredRpcUrl || (isMainnet ? "" : "https://sepolia.base.org");

export function resolveContractAddress(
  configuredAddress: string | undefined,
  sepoliaFallback: `0x${string}`,
  variableName: string,
): `0x${string}` {
  const address = configuredAddress?.trim() || (isMainnet ? "" : sepoliaFallback);

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`${variableName} must be a valid deployed contract address for ${appChain.name}`);
  }

  return address as `0x${string}`;
}
