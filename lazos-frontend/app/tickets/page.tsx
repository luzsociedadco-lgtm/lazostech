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
import { useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { FeatureGate } from "@/app/components/FeatureGate";
import { useTicketRedemption } from "@/app/hooks/useTicketRedemption";
import { useAuth } from "@/app/providers/AuthProvider";

const days = [
  { day: "Lunes", image: "/tickets/menu-lunes.png" },
  { day: "Martes", image: "/tickets/menu-martes.png" },
  { day: "Miercoles", image: "/tickets/menu-miercoles.png" },
  { day: "Jueves", image: "/tickets/menu-jueves.png" },
  { day: "Viernes", image: "/tickets/menu-viernes.png" },
];

type PaymentMethod = "nudos" | "card" | "nequi";

const paymentMethods: Array<{ key: PaymentMethod; label: string }> = [
  { key: "nudos", label: "Pagar con NUDOS" },
  { key: "card", label: "Paga con tarjeta" },
  { key: "nequi", label: "NEQUI" },
];

export default function TicketsPage() {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(3);
  const [turnsOpen, setTurnsOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const menuSwipeStart = useRef<number | null>(null);
  const {
    quoteDisplay,
    isLoadingQuote,
    isSubmitting,
    allowanceEnough,
    statusMessage,
    errorMessage,
    approveAndRedeem
  } = useTicketRedemption(quantity);

  const currentTickets = user?.tickets.available ?? 0;
  const benefitLabel = user?.profile.benefitLabel || "";
  const hasNegotiatedBenefit = /subsidi|negoci/i.test(benefitLabel);
  const pricePerTicketCop = hasNegotiatedBenefit ? 2000 : 2500;
  const subtotalCop = pricePerTicketCop * quantity;
  const totalCop = subtotalCop;
  const nudosEquivalent = totalCop / 250;

  const summary = useMemo(
    () => ({
      current: currentTickets,
      toBuy: quantity,
      after: currentTickets + quantity,
    }),
    [quantity],
  );

  const nextDay = () => setActiveDay(prev => Math.min(days.length - 1, prev + 1));
  const prevDay = () => setActiveDay(prev => Math.max(0, prev - 1));
  const startMenuSwipe = (event: PointerEvent<HTMLDivElement>) => {
    menuSwipeStart.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const finishMenuSwipe = (event: PointerEvent<HTMLDivElement>) => {
    const startX = menuSwipeStart.current;
    menuSwipeStart.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (startX === null) return;

    const delta = event.clientX - startX;
    if (Math.abs(delta) < 42) return;
    if (delta < 0) {
      nextDay();
      return;
    }
    prevDay();
  };
  const proceedToPayment = async () => {
    if (!selectedPaymentMethod) {
      setPaymentMessage("Selecciona un metodo de pago antes de proceder.");
      return;
    }

    setPaymentMessage("");

    if (selectedPaymentMethod === "nudos") {
      await approveAndRedeem();
      return;
    }

    setPaymentMessage(
      selectedPaymentMethod === "card"
        ? "Metodo con tarjeta seleccionado. La pasarela se conectara en el siguiente paso."
        : "Metodo NEQUI seleccionado. La pasarela se conectara en el siguiente paso.",
    );
  };

  return (
    <>
      <main className="tickets-screen">
        <section className="tickets-shell">
          <FeatureGate module="tickets">
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
                Recarga tus tickets para disfrutar de almuerzos en la cafeteria. Puedes
                comprar 3 hasta 45 tickets.
              </p>
            </article>

            <button className="tickets-turn-card" type="button" onClick={() => setTurnsOpen(true)}>
              <span className="tickets-turn-card__icon" aria-hidden="true">
                <Image src="/tickets/Ticket.svg" alt="" width={58} height={58} />
              </span>
              <span>
                Solicitar turno
                <br />
                para almorzar.
              </span>
            </button>
          </section>

          <section className="tickets-purchase-card">
            <div className="tickets-purchase-card__header">
              <div className="tickets-purchase-card__copy">
                <h2>
                  Cantidad
                  <br />
                  de tickets:
                </h2>
                <p>{hasNegotiatedBenefit ? "Tarifa regular con bono" : "Tarifa regular sin bono"}</p>
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
                <strong>${pricePerTicketCop.toLocaleString("es-CO")}</strong>
              </div>
              <div>
                <span>Subtotal:</span>
                <strong>${subtotalCop.toLocaleString("es-CO")}</strong>
              </div>
            </div>
          </section>

          <section className="tickets-total-card">
            <div className="tickets-total-card__line">
              <span>Total a pagar:</span>
              <strong>${totalCop.toLocaleString("es-CO")}</strong>
            </div>
            <small>
              <span>Equivalente a</span>
              <em>{nudosEquivalent.toLocaleString("es-CO")} $NUDOS</em>
            </small>
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

            <div className="tickets-payment-card__quick">
              {paymentMethods.map(method => (
                <button
                  key={method.key}
                  type="button"
                  className={selectedPaymentMethod === method.key ? "is-selected" : ""}
                  aria-pressed={selectedPaymentMethod === method.key}
                  onClick={() => {
                    setSelectedPaymentMethod(method.key);
                    setPaymentMessage("");
                  }}
                >
                  {method.label}
                </button>
              ))}
            </div>

            <form className="tickets-payment-form">
              <button
                type="button"
                onClick={proceedToPayment}
                disabled={!selectedPaymentMethod || isSubmitting || isLoadingQuote}
              >
                {isSubmitting ? "Procesando..." : "Proceder al pago"}
              </button>
            </form>
            {paymentMessage ? <p className="profile-wallet-copy">{paymentMessage}</p> : null}
            {statusMessage ? <p className="profile-wallet-copy">{statusMessage}</p> : null}
            {errorMessage ? <p className="profile-wallet-copy">{errorMessage}</p> : null}
          </section>
          </FeatureGate>
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
            <button type="button" onClick={prevDay} disabled={activeDay === 0}>
              <ChevronLeft size={16} />
            </button>
            <span>{days[activeDay]?.day}</span>
            <button type="button" onClick={nextDay} disabled={activeDay === days.length - 1}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div
            className="tickets-menu-carousel__image"
            onPointerDown={startMenuSwipe}
            onPointerUp={finishMenuSwipe}
            onPointerCancel={() => {
              menuSwipeStart.current = null;
            }}
          >
            <Image
              key={days[activeDay]?.image}
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
