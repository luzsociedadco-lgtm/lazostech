"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";

import { ticketsFacetAbi, NUDOS_DIAMOND_ADDRESS, erc20Abi } from "@/app/lib/diamondContracts";
import { config as wagmiConfig } from "@/app/providers/WagmiWrapper";
import { NUDOS_CONTRACT } from "@/src/config/contracts";

type RedemptionState = {
  quoteWei: bigint | null;
  quoteDisplay: string | null;
  allowanceWei: bigint | null;
  allowanceEnough: boolean;
  isLoadingQuote: boolean;
  isSubmitting: boolean;
  statusMessage: string;
  errorMessage: string;
  refresh: () => Promise<void>;
  approveAndRedeem: () => Promise<void>;
};

export function useTicketRedemption(quantity: number): RedemptionState {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [quoteWei, setQuoteWei] = useState<bigint | null>(null);
  const [allowanceWei, setAllowanceWei] = useState<bigint | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const allowanceEnough = useMemo(() => {
    if (quoteWei === null || allowanceWei === null) return false;
    return allowanceWei >= quoteWei;
  }, [allowanceWei, quoteWei]);

  const refresh = async () => {
    if (!isConnected || !address || !publicClient || quantity <= 0) {
      setQuoteWei(null);
      setAllowanceWei(null);
      setStatusMessage("");
      return;
    }

    setIsLoadingQuote(true);
    setErrorMessage("");

    try {
      const [quote, allowance] = await Promise.all([
        publicClient.readContract({
          address: NUDOS_DIAMOND_ADDRESS,
          abi: ticketsFacetAbi,
          functionName: "quoteTicketRedemption",
          args: [BigInt(quantity)]
        }),
        publicClient.readContract({
          address: NUDOS_CONTRACT.address,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, NUDOS_DIAMOND_ADDRESS]
        })
      ]);

      setQuoteWei(quote);
      setAllowanceWei(allowance);
    } catch (error) {
      setQuoteWei(null);
      setAllowanceWei(null);
      setErrorMessage(error instanceof Error ? error.message : "No se pudo consultar la redencion de tickets");
    } finally {
      setIsLoadingQuote(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [address, isConnected, publicClient, quantity]);

  const approveAndRedeem = async () => {
    if (!isConnected || !address) {
      setErrorMessage("Conecta tu wallet para redimir tickets.");
      return;
    }

    if (!publicClient) {
      setErrorMessage("No hay cliente blockchain disponible.");
      return;
    }

    if (quoteWei === null) {
      setErrorMessage("No se pudo calcular el costo en $NUDOS.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (!allowanceEnough) {
        setStatusMessage("Aprobando $NUDOS para la compra...");

        const approveHash = await writeContractAsync({
          address: NUDOS_CONTRACT.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [NUDOS_DIAMOND_ADDRESS, quoteWei]
        });

        await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });
      }

      setStatusMessage("Enviando redencion de tickets...");

      const redeemHash = await writeContractAsync({
        address: NUDOS_DIAMOND_ADDRESS,
        abi: ticketsFacetAbi,
        functionName: "redeemTickets",
        args: [BigInt(quantity)]
      });

      await waitForTransactionReceipt(wagmiConfig, { hash: redeemHash });

      setStatusMessage("Solicitud de redencion enviada correctamente.");
      await refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo completar la redencion");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    quoteWei,
    quoteDisplay: quoteWei !== null ? formatUnits(quoteWei, 18) : null,
    allowanceWei,
    allowanceEnough,
    isLoadingQuote,
    isSubmitting,
    statusMessage,
    errorMessage,
    refresh,
    approveAndRedeem
  };
}
