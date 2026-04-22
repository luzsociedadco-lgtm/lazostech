"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Handshake,
  Recycle,
  Utensils,
  Vote,
  WalletMinimal
} from "lucide-react";

const navItems = [
  { href: "/perfil", label: "Perfil", Icon: WalletMinimal, accessKey: "perfil" },
  { href: "/tickets", label: "Tickets", Icon: Utensils, accessKey: "tickets" },
  { href: "/reciclaje", label: "Recicla", Icon: Recycle, accessKey: "reciclaje" },
  { href: "/marketplace", label: "Marketplace", Icon: Handshake, accessKey: "marketplace" },
  { href: "/dao", label: "DAO", Icon: Vote, accessKey: "dao" }
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
              <div key={href} className="app-nav__item is-disabled" aria-label={label}>
                <span className="app-nav__icon-shell">
                  <Icon size={22} strokeWidth={2.2} />
                </span>
                <span className="app-nav__label">{label}</span>
              </div>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`app-nav__item ${active ? "is-active" : ""}`}
              aria-label={label}
              aria-current={active ? "page" : undefined}
            >
              <span className="app-nav__icon-shell">
                <Icon size={22} strokeWidth={active ? 2.6 : 2.2} />
              </span>
              <span className="app-nav__label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
