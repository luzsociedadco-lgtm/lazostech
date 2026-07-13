"use client";

import dynamic from "next/dynamic";

const WagmiWrapper = dynamic(
  () => import("./WagmiWrapper").then(module => module.WagmiWrapper),
  { ssr: false }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <WagmiWrapper>{children}</WagmiWrapper>;
}
