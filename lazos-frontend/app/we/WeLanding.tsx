"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CircleUserRound,
  HandHeart,
  Handshake,
  Layers3,
  Menu,
  Recycle,
  TicketCheck,
  X
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import styles from "./we.module.css";

const solutions = [
  {
    icon: TicketCheck,
    number: "01",
    title: "Tickets para el almuerzo",
    description:
      "Al tener reciclaje ahorrado, puedes intercambiarlo por almuerzos del restaurante."
  },
  {
    icon: CalendarClock,
    number: "02",
    title: "Gestión de turnos",
    description:
      "Una fila digital ayuda a optimizar el tiempo de espera en el restaurante universitario."
  },
  {
    icon: Handshake,
    number: "03",
    title: "Marketplace de emprendedores universitarios",
    description:
      "Con un marketplace de emprendedores fomentamos el intercambio y el reciclaje dentro y fuera del campus."
  },
  {
    icon: HandHeart,
    number: "04",
    title: "Iniciativas sostenibles",
    description:
      "Iniciativas comunitarias alrededor de la sostenibilidad y la recolección de residuos mediante recompensas."
  }
] as const;

const team = [
  { name: "Alejo Realpe", role: "CEO · CTO · Founder", image: "/we/alejo.avif" },
  { name: "Susan Taborda", role: "Technological Assistance", image: "/we/susan.avif" },
  { name: "Martha Plazas", role: "Chief Operating Officer", image: "/we/martha.avif" },
  { name: "Mayerly Lemos", role: "Environmental Research", image: "/we/mayerly.avif" },
  { name: "Juan Burgos", role: "Legal Officer", image: "/we/juan.avif" }
] as const;

const partners = [
  { name: "MIT", image: "/we/ally-mit.svg" },
  { name: "NIDO", image: "/we/ally-nido.svg" },
  { name: "Universidad del Valle", image: "/we/ally-uv.svg" },
  { name: "Cali Chamber of Commerce", image: "/we/ally-ccc.svg" }
] as const;

