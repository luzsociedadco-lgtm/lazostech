import { erc20Abi } from "viem";

export const NUDOS_DIAMOND_ADDRESS = "0xa6181f4564d5e4318e3fab7904e9624ed0101c46" as `0x${string}`;

export const ticketsFacetAbi = [
  {
    type: "function",
    name: "quoteTicketRedemption",
    stateMutability: "view",
    inputs: [{ name: "ticketsAmount", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "redeemTickets",
    stateMutability: "nonpayable",
    inputs: [{ name: "ticketsAmount", type: "uint256" }],
    outputs: []
  }
] as const;

export const profileFacetAbi = [
  {
    type: "function",
    name: "registerProfile",
    stateMutability: "nonpayable",
    inputs: [
      { name: "metadataURI", type: "string" },
      { name: "universityId", type: "uint256" },
      { name: "role", type: "uint8" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getProfile",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [
      { name: "", type: "address" },
      { name: "", type: "string" },
      { name: "", type: "uint256" },
      { name: "", type: "uint8" }
    ]
  }
] as const;

export const programFacetAbi = [
  {
    type: "function",
    name: "getProfileAffiliation",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "universityId", type: "uint256" },
      { name: "campusId", type: "uint256" },
      { name: "programId", type: "uint256" }
    ]
  }
] as const;

export { erc20Abi };
