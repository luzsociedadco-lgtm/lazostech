"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useConfig, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";

import { WalletConnect } from "@/app/components/WalletConnect";
import {
  ENTERPRISE_AUDITOR_ROLE,
  ENTERPRISE_OPERATOR_ROLE,
  LAZOSTECH_ASSET_ROOT,
  LAZOSTECH_AUDITOR_WALLET,
  LAZOSTECH_ENTERPRISE_ADMIN,
  LAZOSTECH_ENTERPRISE_ID,
  LAZOSTECH_OPERATOR_WALLET
} from "@/app/lib/asset-layer/config";
import { appChain } from "@/src/config/network";
import styles from "../asset-layer.module.css";

const accessControlAbi = [
  {
    type: "function",
    name: "grantEnterpriseRole",
    stateMutability: "nonpayable",
    inputs: [
      { name: "enterpriseId", type: "uint256" },
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "hasEnterpriseRole",
    stateMutability: "view",
    inputs: [
      { name: "enterpriseId", type: "uint256" },
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
] as const;

type RoleKey = "operator" | "auditor";

const roleConfiguration = {
  operator: {
    label: "Operador",
    role: ENTERPRISE_OPERATOR_ROLE,
    account: LAZOSTECH_OPERATOR_WALLET
  },
  auditor: {
    label: "Auditor",
    role: ENTERPRISE_AUDITOR_ROLE,
    account: LAZOSTECH_AUDITOR_WALLET
  }
} as const;

function compact(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function AssetLayerRoleSetup() {
  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const wagmiConfig = useConfig();
  const publicClient = usePublicClient();
  const [assigned, setAssigned] = useState<Record<RoleKey, boolean>>({ operator: false, auditor: false });
  const [busy, setBusy] = useState<RoleKey | null>(null);
  const [message, setMessage] = useState("Conecta la wallet administradora de LazosTech.");

  const refresh = useCallback(async () => {
    if (!publicClient) return;
    const [operator, auditor] = await Promise.all([
      publicClient.readContract({
        address: LAZOSTECH_ASSET_ROOT,
        abi: accessControlAbi,
        functionName: "hasEnterpriseRole",
        args: [LAZOSTECH_ENTERPRISE_ID, ENTERPRISE_OPERATOR_ROLE, LAZOSTECH_OPERATOR_WALLET]
      }),
      publicClient.readContract({
        address: LAZOSTECH_ASSET_ROOT,
        abi: accessControlAbi,
        functionName: "hasEnterpriseRole",
        args: [LAZOSTECH_ENTERPRISE_ID, ENTERPRISE_AUDITOR_ROLE, LAZOSTECH_AUDITOR_WALLET]
      })
    ]);
    setAssigned({ operator, auditor });
  }, [publicClient]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function grant(roleKey: RoleKey) {
    const configuration = roleConfiguration[roleKey];
    if (!address || address.toLowerCase() !== LAZOSTECH_ENTERPRISE_ADMIN.toLowerCase()) {
      setMessage(`Conecta la administradora ${compact(LAZOSTECH_ENTERPRISE_ADMIN)}.`);
      return;
    }

    setBusy(roleKey);
    try {
      if (chainId !== appChain.id) await switchChainAsync({ chainId: appChain.id });
      setMessage(`Esperando firma para ${configuration.label.toLowerCase()}...`);
      const hash = await writeContractAsync({
        address: LAZOSTECH_ASSET_ROOT,
        abi: accessControlAbi,
        functionName: "grantEnterpriseRole",
        args: [LAZOSTECH_ENTERPRISE_ID, configuration.role, configuration.account],
        chainId: appChain.id
      });
      setMessage(`Confirmando ${hash.slice(0, 10)}... en Base Sepolia.`);
      await waitForTransactionReceipt(wagmiConfig, { hash, confirmations: 1 });
      await refresh();
      setMessage(`${configuration.label} asignado correctamente.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo completar la asignación.");
    } finally {
      setBusy(null);
    }
  }

  const correctAdmin = address?.toLowerCase() === LAZOSTECH_ENTERPRISE_ADMIN.toLowerCase();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span>Gobierno empresarial</span>
          <h1>Roles del Asset Layer</h1>
          <p>Asigna únicamente los firmantes testnet aprobados para LazosTech.</p>
        </div>
        <WalletConnect />
      </header>

      <p className={correctAdmin ? styles.message : styles.error}>
        {isConnected && !correctAdmin
          ? `Wallet incorrecta: ${address}. Usa ${LAZOSTECH_ENTERPRISE_ADMIN}.`
          : message}
      </p>

      <section className={styles.grid}>
        {(Object.keys(roleConfiguration) as RoleKey[]).map(roleKey => {
          const configuration = roleConfiguration[roleKey];
          return (
            <article className={styles.card} key={roleKey}>
              <span>{configuration.label}</span>
              <h2>{assigned[roleKey] ? "Rol activo" : "Pendiente"}</h2>
              <p><strong>Wallet:</strong> <code>{configuration.account}</code></p>
              <p><strong>Enterprise:</strong> {LAZOSTECH_ENTERPRISE_ID.toString()}</p>
              <button
                disabled={!correctAdmin || assigned[roleKey] || busy !== null}
                onClick={() => void grant(roleKey)}
                type="button"
              >
                {assigned[roleKey]
                  ? "Asignado"
                  : busy === roleKey
                    ? "Confirmando..."
                    : `Asignar ${configuration.label.toLowerCase()}`}
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
}
