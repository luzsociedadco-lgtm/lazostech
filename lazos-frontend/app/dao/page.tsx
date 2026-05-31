"use client";

import { ArrowLeft, ChevronRight, CircleUserRound, Clock3, FileText, Paperclip } from "lucide-react";
import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import { FeatureGate } from "@/app/components/FeatureGate";
import ComingSoonCover from "@/app/components/ComingSoonCover";

const sessions = [
  { day: "03", month: "Febrero", year: "de 2025", code: "019", status: "Cerrado", participants: "18/26", quorum: "12" },
  { day: "23", month: "Abril", year: "de 2025", code: "020", status: "Cerrado", participants: "21/26", quorum: "12" },
  { day: "30", month: "Junio", year: "de 2025", code: "021", status: "Activo", participants: "15/26", quorum: "12" },
  { day: "11", month: "Julio", year: "de 2025", code: "022", status: "Pausa", participants: "11/26", quorum: "12" },
  { day: "24", month: "Agosto", year: "de 2025", code: "023", status: "Agenda", participants: "0/26", quorum: "12" },
  { day: "09", month: "Sept", year: "de 2025", code: "024", status: "Agenda", participants: "0/26", quorum: "12" },
  { day: "13", month: "Oct", year: "de 2025", code: "025", status: "Agenda", participants: "0/26", quorum: "12" },
  { day: "21", month: "Nov", year: "de 2025", code: "026", status: "Agenda", participants: "0/26", quorum: "12" },
  { day: "02", month: "Dic", year: "de 2025", code: "027", status: "Agenda", participants: "0/26", quorum: "12" },
  { day: "16", month: "Dic", year: "de 2025", code: "028", status: "Agenda", participants: "0/26", quorum: "12" },
];

const participations = [
  {
    title: "Intervencion de estudiante",
    body: "Propone priorizar laboratorios abiertos para proyectos de reciclaje y prototipado circular.",
    due: "Today, 6:20pm",
    action: "Transcrito",
  },
  {
    title: "Proposicion registrada",
    body: "Solicita revisar el presupuesto operativo antes de votar el acta final.",
    due: "Today, 6:20pm",
    action: "Transcrito",
  },
];

const projects = [
  {
    title: "Deliberacion del orden del dia",
    body: "Revision y aprobacion del orden del dia antes de abrir las deliberaciones de proyectos.",
    due: "Tuesday, 9:30am",
    phase: "complete",
  },
  {
    title: "Fondo de prototipado circular",
    body: "Deliberacion sobre recursos para estudiantes que transformen material reciclado en nuevos productos.",
    due: "Tuesday, 10:00am",
    phase: "voting",
  },
  {
    title: "Acta de participacion abierta",
    body: "Revision del mecanismo para publicar transcripciones y anexos al cierre de cada asamblea.",
    due: "Tuesday, 10:00am",
    phase: "ordered",
  },
];

const sessionParticipants = [
  "Laura Mejia",
  "Carlos Rojas",
  "Daniel Realpe",
  "Sofia Torres",
  "Miguel Andrade",
  "Valentina Ruiz",
  "Julian Moreno",
];

const sessionSummaries: Record<string, { debate: string[]; acta: string[]; anexos: string[] }> = {
  "019": {
    debate: [
      "Se revisaron inquietudes sobre la publicacion de transcripciones, acceso a informacion y claridad en el seguimiento de compromisos estudiantiles.",
      "La conversacion dejo como prioridad mejorar la trazabilidad de propuestas y consolidar un canal estable para registrar observaciones posteriores a cada sesion.",
    ],
    acta: [
      "Acta cerrada con constancia de quorum, intervenciones principales y acuerdos de publicacion de resultados.",
      "Se registro el compromiso de preparar un formato comun para reportes de debate y anexos.",
    ],
    anexos: [
      "Transcripcion resumida de intervenciones, listado de asistentes y soporte de propuestas iniciales.",
    ],
  },
  "020": {
    debate: [
      "La sesion se centro en presupuesto operativo, mecanismos de votacion y criterios para priorizar proyectos comunitarios.",
      "Se solicitaron ajustes para que las deliberaciones futuras separen claramente propuestas, actas y anexos.",
    ],
    acta: [
      "Acta aprobada con observaciones sobre presupuesto, responsables de seguimiento y tiempos de revision.",
    ],
    anexos: [
      "Documento de presupuesto preliminar, notas de mesa y referencias aportadas por estudiantes.",
    ],
  },
  "021": {
    debate: [
      "La asamblea abordo prototipado circular, orden del dia y participacion estudiantil en proyectos de transformacion de material reciclado.",
      "Quedaron abiertas deliberaciones para validar recursos, criterios de evaluacion y responsables de acompanamiento.",
    ],
    acta: [
      "Acta preliminar con estado de quorum, deliberaciones activas y acuerdos sujetos a votacion.",
    ],
    anexos: [
      "Borrador de convocatoria, transcripcion parcial y soportes sobre laboratorios circulares.",
    ],
  },
  default: {
    debate: [
      "Sesion programada para revisar propuestas comunitarias, participaciones estudiantiles y decisiones pendientes de la asamblea.",
      "El resumen final se consolidara cuando la mesa cargue transcripciones, actas y soportes del debate.",
    ],
    acta: [
      "Acta pendiente de generacion. Este espacio quedara reservado para acuerdos, decisiones y constancias oficiales.",
    ],
    anexos: [
      "Anexos pendientes. Aqui se listaran documentos, grabaciones, transcripciones y soportes cargados para la sesion.",
    ],
  },
};

