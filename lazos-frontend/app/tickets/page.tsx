"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Menu,
  Minus,
  Plus,
  QrCode,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

const days = [
  { day: "Lunes", image: "/images/slide-1.jpg" },
  { day: "Martes", image: "/images/slide-1.jpg" },
  { day: "Miercoles", image: "/images/slide-1.jpg" },
  { day: "Jueves", image: "/images/slide-1.jpg" },
  { day: "Viernes", image: "/images/slide-1.jpg" },
];

export default function TicketsPage() {
  const [quantity, setQuantity] = useState(3);
  const [turnsOpen, setTurnsOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(0);

  const currentTickets = 2;
  const pricePerTicket = 2000;
  const subtotal = quantity * pricePerTicket;
  const total = subtotal;

  const summary = useMemo(
    () => ({
      current: currentTickets,
      toBuy: quantity,
      after: currentTickets + quantity,
    }),
    [quantity],
  );

  const nextDay = () => setActiveDay(prev => (prev + 1) % days.length);
  const prevDay = () => setActiveDay(prev => (prev - 1 + days.length) % days.length);

  return (
    <>
      <main className="tickets-screen">
        <section className="tickets-shell">
          <header className="tickets-topbar">
            <h1>Compra de Tickets</h1>
            <button type="button" onClick={() => setTurnsOpen(true)} aria-label="Abrir menu y turnos">
              <Menu size={18} />
            </button>
          </header>

          <section className="tickets-info-grid">
            <article className="tickets-info-card">
              <h2>Tickets de Almuerzo</h2>
              <p>
                Recarga tus tickets para disfrutar de almuerzos en la cafeteria.
                Puedes comprar desde 3 hasta 45 tickets.
              </p>
            </article>

            <button className="tickets-turn-card" type="button" onClick={() => setTurnsOpen(true)}>
              <span>Solicita tu turno para almorzar</span>
            </button>
          </section>

          <section className="tickets-purchase-card">
            <div className="tickets-purchase-card__header">
              <div>
                <h2>Cantidad de tickets:</h2>
                <p>Precio por ticket</p>
              </div>
              <div className="tickets-counter">
                <button type="button" onClick={() => setQuantity(prev => Math.max(1, prev - 1))}>
                  <Minus size={16} />
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity(prev => Math.min(45, prev + 1))}>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="tickets-pricing">
              <div>
                <span>Precio por ticket</span>
                <strong>${pricePerTicket.toLocaleString("es-CO")}</strong>
              </div>
              <div>
                <span>Subtotal:</span>
                <strong>${subtotal.toLocaleString("es-CO")}</strong>
              </div>
            </div>
          </section>

          <section className="tickets-total-card">
            <div className="tickets-total-card__line">
              <span>Total a pagar:</span>
              <strong>${total.toLocaleString("es-CO")}</strong>
            </div>
          </section>

          <section className="tickets-summary-card">
            <h2>Resumen de tu cuenta</h2>
            <div className="tickets-summary-card__row">
              <span>Tickets actuales:</span>
              <strong>{summary.current}</strong>
            </div>
            <div className="tickets-summary-card__row">
              <span>Tickets a comprar:</span>
              <strong>{summary.toBuy}</strong>
            </div>
            <div className="tickets-summary-card__row is-total">
              <span>Total despues de compra:</span>
              <strong>{summary.after}</strong>
            </div>
          </section>

          <section className="tickets-payment-card">
            <h2>Metodo de pago</h2>

            <div className="tickets-payment-card__chips">
              <button type="button" className="is-active" />
              <button type="button" />
              <button type="button" />
            </div>

            <div className="tickets-payment-card__quick">
              <button type="button">Pagar con NUDOS</button>
              <button type="button">Nuevo metodo</button>
            </div>

            <form className="tickets-payment-form">
              <input type="text" placeholder="Numero de tarjeta" />
              <div className="tickets-payment-form__row">
                <input type="text" placeholder="MM/AA" />
                <input type="text" placeholder="CVV" />
              </div>
              <input type="text" placeholder="Nombre en la tarjeta" />
              <button type="button">Proceder al pago</button>
            </form>
          </section>
        </section>
      </main>

      <div className={`tickets-overlay ${turnsOpen ? "is-open" : ""}`} onClick={() => setTurnsOpen(false)} />

      <aside className={`tickets-drawer ${turnsOpen ? "is-open" : ""}`}>
        <header className="tickets-drawer__topbar">
          <button type="button" onClick={() => setTurnsOpen(false)} aria-label="Volver">
            <ArrowLeft size={18} />
          </button>
          <h2>Menus y Turnos</h2>
          <button type="button" onClick={() => setTurnsOpen(false)} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <section className="tickets-menu-carousel">
          <div className="tickets-menu-carousel__controls">
            <button type="button" onClick={prevDay}>
              <ChevronLeft size={16} />
            </button>
            <span>{days[activeDay]?.day}</span>
            <button type="button" onClick={nextDay}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="tickets-menu-carousel__image">
            <Image
              src={days[activeDay]?.image ?? "/images/slide-1.jpg"}
              alt={`Menu ${days[activeDay]?.day}`}
              fill
            />
          </div>
        </section>

        <section className="tickets-turn-status">
          <h3>Tu turno actual</h3>
          <div className="tickets-turn-status__grid">
            <div>
              <span>Numero de turno:</span>
              <strong>A-45</strong>
            </div>
            <div>
              <span>Posicion en la fila:</span>
              <strong>3</strong>
            </div>
            <div>
              <span>Tiempo estimado:</span>
              <strong>5 minutos</strong>
            </div>
            <div>
              <span>Estado:</span>
              <strong className="is-active">Activo</strong>
            </div>
          </div>

          <div className="tickets-turn-status__progress">
            <div className="tickets-turn-status__labels">
              <span>Inicio</span>
              <span>En Fila</span>
              <span>Almuerzo</span>
            </div>
            <div className="tickets-turn-status__bar">
              <span />
            </div>
          </div>
        </section>

        <button className="tickets-qr-card" type="button">
          <span>Escanea tu codigo QR</span>
          <QrCode size={54} />
        </button>

        <section className="tickets-turn-actions">
          <button type="button" className="is-dark">
            Reactivar turno (10 minutos)
          </button>
          <small>Reactivaciones disponibles: 2</small>
          <button type="button" className="is-accent">
            Reservar almuerzo (turno especial)
          </button>
          <small>Reservas disponibles este mes: 3/5</small>
        </section>
      </aside>
    </>
  );
}
