import type { Metadata } from "next";
import Link from "next/link";

import styles from "./legal.module.css";

export const metadata: Metadata = {
  title: "Documentos legales en revisión | LazosTech",
  description: "Borradores de términos, privacidad y riesgos del token NUDOS.",
  robots: { index: false, follow: false },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`legal-site ${styles.site}`}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          LazosTech
        </Link>
        <nav className={styles.nav} aria-label="Documentos legales">
          <Link href="/legal">Estado</Link>
          <Link href="/legal/terminos">Términos</Link>
          <Link href="/legal/privacidad">Privacidad</Link>
          <Link href="/legal/riesgos-token">Riesgos NUDOS</Link>
        </nav>
      </header>
      {children}
      <footer className={styles.footer}>
        Borradores para revisión profesional. No están vigentes y no sustituyen
        asesoría jurídica.
      </footer>
    </div>
  );
}
