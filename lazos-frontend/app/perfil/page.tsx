"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  CreditCard,
  HandCoins,
  Menu,
  ShieldCheck,
  UserPen,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatEther } from "viem";
import { useAccount, useReadContracts } from "wagmi";

const NUDOS_TOKEN_ADDRESS = "0xE15a1c28C4185F9d98C1d2E17c2e8497BfeFa23C" as const;
const NUDOS_DIAMOND_ADDRESS = "0x23433c04d1ec546e365d966eaed054696060c403" as const;

const tokenAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

const diamondAbi = [
  {
    type: "function",
    name: "getTickets",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getUserRecycleImpact",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "aluminium", type: "uint256" },
      { name: "plastic", type: "uint256" },
      { name: "cardboard", type: "uint256" },
      { name: "glass", type: "uint256" },
      { name: "actions", type: "uint256" },
    ],
  },
] as const;

const student = {
  name: "Daniela Torres",
  studentType: "Pregrado",
  bonus: "Almuerzo Regular",
  code: "202323560",
  userId: "CKZPzDh0rJReqwYYKshmJxt2GS2",
  campus: "Sede Cali",
  avatar:
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
};

const accountItems = [
  { label: "Wallet Network", detail: "Metamask / Base Sepolia", icon: Wallet },
  { label: "Notificaciones", detail: "Historial del sistema", icon: Bell },
  { label: "Edit Profile", detail: "Datos de cuenta", icon: UserPen },
  { label: "Payment Options", detail: "Tarjetas y pagos", icon: CreditCard },
];

const generalItems = [
  { label: "Support", detail: "Asistente LazosTech", icon: CircleHelp },
  { label: "Terms of Service", detail: "Politicas y uso", icon: ShieldCheck },
  { label: "Invite Friends", detail: "Referidos", icon: HandCoins },
];

