"use client";

import { LogOut, Wallet, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";

function compactAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletConnect() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { address, chainId, isConnected } = useAccount();
  const { connectors, connect, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  useEffect(() => {
    if (isConnected) dialogRef.current?.close();
  }, [isConnected]);

  if (isConnected && address) {
    const wrongChain = chainId !== baseSepolia.id;

    return (
      <div className="wallet-connect wallet-connect--connected">
        {wrongChain ? (
          <button
            className="wallet-connect__button wallet-connect__button--warning"
            disabled={isSwitching}
            onClick={() => switchChain({ chainId: baseSepolia.id })}
            type="button"
          >
            {isSwitching ? "Cambiando..." : "Cambiar a Base Sepolia"}
          </button>
        ) : (
          <span className="wallet-connect__account" title={address}>
            <Wallet aria-hidden="true" size={16} />
            {compactAddress(address)}
          </span>
        )}
        <button
          aria-label="Desconectar wallet"
          className="wallet-connect__icon"
          onClick={() => disconnect()}
          title="Desconectar wallet"
          type="button"
        >
          <LogOut aria-hidden="true" size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <button
        className="wallet-connect__button"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        <Wallet aria-hidden="true" size={17} />
        Conectar wallet
      </button>

      <dialog className="wallet-connect__dialog" ref={dialogRef}>
        <div className="wallet-connect__dialog-header">
          <strong>Conectar wallet</strong>
          <button
            aria-label="Cerrar"
            className="wallet-connect__icon"
            onClick={() => dialogRef.current?.close()}
            title="Cerrar"
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <div className="wallet-connect__options">
          {connectors.map(connector => (
            <button
              className="wallet-connect__option"
              disabled={isPending}
              key={connector.uid}
              onClick={() => connect({ connector })}
              type="button"
            >
              <Wallet aria-hidden="true" size={18} />
              {isPending ? "Conectando..." : connector.name}
            </button>
          ))}
        </div>
        {error ? <p className="wallet-connect__error">No se pudo conectar la wallet.</p> : null}
      </dialog>
    </div>
  );
}
