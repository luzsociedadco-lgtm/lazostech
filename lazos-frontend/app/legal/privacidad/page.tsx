import Link from "next/link";

import styles from "../legal.module.css";

export default function PrivacyDraftPage() {
  return (
    <main className={styles.main}>
      <p className={styles.draft}>Borrador · No vigente</p>
      <h1 className={styles.title}>Privacidad y tratamiento de datos</h1>
      <p className={styles.lead}>
        Marco preliminar basado en la Ley 1581 de 2012. Falta identificar al
        responsable legal, completar el inventario de encargados y aprobar los
        procedimientos antes de solicitar autorización a titulares.
      </p>
      <p className={styles.notice}>
        Esta página no es todavía la política de tratamiento de información y no
        debe usarse como registro de consentimiento.
      </p>

      <article className={styles.article}>
        <section>
          <h2>1. Responsable pendiente de completar</h2>
          <p>
            Nombre legal, NIT o identificación, domicilio, correo de privacidad y
            canal de consultas/reclamos: <strong>PENDIENTES DE APROBACIÓN</strong>.
            No se debe publicar una versión vigente sin estos datos.
          </p>
        </section>
        <section>
          <h2>2. Datos y finalidades previstas</h2>
          <ul>
            <li>Cuenta y perfil: autenticar, proteger y prestar el servicio.</li>
            <li>Wallet y transacciones públicas: proponer operaciones y reconciliar estado.</li>
            <li>Reciclaje y credenciales: registrar evidencia, impacto y autorizaciones.</li>
            <li>Soporte, seguridad y logs: prevenir abuso, diagnosticar incidentes y auditar cambios.</li>
            <li>Analítica: medir funcionamiento con minimización y configuración aprobada.</li>
          </ul>
          <p>
            El inventario definitivo debe precisar cada dato, finalidad, base de
            autorización, retención, destinatario y ubicación antes de vigencia.
          </p>
        </section>
        <section>
          <h2>3. Blockchain pública</h2>
          <p>
            Direcciones, transacciones y eventos publicados en Base pueden ser
            visibles globalmente y no pueden borrarse por la aplicación. Se deben
            mantener datos personales fuera de la cadena y anclar únicamente
            compromisos no identificables cuando sea posible. La versión aprobada
            debe explicar esta limitación antes de firmar.
          </p>
        </section>
        <section>
          <h2>4. Encargados y transferencias</h2>
          <p>
            El servicio puede depender de Supabase, Vercel, proveedores RPC,
            wallets, correo y analítica. Antes de vigencia deben documentarse su
            función, localización, transferencia o transmisión internacional,
            garantías contractuales y tiempo de conservación.
          </p>
        </section>
        <section>
          <h2>5. Derechos de titulares</h2>
          <p>
            La versión aprobada debe permitir conocer, actualizar, rectificar y,
            cuando corresponda, suprimir datos o revocar la autorización; también
            debe explicar consultas, reclamos, identidad requerida, plazos y el
            derecho a acudir ante la Superintendencia de Industria y Comercio una
            vez agotado el trámite aplicable.
          </p>
        </section>
        <section>
          <h2>6. Seguridad, menores y datos sensibles</h2>
          <p>
            Se aplicarán controles de acceso, minimización, registro y respuesta a
            incidentes. Los flujos para menores o datos sensibles deben permanecer
            deshabilitados hasta contar con necesidad, autorización y salvaguardas
            revisadas específicamente.
          </p>
        </section>
      </article>
      <Link href="/legal" className={styles.back}>← Volver al estado legal</Link>
    </main>
  );
}
