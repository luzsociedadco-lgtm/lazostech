"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "@wagmi/connectors/injected";
import { walletConnect } from "@wagmi/connectors/walletConnect";
import { useState } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { baseSepolia } from "wagmi/chains";

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org";
const appUrl = typeof window === "undefined" ? "https://lazostech.com" : window.location.origin;
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_ID ||
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!walletConnectProjectId) {
  throw new Error("NEXT_PUBLIC_WALLETCONNECT_ID is required");
}

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
    walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: true,
      metadata: {
        name: "LazosTech",
        description: "Plataforma universitaria LazosTech",
        url: appUrl,
        icons: [`${appUrl}/logo.svg`]
      }
    })
  ],
  transports: {
    [baseSepolia.id]: http(rpcUrl),
  },
  ssr: true,
});

export function WagmiWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