function formatCompact(value: bigint | number) {
  const numberValue = typeof value === "bigint" ? Number(value) : value;
  return new Intl.NumberFormat("es-CO", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(numberValue);
}

function BalanceTile({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: "red" | "green" | "money" | "token";
}) {
  return (
    <article className={`profile-balance-tile is-${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function DrawerRow({
  label,
  detail,
  icon: Icon,
  general = false,
}: {
  label: string;
  detail: string;
  icon: typeof Wallet;
  general?: boolean;
}) {
  return (
    <button className={`profile-drawer__row ${general ? "is-general" : ""}`} type="button">
      <span className="profile-drawer__row-main">
        <span className="profile-drawer__icon">
          <Icon size={16} />
        </span>
        <span className="profile-drawer__copy">
          <strong>{label}</strong>
          <small>{detail}</small>
        </span>
      </span>
      <ChevronRight size={16} />
    </button>
  );
}

export default function PerfilPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { address } = useAccount();

  const { data, isLoading } = useReadContracts({
    allowFailure: true,
    contracts: address
      ? [
          {
            address: NUDOS_TOKEN_ADDRESS,
            abi: tokenAbi,
            functionName: "balanceOf",
            args: [address],
          },
          {
            address: NUDOS_TOKEN_ADDRESS,
            abi: tokenAbi,
            functionName: "symbol",
          },
          {
            address: NUDOS_DIAMOND_ADDRESS,
            abi: diamondAbi,
            functionName: "getTickets",
            args: [address],
          },
          {
            address: NUDOS_DIAMOND_ADDRESS,
            abi: diamondAbi,
            functionName: "getUserRecycleImpact",
            args: [address],
          },
        ]
      : [],
    query: {
      enabled: Boolean(address),
      refetchInterval: 15000,
    },
  });

  const rawBalance = (data?.[0]?.result as bigint | undefined) ?? 0n;
  const symbol = (data?.[1]?.result as string | undefined) ?? "NUDOS";
  const tickets = (data?.[2]?.result as bigint | undefined) ?? 0n;
  const recycleImpact = (data?.[3]?.result as
    | readonly [bigint, bigint, bigint, bigint, bigint]
    | undefined) ?? [0n, 0n, 0n, 0n, 0n];

  const [aluminium, plastic, cardboard, glass] = recycleImpact;
  const totalMaterials = aluminium + plastic + cardboard + glass;

  const values = useMemo(
    () => ({
      tokens: isLoading ? "..." : formatCompact(Number(formatEther(rawBalance))),
      tickets: isLoading ? "..." : tickets.toString(),
      recycleCount: isLoading ? "..." : totalMaterials.toString(),
      recycleHistoric: isLoading ? "..." : formatCompact(totalMaterials),
      savings: isLoading ? "..." : formatCompact(Number(totalMaterials) * 120),
      nudosHistoric: isLoading ? "..." : formatCompact(Number(formatEther(rawBalance))),
      symbol,
    }),
    [isLoading, rawBalance, tickets, totalMaterials, symbol],
  );

  return (
    <>
      <main className="profile-screen">
        <section className="profile-shell">
          <header className="profile-topbar">
            <button
              className="profile-topbar__menu"
              onClick={() => setMenuOpen(true)}
              type="button"
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </button>
          </header>

          <section className="profile-status-row">
            <div className="profile-status-card">
              <span className="profile-status-card__check">✓</span>
              <div>
                <strong>Estudiante</strong>
                <small>{student.studentType}</small>
              </div>
            </div>
            <div className="profile-status-card">
              <span className="profile-status-card__check">✓</span>
              <div>
                <strong>Bono</strong>
                <small>{student.bonus}</small>
              </div>
            </div>
          </section>

          <section className="profile-account-row">
            <div className="profile-avatar-ring">
              <Image
                src={student.avatar}
                alt={student.name}
                width={76}
                height={76}
                className="profile-avatar-ring__image"
              />
            </div>

            <div className="profile-head-metrics">
              <div className="profile-head-metric">
                <strong>{values.tokens}</strong>
                <span>TOKENS</span>
              </div>
              <div className="profile-head-metric">
                <strong>{values.tickets}</strong>
                <span>{values.symbol}</span>
              </div>
              <div className="profile-head-metric">
                <strong>{values.recycleCount}</strong>
                <span>RECICLA</span>
              </div>
            </div>
          </section>

          <section className="profile-card-id">
            <div className="profile-card-id__copy">
              <strong>{student.name}</strong>
              <span>{student.code}</span>
              <small>{student.userId}</small>
            </div>

            <div className="profile-card-id__barcode">
              {Array.from({ length: 34 }).map((_, index) => (
                <span
                  key={index}
                  className={`profile-card-id__bar ${index % 4 === 0 ? "is-wide" : ""}`}
                />
              ))}
              <p>https://lazos.go/user</p>
            </div>

            <div className="profile-card-id__uni">
              <div className="profile-card-id__uni-badge">
                <Image src="/lazosGO.png" alt="Universidad" width={32} height={32} />
              </div>
              <span>{student.campus}</span>
            </div>
          </section>

          <section className="profile-history-grid">
            <BalanceTile value={values.tickets} label="TICKETS" tone="red" />
            <BalanceTile value={values.recycleHistoric} label="RECICLAJE" tone="green" />
            <BalanceTile value={values.savings} label="AHORRO" tone="money" />
            <BalanceTile value={values.nudosHistoric} label={values.symbol} tone="token" />
          </section>
        </section>
      </main>

      <div
        className={`profile-drawer-overlay ${menuOpen ? "is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      <aside className={`profile-drawer ${menuOpen ? "is-open" : ""}`}>
        <div className="profile-drawer__head">
          <button className="profile-drawer__close" onClick={() => setMenuOpen(false)} type="button">
            <X size={16} />
          </button>

          <div className="profile-drawer__identity">
            <div className="profile-avatar-ring is-small">
              <Image
                src={student.avatar}
                alt={student.name}
                width={52}
                height={52}
                className="profile-avatar-ring__image"
              />
            </div>

            <div>
              <strong>{student.name}</strong>
              <span>[ Correo ]</span>
              <small>[ {student.code} ]</small>
              <small>[ {student.campus} ]</small>
            </div>
          </div>
        </div>

        <div className="profile-drawer__body">
          <section className="profile-drawer__section">
            <p>Cuenta</p>
            {accountItems.map(item => (
              <DrawerRow key={item.label} {...item} />
            ))}
          </section>

          <section className="profile-drawer__section">
            <p>General</p>
            {generalItems.map(item => (
              <DrawerRow key={item.label} {...item} general />
            ))}
          </section>

          <Link href="/" className="profile-drawer__logout" onClick={() => setMenuOpen(false)}>
            Cerrar sesion
          </Link>
        </div>
      </aside>
    </>
  );
}
