'use client'

import { useNudosErc20Balance } from "@/app/hooks/useNudosErc20Balance";

export default function NudosBalance() {
  const { balance, isConnected, isLoading, symbol } = useNudosErc20Balance();

  if (!isConnected) return <p>Conecta tu wallet para ver tu balance ERC20.</p>;

  return (
    <div className="p-4 text-center">
      {isLoading ? (
        <p>Cargando balance...</p>
      ) : balance !== null ? (
        <p className="text-lg font-semibold">
          Tu balance ERC20: {balance} {symbol}
        </p>
      ) : (
        <p>No se pudo leer el balance.</p>
      )}
    </div>
  );
}
