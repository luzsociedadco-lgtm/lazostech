"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { http } from "viem";

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org";
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_ID ||
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!walletConnectProjectId) {
  throw new Error("NEXT_PUBLIC_WALLETCONNECT_ID is required");
}

export const config = getDefaultConfig({
  appName: "$NUDOS",
  projectId: walletConnectProjectId,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(rpcUrl),
  },
  ssr: true,
});

export function WagmiWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
