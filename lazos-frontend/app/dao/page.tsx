"use client";

import {
  ArrowLeft,
  ChevronRight,
  CircleUserRound,
  Clock3,
  FileText,
  Paperclip,
  Users,
} from "lucide-react";
import { useState } from "react";

const sessions = [
  { day: "03", month: "Febrero", year: "de 2025" },
  { day: "23", month: "Abril", year: "de 2025" },
  { day: "30", month: "Junio", year: "de 2025" },
  { day: "11", month: "Julio", year: "de 2025" },
  { day: "24", month: "Agosto", year: "de 2025" },
  { day: "09", month: "Sept", year: "de 2025" },
  { day: "13", month: "Oct", year: "de 2025" },
  { day: "21", month: "Nov", year: "de 2025" },
  { day: "02", month: "Dic", year: "de 2025" },
  { day: "16", month: "Dic", year: "de 2025" },
];

const participations = [
  {
    title: "Task Type",
    body: "Task Description here this one is really long and it goes over maybe? And goes to two lines",
    due: "Today, 6:20pm",
    action: "Update",
  },
  {
    title: "Task Type",
    body: "Task description here.",
    due: "Today, 6:20pm",
    action: "Update",
  },
];

const projects = [
  {
    title: "Design Template Screens",
    body: "Create template screen for task todo app.",
    due: "Tuesday, 10:00am",
    status: "In Progress",
  },
  {
    title: "Theme Collection",
    body: "Create themes for use by our users.",
    due: "Tuesday, 10:00am",
    status: "In Progress",
  },
];

type DaoTab = "debate" | "acta" | "anexos";
type ProjectFilter = "pendiente" | "completo";

export default function DaoPage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DaoTab>("debate");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("pendiente");

  return (
    <main className="dao-screen">
      {!detailOpen ? (
        <section className="dao-shell">
          <header className="dao-topbar">
            <h1>Dashboard DAO</h1>
            <button type="button" aria-label="Perfil de decisiones">
              <CircleUserRound size={20} />
            </button>
          </header>

          <div className="dao-subtitle">Seccion para debates y decisiones comunitarias</div>

          <section className="dao-session-strip">
            {sessions.map(session => (
              <button
                key={`${session.day}-${session.month}`}
                type="button"
                className="dao-session-card"
                onClick={() => setDetailOpen(true)}
              >
                <strong>{session.day}</strong>
                <span>{session.month}</span>
                <small>{session.year}</small>
              </button>
            ))}
          </section>

          <section className="dao-active-card" onClick={() => setDetailOpen(true)} role="button" tabIndex={0}>
            <div className="dao-active-card__main">
              <h2>Participar en el Debate</h2>
              <p>Ingreso al debate asambleario</p>
              <div className="dao-active-card__stats">
                <div>
                  <strong>15/26</strong>
                  <span>Cantidad de participantes</span>
                </div>
                <div>
                  <strong>12</strong>
                  <span>Quorum</span>
                </div>
              </div>
            </div>

            <div className="dao-active-card__side">
              <div className="dao-active-card__status">Activo</div>
              <div className="dao-active-card__reward">+ NUDOS</div>
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
                      <button type="button">{item.action}</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="dao-activity-card">
            <div className="dao-section-head">
              <h2>Recent Activity</h2>
              <p>Below is an overview of tasks & activity completed.</p>
            </div>

            <div className="dao-activity-legend">
              <span className="is-task">Tasks</span>
              <span className="is-complete">Completed</span>
              <span className="is-launch">Launches</span>
            </div>

            <div className="dao-activity-chart">
              <div className="dao-activity-chart__shape" />
              <span>Last 30 Days</span>
            </div>
          </section>
        </section>
      ) : (
        <section className="dao-detail-shell">
          <header className="dao-detail-topbar">
            <button type="button" onClick={() => setDetailOpen(false)} aria-label="Volver">
              <ArrowLeft size={18} />
            </button>
            <h1>Debate Asambleario 021</h1>
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
              <strong>12 Projects</strong>
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
              <button type="button">
                <Users size={16} />
                <span>Participantes</span>
              </button>
            </div>
          </section>

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

          {activeTab === "debate" ? (
            <section className="dao-project-list">
              {projects.map(project => (
                <article key={project.title} className="dao-project-card">
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
                    <button type="button">{project.status}</button>
                  </div>
                </article>
              ))}
            </section>
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
      )}
    </main>
  );
}