export default function WeLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = "true";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -7% 0px" }
    );

    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const openNewsletter = () => {
    setNewsletterSubmitted(false);
    setNewsletterStatus("idle");
    setNewsletterMessage("");
    setNewsletterOpen(true);
  };
  const submitNewsletter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const city = String(formData.get("city") || "");
    const organization = String(formData.get("organization") || "");
    const interest = String(formData.get("interest") || "");
    const message = String(formData.get("message") || "");

    setNewsletterStatus("submitting");
    setNewsletterMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, city, organization, interest, message })
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setNewsletterStatus("error");
        setNewsletterMessage(result.error || "No pudimos registrar tu correo. Intenta de nuevo.");
        return;
      }

      setNewsletterSubmitted(true);
      setNewsletterStatus("idle");
    } catch {
      setNewsletterStatus("error");
      setNewsletterMessage("No pudimos conectar con el registro. Intenta de nuevo.");
    }
  };

  return (
    <main className={`we-page ${styles.page}`}>
      <header className={styles.header}>
        <Link href="#inicio" className={styles.logoLink} aria-label="LazosTech, inicio">
          <Image src="/we/logo.avif" alt="LazosTech" width={291} height={90} priority />
        </Link>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`} aria-label="Secciones">
          <div className={styles.navMobileTop}>
            <Link href="/" onClick={closeMenu}>
              <CircleUserRound aria-hidden="true" />
              <span>Entrar</span>
            </Link>
          </div>
          <a href="#inicio" onClick={closeMenu}>Inicio</a>
          <a href="#nosotros" onClick={closeMenu}>Nosotros</a>
          <a href="#como-funciona" onClick={closeMenu}>Cómo funciona</a>
          <a href="#contacto" onClick={closeMenu}>Contacto</a>
          <Link href="/" className={styles.navApp} onClick={closeMenu}>App</Link>
        </nav>

        <Link href="/" className={styles.enterButton}>Entrar</Link>
        <button
          type="button"
          className={styles.menuButton}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(value => !value)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>

      <section className={styles.hero} id="inicio">
        <div className={styles.heroGlow} />
        <div className={styles.heroCopy} data-reveal>
          <p className={styles.kicker}>
            <span>Innovación social</span>
            <span>Universidad</span>
            <span>Economía circular</span>
          </p>
          <h1>
            Convertimos el reciclaje en oportunidades mediante <span>Blockchain</span>
          </h1>
          <p>
            Somos una startup universitaria de innovación social que conecta acciones
            sostenibles, comunidad y oportunidades reales.
          </p>
          <div className={styles.heroActions}>
            <Link href="/" className={styles.goldButton}>
              Ir a la app <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
        </div>

        <div className={styles.heroArt} data-reveal>
          <div className={styles.heroOrbit} />
          <Image
            src="/we/hero-art.avif"
            alt="Ecosistema digital LazosTech"
            width={661}
            height={440}
            priority
          />
        </div>

        <a href="#nosotros" className={styles.scrollCue} aria-label="Ver la siguiente sección">
          <ArrowDown aria-hidden="true" size={18} />
        </a>
      </section>

      <section className={styles.intro} id="nosotros">
        <div className={styles.aboutIntro} data-reveal>
          <p className={styles.sectionLabel}>Nosotros · Lo que hacemos</p>
          <p>
            LazosTech es una Dapp que construye economía circular. Nuestra tecnología conecta
            estudiantes, aliados y universidades, registrando acciones y transformando el
            impacto colectivo en beneficios verificables para la comunidad.
          </p>
        </div>

        <article className={styles.storyRow} data-reveal>
          <div className={styles.storyImage}>
            <Image
              src="/we/recycle-culture.avif"
              alt="Cultura de reciclaje en el campus"
              width={980}
              height={801}
            />
          </div>
          <div className={styles.storyCopy}>
            <span>01</span>
            <Recycle className={styles.storyIcon} aria-hidden="true" />
            <h2>Fomentamos una cultura de reciclaje dentro del campus</h2>
            <p>
              Recolectamos el material reciclable y promovemos la cultura de darle valor a los
              residuos aprovechables en la comunidad universitaria.
            </p>
          </div>
        </article>

        <article className={`${styles.storyRow} ${styles.storyRowReverse}`} data-reveal>
          <div className={styles.storyImage}>
            <Image
              src="/we/data-science.avif"
              alt="Tecnología y ciencia de datos"
              width={488}
              height={749}
            />
          </div>
          <div className={styles.storyCopy}>
            <span>02</span>
            <BarChart3 className={styles.storyIcon} aria-hidden="true" />
            <h2>Aceleración de la ciencia de datos</h2>
            <p>
              En la convergencia de información usamos vectores transversales para generar y
              medir el impacto triple hélice. Este proyecto integra beneficios y soluciones
              prácticas para los estudiantes.
            </p>
          </div>
        </article>

        <article className={styles.storyRow} data-reveal>
          <div className={styles.storyImage}>
            <Image
              src="/we/refi-economy.avif"
              alt="Economía regenerativa y tecnología"
              width={1176}
              height={895}
            />
          </div>
          <div className={styles.storyCopy}>
            <span>03</span>
            <Layers3 className={styles.storyIcon} aria-hidden="true" />
            <h2>Construimos economía con ReFi</h2>
            <p>
              Le damos valor a los residuos físicos desde la Universidad del Valle, generando
              impacto económico y social mediante un token nativo llamado
              <strong> $NUDOS</strong>.
            </p>
          </div>
        </article>
      </section>

      <section className={styles.solutions} id="como-funciona">
        <div className={styles.solutionsLayout}>
          <div className={styles.ecosystemImage}>
            <Image
              src="/we/recycle-culture.avif"
              alt="Ecosistema universitario de economía circular"
              width={674}
              height={803}
            />
          </div>

          <div className={styles.solutionsHeader}>
            <p className={styles.sectionLabel}>Economía circular</p>
            <h2>Somos un ecosistema de economía circular.</h2>
            <p>
              La plataforma permite a estudiantes participar, colaborar y acceder a
              beneficios dentro de la comunidad universitaria.
            </p>
          </div>

          <div className={styles.solutionList}>
            {solutions.map(({ icon: Icon, ...item }) => (
              <article key={item.number} className={styles.solutionItem}>
                <div className={styles.solutionIcon}>
                  <Icon aria-hidden="true" />
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <ArrowRight aria-hidden="true" size={21} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.tokenSection}>
        <div className={styles.tokenArtwork} data-reveal>
          <Image
            src="/we/data-science.avif"
            alt="Visualización de una economía universitaria conectada"
            fill
            sizes="(max-width: 960px) 100vw, 50vw"
          />
          <h2>
            Todo esto gracias a una criptomoneda universitaria soportada en reciclaje,
            que le da vida al ecosistema.
          </h2>
        </div>

        <div className={styles.tokenCopy} data-reveal>
          <p className={styles.sectionLabel}>La infraestructura del ecosistema</p>
          <p>
            La criptomoneda permite darle circulación a una economía dentro del campus.
            Soportada en acciones de reciclaje, genera circulación entre emprendimientos,
            materiales y una moneda digital trazada en la cadena de bloques.
          </p>
          <p>
            Por medio de una wallet universitaria conectada en tiempo real, fomentamos el
            reciclaje con incentivos digitales y aportamos trazabilidad al material
            intercambiado.
          </p>
          <p>
            Con esta moneda podemos impulsar trueques y dar visibilidad a emprendimientos
            universitarios dentro de una economía circular.
          </p>
          <Link href="/" className={styles.goldButton}>
            Registrarse <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </section>

      <section className={styles.teamSection} id="equipo">
        <div className={styles.teamHeading} data-reveal>
          <p className={styles.sectionLabel}>Las personas detrás de LazosTech</p>
        </div>

        <div className={styles.teamGrid}>
          {team.map(member => (
            <article className={styles.teamCard} key={member.name} data-reveal>
              <div className={styles.teamPortrait}>
                <Image src={member.image} alt={member.name} width={149} height={167} />
              </div>
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.partners}>
        <div className={styles.partnerGrid} aria-label="Organizaciones aliadas">
          <p>Nuestros<br />socios</p>
          {partners.map(partner => (
            <div className={styles.partnerLogo} key={partner.name}>
              <img src={partner.image} alt={partner.name} />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.videoCta}>
        <div className={styles.videoVisual}>
          <Image
            src="/we/ecosystem.avif"
            alt=""
            fill
            sizes="(max-width: 700px) 100vw, 55vw"
            className={styles.videoBackground}
          />
          <Image
            src="/we/video-poster.avif"
            alt=""
            width={500}
            height={500}
            className={styles.videoSphere}
          />
          <h2>¿Estás listo para revolucionar la criptoeconomía?</h2>
        </div>
        <div className={styles.videoContent} data-reveal>
          <p>Únete a nuestro lanzamiento Web3 desde la Universidad del Valle.</p>
          <p>
            Ingresa para estar al tanto de las novedades y alternativas disponibles.
          </p>
          <button type="button" className={styles.goldButton} onClick={openNewsletter}>
            JOIN <ArrowRight aria-hidden="true" size={18} />
          </button>
        </div>
      </section>

      <footer className={styles.footer} id="contacto">
        <div className={styles.footerBrand}>
          <Image src="/we/logo.avif" alt="LazosTech" width={291} height={90} />
          <p>Reciclaje, comunidad y tecnología para<br />transformar el campus universitario.</p>
        </div>
        <div className={styles.footerLinks}>
          <a href="#inicio">Inicio</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#como-funciona">Cómo funciona</a>
          <Link href="/">App</Link>
        </div>
        <div className={styles.footerMeta}>
          <p>Universidad del Valle · Colombia</p>
          <p>© {new Date().getFullYear()} LazosTech</p>
        </div>
      </footer>

      {newsletterOpen && (
        <div
          className={styles.newsletterOverlay}
          role="presentation"
          onMouseDown={() => setNewsletterOpen(false)}
        >
          <section
            className={styles.newsletterModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="newsletter-title"
            onMouseDown={event => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.newsletterClose}
              aria-label="Cerrar formulario"
              onClick={() => setNewsletterOpen(false)}
            >
              <X aria-hidden="true" />
            </button>

            {newsletterSubmitted ? (
              <div className={styles.newsletterSuccess}>
                <p className={styles.sectionLabel}>LazosTech Web3 Newsletter</p>
                <h2 id="newsletter-title">Gracias por sumarte.</h2>
                <p>Tu correo quedó registrado para recibir las novedades del proyecto.</p>
                <button type="button" className={styles.goldButton} onClick={() => setNewsletterOpen(false)}>
                  Entendido <ArrowRight aria-hidden="true" size={18} />
                </button>
              </div>
            ) : (
              <form className={styles.newsletterForm} onSubmit={submitNewsletter}>
                <p className={styles.sectionLabel}>LazosTech Web3 Newsletter</p>
                <h2 id="newsletter-title">Únete a las novedades del campus.</h2>
                <p>Recibe avances, alianzas e iniciativas de economía circular de LazosTech.</p>
                <div className={styles.newsletterGrid}>
                  <label>
                    <span>Nombre</span>
                    <input id="newsletter-name" name="name" type="text" autoComplete="name" required />
                  </label>
                  <label>
                    <span>Correo institucional o personal</span>
                    <input id="newsletter-email" name="email" type="email" autoComplete="email" required />
                  </label>
                  <label>
                    <span>Ciudad</span>
                    <input id="newsletter-city" name="city" type="text" autoComplete="address-level2" />
                  </label>
                  <label>
                    <span>Universidad u organización</span>
                    <input id="newsletter-organization" name="organization" type="text" autoComplete="organization" />
                  </label>
                  <label className={styles.newsletterWide}>
                    <span>Interés principal</span>
                    <select id="newsletter-interest" name="interest" defaultValue="">
                      <option value="" disabled>Selecciona una opción</option>
                      <option value="estudiante">Participar como estudiante</option>
                      <option value="universidad">Explorar LazosTech para una universidad</option>
                      <option value="aliado">Sumarme como aliado o patrocinador</option>
                      <option value="emprendimiento">Marketplace y emprendimientos universitarios</option>
                      <option value="comunidad">Recibir novedades del proyecto</option>
                    </select>
                  </label>
                  <label className={styles.newsletterWide}>
                    <span>Mensaje opcional</span>
                    <textarea
                      id="newsletter-message"
                      name="message"
                      rows={3}
                      placeholder="Cuéntanos si representas una universidad, colectivo, aliado o si tienes una idea para el campus."
                    />
                  </label>
                </div>
                {newsletterStatus === "error" && (
                  <p className={styles.newsletterError} role="alert">
                    {newsletterMessage}
                  </p>
                )}
                <button
                  type="submit"
                  className={styles.goldButton}
                  disabled={newsletterStatus === "submitting"}
                >
                  {newsletterStatus === "submitting" ? "Registrando..." : "Unirme"}{" "}
                  <ArrowRight aria-hidden="true" size={18} />
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
