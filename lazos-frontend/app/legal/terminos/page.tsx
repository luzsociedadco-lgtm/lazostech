import Link from "next/link";

import styles from "../legal.module.css";

export default function TermsDraftPage() {
  return (
    <main className={styles.main}>
      <p className={styles.draft}>Borrador · No vigente</p>
      <h1 className={styles.title}>Términos de uso</h1>
      <p className={styles.lead}>
        Versión de trabajo del 13 de agosto de 2026. Debe completarse con la
        identidad, domicilio y datos de contacto de la entidad operadora antes
        de aprobación o publicación efectiva.
      </p>
      <p className={styles.notice}>
        No aceptes este borrador ni lo uses como fundamento para una transacción.
        No ha sido aprobado por asesor jurídico ni por la entidad operadora.
      </p>

      <article className={styles.article}>
        <section>
          <h2>1. Servicio propuesto</h2>
          <p>
            LazosTech propone herramientas para identidad de perfil, reciclaje,
            credenciales, coordinación comunitaria, marketplace y operaciones
            con contratos inteligentes en Base. Las funciones efectivamente
            disponibles, sus costos y sus restricciones deben mostrarse antes de
            cada acción.
          </p>
        </section>
        <section>
          <h2>2. Cuenta y wallet</h2>
          <p>
            La persona usuaria es responsable de proteger su cuenta, dispositivo,
            wallet y mecanismos de recuperación. LazosTech no solicita frases
            semilla ni claves privadas. Las transacciones onchain deben revisarse
            y firmarse en la wallet; una vez confirmadas pueden ser irreversibles.
          </p>
        </section>
        <section>
          <h2>3. Información y costos</h2>
          <p>
            Antes de una operación se deben informar de forma clara la red, el
            contrato, el activo, el valor, las comisiones conocidas y el efecto
            esperado. Los costos de red pueden variar y son independientes de la
            aplicación. Cualquier precio al consumidor debe presentarse también
            conforme a los requisitos aplicables en Colombia.
          </p>
        </section>
        <section>
          <h2>4. Usos prohibidos</h2>
          <ul>
            <li>Acceder a cuentas, roles o activos sin autorización.</li>
            <li>Usar el servicio para fraude, lavado de activos o actividades ilícitas.</li>
            <li>Alterar evidencia, credenciales o información de reciclaje.</li>
            <li>Interferir con la seguridad, disponibilidad o integridad del sistema.</li>
          </ul>
        </section>
        <section>
          <h2>5. Disponibilidad y cambios</h2>
          <p>
            La interfaz, APIs y relayers pueden suspenderse por mantenimiento o
            seguridad. Esa suspensión no detiene necesariamente los contratos ni
            las transferencias directas onchain. Las condiciones materiales no
            deben cambiarse retroactivamente; una versión aprobada deberá indicar
            vigencia, mecanismo de aviso y aceptación.
          </p>
        </section>
        <section>
          <h2>6. Soporte, quejas y controversias</h2>
          <p>
            El canal técnico preliminar es
            {" "}<a href="mailto:security@lazostech.org">security@lazostech.org</a>.
            Antes de vigencia deben añadirse el canal de atención al consumidor,
            tiempos de respuesta, procedimiento de reclamación, ley aplicable y
            mecanismo de solución de controversias revisados por asesor jurídico.
          </p>
        </section>
      </article>
      <Link href="/legal" className={styles.back}>← Volver al estado legal</Link>
    </main>
  );
}
