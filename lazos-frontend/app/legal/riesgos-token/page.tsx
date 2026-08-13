import Link from "next/link";

import styles from "../legal.module.css";

export default function TokenRiskDraftPage() {
  return (
    <main className={styles.main}>
      <p className={styles.draft}>Borrador · No vigente</p>
      <h1 className={styles.title}>Riesgos del token NUDOS</h1>
      <p className={styles.lead}>
        Divulgación preliminar para revisión jurídica y técnica. No es una oferta,
        recomendación de inversión ni promesa de valor o rentabilidad.
      </p>
      <p className={styles.notice}>
        NUDOS no es peso colombiano ni moneda de curso legal. La clasificación y
        obligaciones aplicables al modelo real deben ser confirmadas por asesoría
        jurídica antes del lanzamiento.
      </p>

      <article className={styles.article}>
        <section>
          <h2>1. Utilidad propuesta y ausencia de rendimiento</h2>
          <p>
            NUDOS se diseña como activo de utilidad para funciones del ecosistema.
            No promete apreciación, interés, dividendo, rendimiento fijo, recompra,
            redención en dinero ni equivalencia con el peso. Una recompensa en
            tokens no garantiza mercado, liquidez o valor económico.
          </p>
        </section>
        <section>
          <h2>2. Riesgos principales</h2>
          <ul>
            <li>Pérdida de acceso por compromiso o extravío de la wallet.</li>
            <li>Errores de usuario, dirección, red, contrato o firma irreversible.</li>
            <li>Vulnerabilidades en contratos, interfaces, relayers o proveedores.</li>
            <li>Volatilidad, falta de liquidez y posibilidad de valor cero.</li>
            <li>Congestión, comisiones, fallos o cambios en Base y su infraestructura.</li>
            <li>Cambios legales, tributarios, contables o de acceso a servicios.</li>
          </ul>
        </section>
        <section>
          <h2>3. Controles y límites</h2>
          <p>
            El contrato propuesto tiene suministro fijo y no incorpora mint,
            pausa, decomiso, propietario ni upgrade. Esto reduce poderes
            privilegiados, pero significa que LazosTech no puede congelar ni
            revertir transferencias directas. El Diamond sí contempla cambios
            gobernados por un Safe 2-de-3 y esos cambios introducen riesgos de
            gobernanza, implementación y operación.
          </p>
        </section>
        <section>
          <h2>4. Custodia y terceros</h2>
          <p>
            La persona usuaria controla su wallet y debe verificar cada firma. Los
            servicios externos pueden tener términos, disponibilidad y riesgos
            propios. LazosTech no debe custodiar semillas o claves privadas ni
            afirmar que una autoridad estatal o un seguro garantiza el token.
          </p>
        </section>
        <section>
          <h2>5. Antes de cualquier operación</h2>
          <ol>
            <li>Comprueba red, contrato, destinatario, monto, comisión y calldata.</li>
            <li>Comprende la función real y tu capacidad de asumir una pérdida total.</li>
            <li>No actúes por promesas de rendimiento ni presión de terceros.</li>
            <li>Busca asesoría jurídica, tributaria o financiera independiente cuando corresponda.</li>
          </ol>
        </section>
      </article>
      <Link href="/legal" className={styles.back}>← Volver al estado legal</Link>
    </main>
  );
}