const userAssemblyStats = [
  { label: "Participaciones", value: "18" },
  { label: "Propuestas", value: "4" },
  { label: "Votos realizados", value: "27" },
  { label: "Actas firmadas", value: "6" },
];

type DaoTab = "debate" | "acta" | "anexos";
type ProjectFilter = "pendiente" | "completo";
type ProjectPhase = "ordered" | "voting" | "complete";
type VoteChoice = "favor" | "contra" | "abstencion";

export default function DaoPage() {
  const [selectedSession, setSelectedSession] = useState(2);
  const [detailOpen, setDetailOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DaoTab>("debate");
  const [summaryTab, setSummaryTab] = useState<DaoTab>("debate");
  const [summarySession, setSummarySession] = useState<number | null>(null);
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("pendiente");
  const [projectPhases, setProjectPhases] = useState<Record<string, ProjectPhase>>(
    () => Object.fromEntries(projects.map(project => [project.title, project.phase])) as Record<string, ProjectPhase>
  );
  const [voteProject, setVoteProject] = useState<string | null>(null);
  const [voteChoice, setVoteChoice] = useState<VoteChoice | null>(null);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const sessionStripRef = useRef<HTMLElement | null>(null);
  const sessionGesture = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });
  const featuredSession = sessions[2];
  const currentSession = detailOpen ? sessions[selectedSession] : featuredSession;
  const summarySessionData = summarySession === null ? null : sessions[summarySession];
  const summaryContent = summarySessionData
    ? sessionSummaries[summarySessionData.code] ?? sessionSummaries.default
    : sessionSummaries.default;
  const visibleProjects = projects.filter(project =>
    projectFilter === "pendiente" ? projectPhases[project.title] !== "complete" : projectPhases[project.title] === "complete"
  );
  const voteTarget = projects.find(project => project.title === voteProject);
  const statusTone =
    currentSession.status === "Activo" ? "is-active" : currentSession.status === "Cerrado" ? "is-closed" : "is-paused";

  const openSessionSummary = (index: number) => {
    setSelectedSession(index);
    setSummarySession(index);
    setSummaryTab("debate");
  };

  const startSessionGesture = (event: PointerEvent<HTMLButtonElement>) => {
    sessionGesture.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: sessionStripRef.current?.scrollLeft ?? 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveSessionGesture = (event: PointerEvent<HTMLButtonElement>) => {
    if (!sessionGesture.current.active || !sessionStripRef.current) return;
    const delta = event.clientX - sessionGesture.current.startX;
    if (Math.abs(delta) > 10) {
      sessionGesture.current.moved = true;
    }
    sessionStripRef.current.scrollLeft = sessionGesture.current.scrollLeft - delta;
  };

  const finishSessionGesture = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    const shouldOpen = !sessionGesture.current.moved;
    sessionGesture.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (shouldOpen) {
      openSessionSummary(index);
    }
  };

  const completeVote = (choice: VoteChoice) => {
    if (!voteProject) return;
    setVoteChoice(choice);
    window.setTimeout(() => {
      setProjectPhases(previous => ({ ...previous, [voteProject]: "complete" }));
      setProjectFilter("completo");
      setVoteChoice(null);
      setVoteProject(null);
    }, 420);
  };

  return (
    <main className="dao-screen">
      {!detailOpen ? (
        <section className="dao-shell">
          <FeatureGate module="dao">
            <header className="dao-topbar">
              <h1>Dashboard DAO</h1>
              <button type="button" aria-label="Perfil de decisiones" onClick={() => setProfileOpen(true)}>
                <CircleUserRound size={19} />
              </button>
            </header>

            {profileOpen ? (
              <div className="dao-profile-layer" role="dialog" aria-modal="true" aria-label="Historial DAO del usuario">
                <button className="dao-profile-layer__overlay" type="button" onClick={() => setProfileOpen(false)} />
                <section className="dao-profile-card">
                  <div className="dao-profile-card__head">
                    <div>
                      <span>Historial DAO</span>
                      <h2>Mi participacion asamblearia</h2>
                    </div>
                    <button type="button" onClick={() => setProfileOpen(false)} aria-label="Cerrar historial DAO">
                      Cerrar
                    </button>
                  </div>

                  <div className="dao-profile-card__grid">
                    {userAssemblyStats.map(item => (
                      <article key={item.label}>
                        <strong>{item.value}</strong>
                        <span>{item.label}</span>
                      </article>
                    ))}
                  </div>

                  <div className="dao-profile-card__list">
                    <p>Ultimas resoluciones</p>
                    <span>Voto a favor - Debate 021</span>
                    <span>Propuesta enviada - Laboratorios circulares</span>
                    <span>Acta revisada - Asamblea 020</span>
                  </div>
                </section>
              </div>
            ) : null}

            <section className="dao-orange-panel">
              <div className="dao-subtitle">Seccion para debates y decisiones comunitarias</div>

              <section ref={sessionStripRef} className="dao-session-strip" aria-label="Sesiones y debates recientes">
                {sessions.map((session, index) => (
                  <button
                    key={`${session.day}-${session.month}`}
                    type="button"
                    className={`dao-session-card ${selectedSession === index ? "is-selected" : ""}`}
                    aria-pressed={selectedSession === index}
                    onPointerDown={startSessionGesture}
                    onPointerMove={moveSessionGesture}
                    onPointerUp={event => finishSessionGesture(event, index)}
                    onPointerCancel={() => {
                      sessionGesture.current.active = false;
                      sessionGesture.current.moved = false;
                    }}
                    onClick={event => event.preventDefault()}
                  >
                    <strong>{session.day}</strong>
                    <span>{session.month}</span>
                    <small>{session.year}</small>
                  </button>
                ))}
              </section>

              <section
                className="dao-active-card"
                onClick={() => {
                  setSelectedSession(2);
                  setDetailOpen(true);
                }}
                onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") {
                    setSelectedSession(2);
                    setDetailOpen(true);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="dao-active-card__main">
                  <div className="dao-active-card__title-row">
                    <h2>Participar en el debate</h2>
                  </div>
                  <p>Ingreso al debate asambleario</p>
                  <div className="dao-active-card__stats">
                    <div>
                      <strong>{currentSession.participants}</strong>
                      <span>Cantidad de participantes</span>
                    </div>
                    <div>
                      <strong>{currentSession.quorum}</strong>
                      <span>Quorum</span>
                    </div>
                  </div>
                </div>

                <div className="dao-active-card__side">
                  <div className={`dao-active-card__status ${statusTone}`}>{currentSession.status}</div>
                  <span>$NUDOS</span>
                  <div className="dao-active-card__emblem">
                    <img src="/lazosGO.png" alt="" />
                  </div>
                </div>
              </section>

              <section className="dao-feed-card">
                <div className="dao-section-head">
                  <h2>Participaciones</h2>
                  <p>Listado de proposiciones en los debates</p>
                </div>

                <div className="dao-feed-list">
                  {participations.map(item => (
                    <article key={`${item.title}-${item.due}`} className="dao-feed-item">
                      <div className="dao-feed-item__line" />
                      <div className="dao-feed-item__content">
                        <div className="dao-feed-item__head">
                          <strong>{item.title}</strong>
                          <ChevronRight size={16} />
                        </div>
                        <p>{item.body}</p>
                        <div className="dao-feed-item__meta">
                          <span>Due: {item.due}</span>
                          <button type="button">
                            <span>1</span>
                            {item.action}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="dao-activity-card">
                <div className="dao-section-head">
                  <h2>Actividad reciente</h2>
                  <p>Resumen de debates, actas y proposiciones registradas.</p>
                </div>

                <div className="dao-activity-legend">
                  <span className="is-task">Propuestas</span>
                  <span className="is-complete">Actas</span>
                  <span className="is-launch">Anexos</span>
                </div>

                <div className="dao-activity-chart">
                  <div className="dao-activity-chart__shape" />
                  <span>Ultimos 30 dias</span>
                </div>
              </section>
            </section>
          </FeatureGate>
        </section>
      ) : (
        <section className="dao-detail-shell">
          <FeatureGate module="dao">
            <section className="dao-detail-hero">
              <header className="dao-detail-topbar">
                <button type="button" onClick={() => setDetailOpen(false)} aria-label="Volver">
                  <ArrowLeft size={18} />
                </button>
                <h1>Debate Asambleario {currentSession.code}</h1>
              </header>

              <section className="dao-detail-tabs">
                <button
                  type="button"
                  className={activeTab === "debate" ? "is-active" : ""}
                  onClick={() => setActiveTab("debate")}
                >
                  Debate
                </button>
                <button
                  type="button"
                  className={activeTab === "acta" ? "is-active" : ""}
                  onClick={() => setActiveTab("acta")}
                >
                  Acta
                </button>
                <button
                  type="button"
                  className={activeTab === "anexos" ? "is-active" : ""}
                  onClick={() => setActiveTab("anexos")}
                >
                  Anexos
                </button>
              </section>

              <section className="dao-progress-card">
                <div className="dao-progress-card__head">
                  <strong>12 Proyectos</strong>
                  <span>7 / 12 Completado</span>
                </div>

                <div className="dao-progress-card__bar">
                  <span />
                </div>

                <div className="dao-progress-card__bottom">
                  <div className="dao-progress-card__avatars">
                    <span />
                    <span />
                    <span />
                  </div>
                  <button type="button" onClick={() => setParticipantsOpen(true)}>
                    <span>Participantes</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </section>
            </section>

            <section className="dao-detail-body">
              {activeTab === "debate" ? (
                <>
                  <section className="dao-filter-tabs">
                    <button
                      type="button"
                      className={projectFilter === "pendiente" ? "is-active" : ""}
                      onClick={() => setProjectFilter("pendiente")}
                    >
                      Pendiente
                    </button>
                    <button
                      type="button"
                      className={projectFilter === "completo" ? "is-active" : ""}
                      onClick={() => setProjectFilter("completo")}
                    >
                      Completo
                    </button>
                  </section>

                  <section className="dao-project-list">
                    {visibleProjects.map(project => {
                      const phase = projectPhases[project.title];
                      const isVoting = phase === "voting";
                      const statusLabel = phase === "complete" ? "Completo" : isVoting ? "En votacion" : "En orden";

                      return (
                        <article
                          key={project.title}
                          className={`dao-project-card ${isVoting ? "is-voting" : ""}`}
                          onClick={() => {
                            if (isVoting) setVoteProject(project.title);
                          }}
                        >
                          <div className="dao-project-card__head">
                            <h2>{project.title}</h2>
                            <span />
                          </div>
                          <p>{project.body}</p>
                          <div className="dao-project-card__meta">
                            <span>
                              <Clock3 size={14} />
                              <small>Due {project.due}</small>
                            </span>
                            <button
                              type="button"
                              className={`is-${phase}`}
                              onClick={event => {
                                event.stopPropagation();
                                if (isVoting) setVoteProject(project.title);
                              }}
                            >
                              {statusLabel}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </section>
                </>
              ) : null}

              {activeTab === "acta" ? (
                <section className="dao-doc-card">
                  <div className="dao-doc-card__head">
                    <FileText size={18} />
                    <h2>Acta del debate</h2>
                  </div>
                  <p>
                    Aqui ira el comunicado consolidado posterior al debate con las
                    conclusiones, decisiones y compromisos aprobados por la asamblea.
                  </p>
                </section>
              ) : null}

              {activeTab === "anexos" ? (
                <section className="dao-doc-card">
                  <div className="dao-doc-card__head">
                    <Paperclip size={18} />
                    <h2>Anexos del debate</h2>
                  </div>
                  <p>
                    Aqui pueden vivir documentos adicionales, soportes, capturas,
                    PDF y futuras referencias asociadas a la discusion.
                  </p>
                </section>
              ) : null}
            </section>
          </FeatureGate>
        </section>
      )}

      {participantsOpen ? (
        <div className="dao-popup-layer" role="dialog" aria-modal="true" aria-label="Participantes activos">
          <button className="dao-popup-overlay" type="button" onClick={() => setParticipantsOpen(false)} />
          <section className="dao-popup-card">
            <div className="dao-popup-card__head">
              <h2>Participantes</h2>
              <button type="button" onClick={() => setParticipantsOpen(false)} aria-label="Cerrar participantes">
                X
              </button>
            </div>
            <div className="dao-participant-list">
              {sessionParticipants.map((participant, index) => (
                <span key={participant}>
                  <strong>{String(index + 1).padStart(2, "0")}</strong>
                  {participant}
                </span>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {summarySessionData ? (
        <div className="dao-popup-layer" role="dialog" aria-modal="true" aria-label="Resumen del debate">
          <button className="dao-popup-overlay" type="button" onClick={() => setSummarySession(null)} />
          <section className="dao-popup-card dao-popup-card--summary">
            <div className="dao-popup-card__head">
              <div>
                <span className="dao-popup-card__eyebrow">
                  {summarySessionData.day} {summarySessionData.month} {summarySessionData.year}
                </span>
                <h2>Debate Asambleario {summarySessionData.code}</h2>
              </div>
              <button type="button" onClick={() => setSummarySession(null)} aria-label="Cerrar resumen">
                X
              </button>
            </div>

            <section className="dao-summary-tabs">
              <button
                type="button"
                className={summaryTab === "debate" ? "is-active" : ""}
                onClick={() => setSummaryTab("debate")}
              >
                Debate
              </button>
              <button
                type="button"
                className={summaryTab === "acta" ? "is-active" : ""}
                onClick={() => setSummaryTab("acta")}
              >
                Acta
              </button>
              <button
                type="button"
                className={summaryTab === "anexos" ? "is-active" : ""}
                onClick={() => setSummaryTab("anexos")}
              >
                Anexos
              </button>
            </section>

            <section className="dao-summary-body">
              {summaryTab === "debate" ? (
                <>
                  <h3>Resumen practico del debate</h3>
                  <p>
                    La sesion registro {summarySessionData.participants} participantes y quorum de {summarySessionData.quorum}.
                  </p>
                  {summaryContent.debate.map(paragraph => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </>
              ) : null}

              {summaryTab === "acta" ? (
                <>
                  <h3>Acta generada</h3>
                  {summaryContent.acta.map(paragraph => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </>
              ) : null}

              {summaryTab === "anexos" ? (
                <>
                  <h3>Anexos disponibles</h3>
                  {summaryContent.anexos.map(paragraph => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </>
              ) : null}
            </section>
          </section>
        </div>
      ) : null}

      {voteTarget ? (
        <div className="dao-popup-layer" role="dialog" aria-modal="true" aria-label="Votacion de deliberacion">
          <button
            className="dao-popup-overlay"
            type="button"
            onClick={() => {
              setVoteChoice(null);
              setVoteProject(null);
            }}
          />
          <section className="dao-popup-card dao-popup-card--vote">
            <div className="dao-popup-card__head">
              <h2>Votar deliberacion</h2>
              <button
                type="button"
                onClick={() => {
                  setVoteChoice(null);
                  setVoteProject(null);
                }}
                aria-label="Cerrar votacion"
              >
                X
              </button>
            </div>
            <section className="dao-vote-copy" aria-label="Detalles de la votacion">
              <h3>{voteTarget.title}</h3>
              <p>
                Esta deliberacion propone reservar un fondo inicial para prototipos circulares creados por estudiantes
                que conviertan materiales recuperados en productos, herramientas, insumos academicos o soluciones de
                bajo costo para la comunidad universitaria.
              </p>
              <p>
                El alcance contempla recursos para materiales complementarios, acceso a laboratorios, acompanamiento
                tecnico, mentorias cortas y un pequeno presupuesto para pruebas de usabilidad. Las propuestas
                seleccionadas deberan explicar el residuo utilizado, el impacto esperado, el equipo responsable y el
                mecanismo de seguimiento posterior a la entrega.
              </p>
              <p>
                La votacion busca definir si la asamblea autoriza abrir esta linea de apoyo dentro del presupuesto
                comunitario. Un voto a favor habilita la convocatoria piloto; un voto en contra solicita devolver la
                propuesta a revision; y una abstencion registra participacion sin inclinar la decision final.
              </p>
              <p>
                En caso de aprobacion, la mesa debera publicar criterios de evaluacion, fechas de postulacion,
                responsables de verificacion y condiciones para reportar avances. La decision quedara anexada al acta
                de la sesion junto con el resultado consolidado de votos.
              </p>
            </section>
            <div className="dao-vote-actions">
              <button
                type="button"
                className={`is-favor ${voteChoice === "favor" ? "is-selected" : ""}`}
                onClick={() => completeVote("favor")}
              >
                A favor
              </button>
              <button
                type="button"
                className={`is-contra ${voteChoice === "contra" ? "is-selected" : ""}`}
                onClick={() => completeVote("contra")}
              >
                En contra
              </button>
              <button
                type="button"
                className={`is-abstencion ${voteChoice === "abstencion" ? "is-selected" : ""}`}
                onClick={() => completeVote("abstencion")}
              >
                Abstencion
              </button>
            </div>
          </section>
        </div>
      ) : null}
      <ComingSoonCover imageSrc="/coming-soon/dao.png" tone="dao" />
    </main>
  );
}
