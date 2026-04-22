"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletConnect() {
  if (!process.env.NEXT_PUBLIC_WALLETCONNECT_ID) {
    return (
      <div className="wallet-connect">
        <button type="button" className="profile-secondary-button" disabled>
          WalletConnect pendiente de configuracion local
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <ConnectButton
        accountStatus={{
          smallScreen: "avatar",
          largeScreen: "full",
        }}
        chainStatus="icon"
        showBalance={false}
      />
    </div>
  );
}
