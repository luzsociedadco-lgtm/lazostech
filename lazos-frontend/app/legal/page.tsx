import Link from "next/link";

import styles from "./legal.module.css";

const documents = [
  {
    href: "/legal/terminos",
    title: "Términos de uso",
    description: "Reglas propuestas para acceso, wallets, servicios y solución de problemas.",
  },
  {
    href: "/legal/privacidad",
    title: "Privacidad y datos",
    description: "Inventario preliminar de datos, finalidades, derechos y limitaciones onchain.",
  },
  {
    href: "/legal/riesgos-token",
    title: "Riesgos del token",
    description: "Divulgación clara sobre custodia, volatilidad, contratos y ausencia de garantías.",
  },
];

export default function LegalIndexPage() {
  return (
    <main className={styles.main}>
      <p className={styles.draft}>Borrador · No vigente</p>
      <h1 className={styles.title}>Transparencia antes de mainnet.</h1>
      <p className={styles.lead}>
        Estos documentos permiten revisar el producto real antes del lanzamiento.
        Aún requieren identificar formalmente a la entidad operadora, validación
        jurídica colombiana, aprobación interna, fecha de vigencia y registro de
        aceptación de los usuarios.
      </p>
      <p className={styles.notice}>
        Ningún texto de esta sección constituye hoy un contrato, una política
        vigente ni una promesa de rendimiento. La aplicación no debe pedir su
        aceptación hasta que desaparezca este aviso y exista una versión aprobada.
      </p>
      <section className={styles.grid} aria-label="Borradores disponibles">
        {documents.map((document) => (
          <Link key={document.href} href={document.href} className={styles.card}>
            <div>
              <h2>{document.title}</h2>
              <p>{document.description}</p>
            </div>
            <span>Revisar borrador →</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
