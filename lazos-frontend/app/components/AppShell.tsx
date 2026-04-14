"use client";

import { WalletConnect } from "./WalletConnect";

export function AppShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="screen-shell">
      <section className="hero-panel">
        <div className="hero-panel__top">
          <div>
            <p className="hero-panel__eyebrow">{eyebrow}</p>
            <h1 className="hero-panel__title">{title}</h1>
            <p className="hero-panel__description">{description}</p>
          </div>
          <WalletConnect />
        </div>
        {children}
      </section>
    </main>
  );
}
