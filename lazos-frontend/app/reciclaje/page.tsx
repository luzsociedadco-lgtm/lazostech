"use client";

import {
  MapPin,
  Plus,
  QrCode,
  Recycle,
  ScrollText,
  Sparkles,
} from "lucide-react";

const history = [
  { date: "15/08/24", material: "Plastico", quantity: "5.2 kg", value: "$260.00" },
  { date: "10/08/24", material: "Papel", quantity: "3.0 kg", value: "$180.00" },
  { date: "05/08/24", material: "Vidrio", quantity: "7.5 kg", value: "$375.00" },
];

const points = [
  "Bloque A - Punto Ecobot principal",
  "Biblioteca central - Recoleccion liviana",
  "Cafeteria - Punto de retorno",
];

const impact = [
  { value: "42", label: "Kg reciclados", tone: "green" },
  { value: "15", label: "Kg Co2", tone: "blue" },
  { value: "220", label: "Litros agua", tone: "purple" },
];

export default function ReciclajePage() {
  return (
    <main className="recycle-screen">
      <section className="recycle-shell">
        <header className="recycle-header">
          <h1>Recicla-Ahorro</h1>
        </header>

        <section className="recycle-balance-card">
          <div>
            <span>Tu Saldo $NUDOS</span>
            <strong>$1,250.00</strong>
          </div>
          <div className="recycle-balance-card__badge">
            <Recycle size={24} />
          </div>
        </section>

        <section className="recycle-qr-card">
          <h2>Escanea tu codigo QR</h2>
          <p>
            Futura integracion con ecobot. Captura el codigo QR que recibiste en
            el punto de recoleccion para abonar a tu cuenta.
          </p>

          <div className="recycle-qr-card__panel">
            <QrCode size={70} />
            <button type="button">Escanear Codigo QR</button>
          </div>
        </section>

        <section className="recycle-history-card">
          <div className="recycle-section-title">
            <ScrollText size={18} />
            <h2>Historial de Reciclaje</h2>
          </div>

          <div className="recycle-history-card__table">
            <div className="recycle-history-card__head">
              <span>Fecha</span>
              <span>Material</span>
              <span>Cantidad</span>
              <span>Valor</span>
            </div>

            {history.map(item => (
              <div key={`${item.date}-${item.material}`} className="recycle-history-card__row">
                <span>{item.date}</span>
                <span>{item.material}</span>
                <span>{item.quantity}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <button type="button" className="recycle-outline-button">
            Ver historial completo
          </button>
        </section>

        <section className="recycle-points-card">
          <div className="recycle-section-title">
            <MapPin size={18} />
            <h2>Puntos de Recoleccion</h2>
          </div>

          <div className="recycle-points-card__map">
            <span>Mapa / disponibilidad en tiempo real</span>
          </div>

          <div className="recycle-points-card__list">
            {points.map(point => (
              <div key={point} className="recycle-points-card__item">
                {point}
              </div>
            ))}
          </div>

          <button type="button" className="recycle-primary-button">
            Ver todos
          </button>
        </section>

        <section className="recycle-impact-card">
          <div className="recycle-section-title">
            <Sparkles size={18} />
            <h2>Impacto Ambiental</h2>
          </div>

          <div className="recycle-impact-card__grid">
            {impact.map(item => (
              <article key={item.label} className={`recycle-impact-chip is-${item.tone}`}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="recycle-future-card">
          <h2>Proximo modulo sugerido</h2>
          <p>
            Aqui podemos mostrar certificados NFT de impacto, retos por campus o
            recompensas ecológicas desbloqueadas.
          </p>
        </section>

        <button type="button" className="recycle-floating-button">
          <Plus size={18} />
          <span>Nuevo Reciclaje</span>
        </button>
      </section>
    </main>
  );
}
