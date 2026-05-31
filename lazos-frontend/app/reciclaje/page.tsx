"use client";

import Image from "next/image";
import {
  MapPin,
  QrCode,
  ScrollText,
} from "lucide-react";
import { useState } from "react";
import { FeatureGate } from "@/app/components/FeatureGate";
import ComingSoonCover from "@/app/components/ComingSoonCover";
import { useNudosErc20Balance } from "@/app/hooks/useNudosErc20Balance";
import { useAuth } from "@/app/providers/AuthProvider";

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
  { value: "42", unit: "kg", label: "reciclados", tone: "green" },
  { value: "15", unit: "kg", label: "Co2", tone: "blue" },
  { value: "220", unit: "lts", label: "agua", tone: "purple" },
];

export default function ReciclajePage() {
  const { user } = useAuth();
  const { balance, isConnected, isLoading, symbol } = useNudosErc20Balance();
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [walletQrOpen, setWalletQrOpen] = useState(false);
  const balanceDisplay = isConnected ? (isLoading ? "..." : balance ?? "0") : "Conecta tu wallet";
  const walletAddress = user?.linkedWallet?.address || "";
  const walletQrUrl = walletAddress
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(walletAddress)}`
    : "";

  return (
    <main className="recycle-screen">
      <section className="recycle-shell">
        <FeatureGate module="reciclaje">
        <header className="recycle-header">
          <h1>Recicla-Ahorro</h1>
        </header>

        <button type="button" className="recycle-balance-card" onClick={() => setCertificateOpen(true)}>
          <div className="recycle-balance-card__copy">
            <span>Tu saldo $NUDOS</span>
            <strong>{`${balanceDisplay}${isConnected ? ` ${symbol}` : ""}`}</strong>
          </div>
          <div className="recycle-balance-card__badge">
            <span className="recycle-balance-card__icon" aria-hidden="true" />
          </div>
        </button>

        <section className="recycle-qr-card">
          <h2>Genera tu codigo QR</h2>
          <p>
            Genera y muestra el codigo QR de tu wallet para que el recolector
            abone el reciclaje validado directamente a tu cuenta.
          </p>

          <div className="recycle-qr-card__panel">
            <QrCode size={70} />
            <button type="button" onClick={() => setWalletQrOpen(true)}>Mostrar Codigo QR</button>
          </div>
        </section>

        <section className="recycle-history-card">
          <div className="recycle-section-title is-centered">
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
          <div className="recycle-section-title is-centered">
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
          <div className="recycle-section-title is-centered">
            <h2>Impacto Ambiental</h2>
          </div>

          <div className="recycle-impact-card__grid">
            {impact.map(item => (
              <article key={`${item.value}-${item.label}`} className={`recycle-impact-chip is-${item.tone}`}>
                <strong>
                  {item.value}
                  <small>{item.unit}</small>
                </strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </section>

        </FeatureGate>
      </section>

      {certificateOpen ? (
        <div className="recycle-popup-layer">
          <div className="recycle-popup-overlay" onClick={() => setCertificateOpen(false)} />
          <section className="recycle-popup-card">
            <div className="recycle-popup-card__top">
              <h2>Certificacion de impacto</h2>
              <button type="button" onClick={() => setCertificateOpen(false)} aria-label="Cerrar popup">
                <ScrollText size={16} />
              </button>
            </div>
            <p>
              Este panel mostrara la informacion del facet de certificacion para las acciones
              ambientales registradas por cada usuario.
            </p>
            <div className="impact-list">
              <div className="impact-row">
                <span>Estado del certificado</span>
                <strong>Activo</strong>
              </div>
              <div className="impact-row">
                <span>Saldo reconocido</span>
                <strong>{`${balanceDisplay}${isConnected ? ` ${symbol}` : ""}`}</strong>
              </div>
              <div className="impact-row">
                <span>Acciones ambientales</span>
                <strong>42 registros</strong>
              </div>
              <div className="impact-row">
                <span>Ultima actualizacion</span>
                <strong>11/05/26</strong>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {walletQrOpen ? (
        <div className="recycle-popup-layer">
          <div className="recycle-popup-overlay" onClick={() => setWalletQrOpen(false)} />
          <section className="recycle-popup-card">
            <div className="recycle-popup-card__top">
              <h2>QR de tu wallet</h2>
              <button type="button" onClick={() => setWalletQrOpen(false)} aria-label="Cerrar popup QR">
                <QrCode size={16} />
              </button>
            </div>
            {walletAddress ? (
              <>
                <p>
                  Este codigo representa la wallet que recibira la acreditacion del reciclaje
                  validado por el recolector.
                </p>
                <div className="recycle-wallet-qr">
                  <Image src={walletQrUrl} alt="QR de la wallet" width={220} height={220} unoptimized />
                </div>
                <div className="recycle-wallet-qr__address">{walletAddress}</div>
              </>
            ) : (
              <p>Primero vincula una wallet en tu perfil para poder emitir este codigo QR.</p>
            )}
          </section>
        </div>
      ) : null}
      <ComingSoonCover imageSrc="/coming-soon/recycle.png" tone="recycle" />
    </main>
  );
}
