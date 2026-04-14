"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Handshake,
  Recycle,
  Ticket,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";

const navItems = [
  { href: "/perfil", label: "Wallet", Icon: WalletCards },
  { href: "/tickets", label: "Tickets", Icon: UtensilsCrossed },
  { href: "/reciclaje", label: "Recicla", Icon: Recycle },
  { href: "/dao", label: "Lazos", Icon: Handshake },
  { href: "/marketplace", label: "Otros", Icon: Ticket },
];

export default function FooterNav() {
  const pathname = usePathname();
  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="app-nav">
      <div className="app-nav__inner">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`app-nav__item ${active ? "is-active" : ""}`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
