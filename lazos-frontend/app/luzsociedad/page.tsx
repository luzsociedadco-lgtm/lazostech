import type { Metadata } from "next";
import Image from "next/image";

import styles from "./luzsociedad.module.css";

export const metadata: Metadata = {
  title: "LUZSOCIEDAD | Simpleza en lo complejo",
  description:
    "Una historia de comunidad, memoria y transformación nacida en Siloé en abril de 2020."
};

const moments = [
  {
    year: "2020",
    title: "Responder",
    body:
      "La pandemia nos puso frente a necesidades urgentes: alimento, cuidado y redes de apoyo para personas en situación de vulnerabilidad."
  },
  {
    year: "2021",
    title: "Recuperar",
    body:
      "La Estrella se convirtió en un lugar para encontrarnos: escaleras, murales, un mirador comunitario y nuevas formas de narrar Siloé."
  },
  {
    year: "2022",
    title: "Organizar",
    body:
      "El centro comunitario, el cuidado animal, la cultura y las acciones ambientales ampliaron el proceso más allá de un solo espacio."
  },
  {
    year: "2023",
    title: "Conectar",
    body:
      "La Universidad del Valle abrió un puente entre la experiencia territorial, la investigación y la innovación social."
  },
  {
    year: "2024",
    title: "Explorar",
    body:
      "Empezamos a preguntarnos cómo reconocer, medir y convertir las acciones positivas en oportunidades reales."
  },
  {
    year: "2025—26",
    title: "Construir",
    body:
      "La experiencia acumulada comenzó a convertirse en una infraestructura capaz de ampliar el impacto."
  }
] as const;

function SunMark({ light = false }: { light?: boolean }) {
  return (
    <svg
      className={styles.sunMark}
      viewBox="0 0 160 160"
      aria-hidden="true"
      focusable="false"
      data-light={light ? "true" : "false"}
    >
      <circle cx="80" cy="80" r="38" />
      <path d="M80 8v34M80 118v34M8 80h34M118 80h34M29 29l24 24M107 107l24 24M131 29l-24 24M53 107l-24 24" />
    </svg>
  );
}

