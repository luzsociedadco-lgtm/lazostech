"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Handshake,
  Recycle,
  Ticket,
  UtensilsCrossed,
  WalletCards
} from "lucide-react";

const navItems = [
  { href: "/perfil", label: "Perfil", Icon: WalletCards, accessKey: "perfil" },
  { href: "/tickets", label: "Tickets", Icon: UtensilsCrossed, accessKey: "tickets" },
  { href: "/reciclaje", label: "Recicla", Icon: Recycle, accessKey: "reciclaje" },
  { href: "/dao", label: "Lazos", Icon: Handshake, accessKey: "dao" },
  { href: "/marketplace", label: "Otros", Icon: Ticket, accessKey: "marketplace" }
] as const;

export default function FooterNav() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="app-nav">
      <div className="app-nav__inner">
        {navItems.map(({ href, label, Icon, accessKey }) => {
          const active = pathname === href;
          const enabled = true;
          // const enabled = user?.access[accessKey] ?? accessKey === "perfil";

          if (!enabled) {
            return (
              <div key={href} className="app-nav__item is-disabled">
                <Icon size={20} strokeWidth={2} />
                <span>{label}</span>
              </div>
            );
          }

          return (
            <Link key={href} href={href} className={`app-nav__item ${active ? "is-active" : ""}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
