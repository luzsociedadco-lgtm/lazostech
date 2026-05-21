"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/perfil",
    label: "Perfil",
    src: "/footer-nav/01-wallet.svg",
    accessKey: "perfil",
    sizeClass: "is-wallet"
  },
  {
    href: "/tickets",
    label: "Tickets",
    src: "/footer-nav/02-tickets.svg",
    accessKey: "tickets",
    sizeClass: "is-ticket"
  },
  {
    href: "/reciclaje",
    label: "Recicla",
    src: "/footer-nav/03-recycle.svg",
    accessKey: "reciclaje",
    sizeClass: "is-recycle"
  },
  {
    href: "/marketplace",
    label: "Marketplace",
    src: "/footer-nav/04-handshake.svg",
    accessKey: "marketplace",
    sizeClass: "is-market"
  },
  {
    href: "/dao",
    label: "DAO",
    src: "/footer-nav/05-votebox.svg",
    accessKey: "dao",
    sizeClass: "is-dao"
  }
] as const;

export default function FooterNav() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="app-nav">
      <div className="app-nav__inner">
        {navItems.map(({ href, label, src, accessKey, sizeClass }) => {
          const active = pathname === href;
          const enabled = true;
          // const enabled = user?.access[accessKey] ?? accessKey === "perfil";

          if (!enabled) {
            return (
              <div key={href} className="app-nav__item is-disabled" aria-label={label}>
                <span className="app-nav__icon-shell">
                  <img src={src} alt="" className={`app-nav__asset ${sizeClass}`} />
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
                <img src={src} alt="" className={`app-nav__asset ${sizeClass}`} />
              </span>
              <span className="app-nav__label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
