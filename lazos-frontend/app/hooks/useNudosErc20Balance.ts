"use client";

import { useEffect, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { useAccount, usePublicClient } from "wagmi";

import { NUDOS_CONTRACT } from "@/src/config/contracts";

type NudosErc20BalanceState = {
  balance: string | null;
  symbol: string;
  decimals: number;
  isLoading: boolean;
  error: string | null;
};

const INITIAL_STATE: NudosErc20BalanceState = {
  balance: null,
  symbol: NUDOS_CONTRACT.symbol,
  decimals: 18,
  isLoading: false,
  error: null
};

export function useNudosErc20Balance() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [state, setState] = useState<NudosErc20BalanceState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    async function loadBalance() {
      if (!isConnected || !address || !publicClient) {
        setState(current => ({
          ...current,
          balance: null,
          isLoading: false,
          error: null
        }));
        return;
      }

      setState(current => ({
        ...current,
        isLoading: true,
        error: null
      }));

      try {
        const [rawBalance, tokenSymbol, tokenDecimals] = await Promise.all([
          publicClient.readContract({
            address: NUDOS_CONTRACT.address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [address]
          }),
          publicClient.readContract({
            address: NUDOS_CONTRACT.address,
            abi: erc20Abi,
            functionName: "symbol"
          }),
          publicClient.readContract({
            address: NUDOS_CONTRACT.address,
            abi: erc20Abi,
            functionName: "decimals"
          })
        ]);

        if (cancelled) return;

        setState({
          balance: formatUnits(rawBalance, tokenDecimals),
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          isLoading: false,
          error: null
        });
      } catch (error) {
        if (cancelled) return;

        setState(current => ({
          ...current,
          balance: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "No se pudo leer el balance ERC20"
        }));
      }
    }

    loadBalance();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected, publicClient]);

  return {
    ...state,
    address,
    isConnected,
    contractAddress: NUDOS_CONTRACT.address
  };
}