function Figure({
  src,
  alt,
  caption,
  className
}: {
  src: string;
  alt: string;
  caption: string;
  className?: string;
}) {
  return (
    <figure className={`${styles.figure} ${className ?? ""}`}>
      <div className={styles.figureImage}>
        <Image src={src} alt={alt} fill sizes="(max-width: 760px) 100vw, 70vw" />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export default function LuzSociedadPage() {
  return (
    <main className={`luzsociedad-page ${styles.page}`}>
      <header className={styles.header}>
        <a href="#historia" className={styles.skipLink}>
          Ir a la historia
        </a>
        <div className={styles.wordmark} aria-label="LuzSociedad">
          <SunMark light />
          <span>
            LUZ
            <br />
            SOCIEDAD
          </span>
        </div>
        <p>Siloé · Cali</p>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroSymbol}>
          <SunMark light />
        </div>
        <div className={styles.heroCopy}>
          <p>Abril de 2020 — hoy</p>
          <h1 id="hero-title">
            Nacimos para responder.
            <em>Aprendimos a transformar.</em>
          </h1>
        </div>
        <p className={styles.heroIntro}>
          Responder fue actuar frente a lo urgente. Transformar fue construir
          para que algo distinto pudiera permanecer.
        </p>
      </section>

      <section className={styles.opening} aria-label="Origen de LuzSociedad">
        <p className={styles.sectionLabel}>01 / Por qué responder</p>
        <div className={styles.openingStatement}>
          <h2>Porque la urgencia no podía esperar.</h2>
          <p>
            En abril de 2020, la pandemia profundizó necesidades que ya estaban
            presentes. Responder significó movilizar alimento, cuidado y redes
            de apoyo para quienes estaban atravesando el momento más difícil.
          </p>
        </div>
        <div className={styles.openingNote}>
          <p>
            Transformar comenzó cuando entendimos que atender la emergencia era
            solo el inicio. Había que recuperar la confianza, organizar
            capacidades y crear oportunidades que permanecieran en el territorio.
          </p>
        </div>
      </section>

      <section className={styles.evidenceStrip} aria-label="Resultados documentados">
        <article>
          <strong>+30</strong>
          <span>jóvenes vinculados a procesos de liderazgo y memoria</span>
        </article>
        <article>
          <strong>+1.000</strong>
          <span>raciones reportadas desde el comedor comunitario</span>
        </article>
        <article>
          <strong>2021</strong>
          <span>inicio del proceso de apropiación cultural en La Estrella</span>
        </article>
      </section>

      <section className={styles.lightChapter} aria-labelledby="light-title">
        <Figure
          src="/luzsociedad/la-estrella-original.jpg"
          alt="Estructura de La Estrella iluminada sobre el cielo de Siloé"
          caption="La Estrella, Siloé · registro original, septiembre de 2021"
          className={styles.heroFigure}
        />
        <div className={styles.lightCopy}>
          <p className={styles.sectionLabel}>02 / La Estrella</p>
          <h2 id="light-title">Un lugar abandonado comenzó a contar otra historia.</h2>
          <p>
            Vecinos, jóvenes, artistas y liderazgos barriales trabajaron en la
            construcción de escaleras, murales y espacios de encuentro alrededor
            del primer mirador comunitario del sector.
          </p>
        </div>
      </section>

      <section id="historia" className={styles.stories} aria-labelledby="stories-title">
        <div className={styles.storiesHeading}>
          <p className={styles.sectionLabel}>03 / Lo que se activó</p>
          <h2 id="stories-title">El espacio recuperado abrió nuevas posibilidades.</h2>
        </div>

        <article className={styles.story}>
          <div className={styles.storyIndex}>01</div>
          <div className={styles.storyCopy}>
            <p>Patrimonio y memoria</p>
            <h3>Las escaleras no solo llevaban al mirador.</h3>
            <p>
              También conectaron relatos, murales y recorridos sobre la historia
              del barrio. La comunidad dejó de ser objeto de una narrativa externa
              para convertirse en autora de su propia memoria.
            </p>
          </div>
          <Figure
            src="/luzsociedad/escaleras-la-estrella.jpeg"
            alt="Proceso comunitario de construcción de las escaleras del mirador de La Estrella"
            caption="Escaleras al mirador · agosto de 2021"
          />
        </article>

        <article className={`${styles.story} ${styles.storyReverse}`}>
          <div className={styles.storyIndex}>02</div>
          <div className={styles.storyCopy}>
            <p>Turismo comunitario</p>
            <h3>Visitar Siloé podía ser una forma de escuchar.</h3>
            <p>
              Turismo al Barrio y los primeros recorridos por la comuna
              articularon jóvenes, memoria, arte y pequeños emprendimientos.
              Las rutas buscaban romper estigmas y generar oportunidades desde
              la identidad del territorio.
            </p>
          </div>
          <Figure
            src="/luzsociedad/turismo-al-barrio.jpeg"
            alt="Jóvenes participando en una actividad de Turismo al Barrio en Siloé"
            caption="Turismo al Barrio · Secretaría de Turismo de Cali, octubre de 2021"
          />
        </article>

        <article className={styles.story}>
          <div className={styles.storyIndex}>03</div>
          <div className={styles.storyCopy}>
            <p>Cultura y cuidado</p>
            <h3>Un punto de encuentro puede sostener muchas cosas.</h3>
            <p>
              El centro y el comedor comunitario reunieron alimentación, diálogo
              intergeneracional y organización. Las activaciones artísticas
              llevaron música, muralismo y nuevas miradas al corazón del barrio.
            </p>
          </div>
          <Figure
            src="/luzsociedad/centro-comunitario.jpeg"
            alt="Jornada de adecuación del centro comunitario de La Estrella"
            caption="Limpieza del centro comunitario de La Estrella · marzo de 2022"
          />
        </article>
      </section>

      <section className={styles.quoteSection} aria-label="Idea central">
        <SunMark light />
        <blockquote>
          “Nuestra causa son las personas.”
        </blockquote>
        <p>
          Una frase escrita en los primeros ejercicios de modelo social y que
          todavía resume el proyecto.
        </p>
      </section>

      <section className={styles.journey} aria-labelledby="journey-title">
        <div className={styles.journeyHeading}>
          <p className={styles.sectionLabel}>04 / La evolución</p>
          <h2 id="journey-title">La forma cambió. El propósito permaneció.</h2>
        </div>
        <ol>
          {moments.map(moment => (
            <li key={moment.year}>
              <span>{moment.year}</span>
              <h3>{moment.title}</h3>
              <p>{moment.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.lazosChapter} aria-labelledby="lazos-title">
        <div className={styles.lazosMark}>
          <span>LUZSOCIEDAD</span>
          <SunMark light />
          <span>LAZOSTECH</span>
        </div>
        <div className={styles.lazosCopy}>
          <p>2025—2026 / Una nueva etapa</p>
          <h2 id="lazos-title">La tecnología no reemplazó la historia. La continuó.</h2>
          <div>
            <p>
              LUZSOCIEDAD articula el cambio social y comunitario. LazosTech
              desarrolla la infraestructura digital para reconocer, coordinar y
              escalar acciones como el reciclaje, la participación y el acceso a
              servicios universitarios.
            </p>
            <p>
              NUDOS nace dentro de esa infraestructura como una unidad de
              incentivo e impacto, no como una promesa especulativa.
            </p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <SunMark light />
        <p>
          Fortalecer personas.
          <br />
          Organizar comunidades.
          <br />
          Transformar territorios.
        </p>
        <div>
          <span>LUZSOCIEDAD</span>
          <span>Simpleza en lo complejo</span>
          <span>Siloé · Cali · Colombia</span>
        </div>
      </footer>
    </main>
  );
}
