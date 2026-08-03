import { resolveContractAddress } from "./network";

const SEPOLIA_NUDOS_TOKEN_ADDRESS = "0xE15a1c28C4185F9d98C1d2E17c2e8497BfeFa23C" as const;

export const NUDOS_CONTRACT = {
  address: resolveContractAddress(
    process.env.NEXT_PUBLIC_NUDOS_TOKEN_ADDRESS,
    SEPOLIA_NUDOS_TOKEN_ADDRESS,
    "NEXT_PUBLIC_NUDOS_TOKEN_ADDRESS",
  ),
  symbol: "NUDOS",
  abi: [
    {
      inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'symbol',
      outputs: [{ internalType: 'string', name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'decimals',
      outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
      stateMutability: 'view',
      type: 'function',
    },
  ],
}

