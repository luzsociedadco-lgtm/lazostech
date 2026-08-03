"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "@wagmi/connectors/injected";
import { walletConnect } from "@wagmi/connectors/walletConnect";
import { useState } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { appChain, appRpcUrl } from "@/src/config/network";

const appUrl = typeof window === "undefined" ? "https://lazostech.com" : window.location.origin;
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_ID ||
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!walletConnectProjectId) {
  throw new Error("NEXT_PUBLIC_WALLETCONNECT_ID is required");
}

const connectors = [
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
];

export const config =
  appChain.id === base.id
    ? createConfig({
        chains: [base],
        connectors,
        transports: { [base.id]: http(appRpcUrl) },
        ssr: true
      })
    : createConfig({
        chains: [baseSepolia],
        connectors,
        transports: { [baseSepolia.id]: http(appRpcUrl) },
        ssr: true
      });

export function WagmiWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
