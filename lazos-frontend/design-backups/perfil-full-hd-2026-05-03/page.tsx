"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  ChevronDown,
  CircleHelp,
  CreditCard,
  HandCoins,
  Menu,
  QrCode,
  ShieldCheck,
  UserCircle2,
  Wallet,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useAccount } from "wagmi";

import { WalletConnect } from "@/app/components/WalletConnect";
import { useAuth } from "@/app/providers/AuthProvider";

const avatarSrc = "/images/user.jpg";
const universityLogoById: Record<number, string> = {
  1000: "/images/logo-G.png"
};

const accountItems = [
  { key: "wallet", label: "Wallet Network", detail: "Base Sepolia / Wallet vinculada", icon: Wallet },
  { key: "notifications", label: "Notificaciones", detail: "Historial del sistema", icon: Bell },
  { key: "edit", label: "Editar perfil", detail: "Completa tu informacion", icon: UserCircle2 },
  { key: "payment", label: "Payment Options", detail: "Tarjetas y pagos", icon: CreditCard }
];

const generalItems = [
  { label: "Support", detail: "Asistente LazosTech", icon: CircleHelp },
  { label: "Terms of Service", detail: "Politicas y uso", icon: ShieldCheck },
  { label: "Invite Friends", detail: "Referidos", icon: HandCoins }
];

const notifications = [
  { title: "New Product View", body: "Sally Mandrus, viewed your product", time: "3m ago" },
  { title: "New Product View", body: "Sally Mandrus, viewed your product", time: "3m ago" },
  { title: "New Product View", body: "Sally Mandrus, viewed your product", time: "3m ago" }
];

function BalanceTile({
  value,
  label,
  active,
  iconSrc,
  iconAlt
}: {
  value: string;
  label: string;
  active: boolean;
  iconSrc: string;
  iconAlt: string;
}) {
  const iconStyle = {
    "--icon-url": `url("${iconSrc}")`
  } as CSSProperties;

  return (
    <article className={`profile-balance-tile ${active ? "is-positive" : "is-empty"}`}>
      <span className="profile-balance-tile__icon-shell">
        <span className="profile-balance-tile__icon" role="img" aria-label={iconAlt} style={iconStyle} />
      </span>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function DrawerRow({
  label,
  detail,
  icon: Icon,
  general = false,
  onClick
}: {
  label: string;
  detail: string;
  icon: LucideIcon;
  general?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`profile-drawer__row ${general ? "is-general" : ""}`}
      type="button"
      onClick={onClick}
    >
      <span className="profile-drawer__row-main">
        <span className="profile-drawer__icon">
          <Icon size={16} />
        </span>
        <span className="profile-drawer__copy">
          <strong>{label}</strong>
          <small>{detail}</small>
        </span>
      </span>
      <ChevronRight size={16} />
    </button>
  );
}

export default function PerfilPage() {
  const { address } = useAccount();
  const { user, catalog, logout, updateProfile, linkWallet, unlinkWallet } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"wallet" | "notifications" | "edit" | "payment" | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    studentCode: "",
    nationalId: "",
    program: "",
    birthCity: "",
    birthDate: "",
    phone: ""
  });

  const selectedUniversity = useMemo(
    () => catalog?.universities.find(item => item.id === user?.profile.universityId) ?? null,
    [catalog, user?.profile.universityId]
  );

  const selectedCampus = useMemo(
    () => selectedUniversity?.campuses.find(item => item.id === user?.profile.campusId) ?? null,
    [selectedUniversity, user?.profile.campusId]
  );
  const universityLogoSrc =
    universityLogoById[user?.profile.universityId || 0] || "/lazosGO.png";

  useEffect(() => {
    if (!user) return;
    setFormState({
      firstName: user.profile.firstName || "",
      lastName: user.profile.lastName || "",
      studentCode: user.profile.studentCode || "",
      nationalId: user.profile.nationalId || "",
      program: selectedCampus?.programs.find(program => program.id === user.profile.programId)?.name || "",
      birthCity: "",
      birthDate: "",
      phone: user.profile.phone || ""
    });
  }, [selectedCampus, user]);

  if (!user) {
    return (
      <main className="profile-screen">
        <section className="profile-shell profile-shell--empty">
          <div className="feature-lock-card">
            <strong>Sesion requerida</strong>
            <p>Inicia sesion o crea una cuenta para entrar al perfil.</p>
            <Link href="/">Volver al ingreso</Link>
          </div>
        </section>
      </main>
    );
  }

  const studentName =
    `${user.profile.firstName} ${user.profile.lastName}`.trim() || user.email.split("@")[0];
  const displayCode = user.profile.studentCode || user.profile.nationalId || "Sin codigo";
  const studentTypeLabel = user.profile.studentType || "Estudiante registrado";
  const benefitLabel = user.profile.benefitLabel || "Almuerzo regular";
  const programName =
    selectedCampus?.programs.find(program => program.id === user.profile.programId)?.name ||
    "Programa pendiente";
  const linkedWallet = user.linkedWallet?.address || "";
  const browserWallet = address || "";
  const connectedWalletMatchesUser =
    Boolean(browserWallet) &&
    Boolean(linkedWallet) &&
    browserWallet.toLowerCase() === linkedWallet.toLowerCase();
  const internalTickets = user.balances.internal.tickets;
  const internalNudos = user.balances.internal.nudos;
  const walletNudos = user.balances.wallet.erc20Nudos;
  const recycleActions = 0;
  const recycleSavings = 0;
  const walletTokensDisplay = walletNudos !== null ? `$${walletNudos}` : "$0";
  const internalNudosDisplay = String(internalNudos);
  const recycleCountDisplay = String(recycleActions);
  const identityLines = [
    displayCode || "Codigo",
    programName,
    user.email,
    user.profile.nationalId || "Cedula"
  ];
  const ticketsActive = internalTickets > 0;
  const recycleActive = recycleActions > 0;
  const savingsActive = recycleSavings > 0;
  const nudosActive = internalNudos > 0;

  const handleProfileSave = async () => {
    setSavingProfile(true);
    setStatusMessage("");

    const result = await updateProfile({
      firstName: formState.firstName,
      lastName: formState.lastName,
      nationalId: formState.nationalId,
      phone: formState.phone,
      studentCode: formState.studentCode
    });

    setSavingProfile(false);

    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setStatusMessage("Perfil actualizado.");
    setActivePanel(null);
  };

  const handleWalletLink = async () => {
    if (!browserWallet) {
      setStatusMessage("Primero conecta una wallet en el navegador.");
      return;
    }

    setWalletBusy(true);
    setStatusMessage("");
    const result = await linkWallet(browserWallet);
    setWalletBusy(false);

    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setStatusMessage("Wallet vinculada correctamente.");
  };

  const handleWalletUnlink = async () => {
    setWalletBusy(true);
    setStatusMessage("");
    const result = await unlinkWallet();
    setWalletBusy(false);

    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setStatusMessage("Wallet desvinculada.");
  };

  return (
    <>
      <main className="profile-screen">
        <section className="profile-shell">
          <header className="profile-topbar">
            <button
              className="profile-topbar__menu"
              onClick={() => setMenuOpen(true)}
              type="button"
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </button>
          </header>

          <section className="profile-status-row">
            <div className={`profile-status-card ${user.universityValidated ? "is-success" : ""}`}>
              <span className="profile-status-card__check" aria-hidden="true">✓</span>
              <div className="profile-status-card__copy">
                <strong>Estudiante</strong>
                <small>{studentTypeLabel || "Pregrado"}</small>
              </div>
            </div>
            <div className="profile-status-card">
              <span className="profile-status-card__check" aria-hidden="true">✓</span>
              <div className="profile-status-card__copy">
                <strong>Bono</strong>
                <small>{benefitLabel || "Almuerzo Regular"}</small>
              </div>
            </div>
          </section>

          <section className="profile-identity-stack">
            <div className="profile-account-row">
              <div className="profile-avatar-ring">
                <Image
                  src={avatarSrc}
                  alt={studentName}
                  width={100}
                  height={100}
                  className="profile-avatar-ring__image"
                />
              </div>

              <div className="profile-head-metrics">
                <div className="profile-head-metric">
                  <strong>{walletTokensDisplay}</strong>
                  <span>TOKENS</span>
                </div>
                <div className="profile-head-metric">
                  <strong>{internalNudosDisplay}</strong>
                  <span>$NUDOS</span>
                </div>
                <div className="profile-head-metric">
                  <strong>{recycleCountDisplay}</strong>
                  <span>RECICLA</span>
                </div>
              </div>
            </div>

            <div className="profile-card-id">
              <div className="profile-card-id__copy">
                <strong>[{studentName}]</strong>
                <div className="profile-card-id__meta">
                  <span>[{displayCode || "Codigo"}]</span>
                  <span>[{programName}]</span>
                  <span>[{user.profile.nationalId || "Cedula"}]</span>
                </div>
              </div>

              <div className="profile-card-id__barcode">
                <div className="profile-card-id__barcode-bars" aria-hidden="true" />
                <p>{user.email}</p>
              </div>

              <div className="profile-card-id__uni">
                <div className="profile-card-id__uni-badge">
                  <Image
                    src={universityLogoSrc}
                    alt={selectedUniversity?.name || "Universidad"}
                    width={56}
                    height={56}
                    className="profile-card-id__uni-logo"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="profile-history-grid">
            <BalanceTile
              value={String(internalTickets)}
              label="TICKETS"
              active={ticketsActive}
              iconSrc="/profile-panel/icon-ticket.svg"
              iconAlt="Icono de tickets"
            />
            <BalanceTile
              value={String(recycleActions)}
              label="RECICLAJE"
              active={recycleActive}
              iconSrc="/profile-panel/icon-recycle.svg"
              iconAlt="Icono de reciclaje"
            />
            <BalanceTile
              value={String(recycleSavings)}
              label="AHORRO"
              active={savingsActive}
              iconSrc="/profile-panel/icon-savings.svg"
              iconAlt="Icono de ahorro"
            />
            <BalanceTile
              value={String(internalNudos)}
              label="$NUDOS"
              active={nudosActive}
              iconSrc="/profile-panel/icon-nudos.svg"
              iconAlt="Icono de nudos"
            />
          </section>
        </section>
      </main>

      <div
        className={`profile-drawer-overlay ${menuOpen ? "is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      <aside className={`profile-drawer ${menuOpen ? "is-open" : ""}`}>
        <div className="profile-drawer__head">
          <button className="profile-drawer__close" onClick={() => setMenuOpen(false)} type="button">
            <X size={16} />
          </button>

          <div className="profile-drawer__identity">
            <div className="profile-avatar-ring is-small">
              <Image
                src={avatarSrc}
                alt={studentName}
                width={52}
                height={52}
                className="profile-avatar-ring__image"
              />
            </div>

            <div>
              <strong>[ {studentName.toUpperCase()} ]</strong>
              {identityLines.map(line => (
                <small key={line}>[ {line} ]</small>
              ))}
            </div>
          </div>
        </div>

        <div className="profile-drawer__body">
          <section className="profile-drawer__section">
            <p>Cuenta</p>
            {accountItems.map(item => (
              <DrawerRow
                key={item.key}
                label={item.label}
                detail={
                  item.key === "wallet"
                    ? linkedWallet
                      ? `${linkedWallet.slice(0, 6)}...${linkedWallet.slice(-4)}`
                      : "Sin wallet vinculada"
                    : item.key === "edit"
                      ? user.completion.profileComplete
                        ? "Perfil listo para operar"
                        : "Completa tus datos"
                      : item.detail
                }
                icon={item.icon}
                onClick={() => {
                  if (item.key === "wallet") setActivePanel("wallet");
                  if (item.key === "notifications") setActivePanel("notifications");
                  if (item.key === "edit") setActivePanel("edit");
                  if (item.key === "payment") setActivePanel("payment");
                }}
              />
            ))}
          </section>

          <section className="profile-drawer__section">
            <p>General</p>
            {generalItems.map(item => (
              <DrawerRow key={item.label} {...item} general />
            ))}
          </section>

          <button
            type="button"
            className="profile-drawer__logout"
            onClick={async () => {
              await logout();
              setMenuOpen(false);
            }}
          >
            Cerrar sesion
          </button>
        </div>
      </aside>

      {menuOpen && activePanel ? (
        <div className="profile-panel-layer">
          {activePanel === "wallet" ? (
            <section className="profile-panel-card">
              <div className="profile-panel-card__top">
                <div className="profile-panel-card__line" />
                <button type="button" onClick={() => setActivePanel(null)} aria-label="Cerrar popup">
                  <X size={16} />
                </button>
              </div>
              <h2>Wallet Network</h2>
              <p>Conecta tu wallet y luego vincula la direccion activa a tu perfil.</p>
              <WalletConnect />
              <div className="profile-wallet-status">
                <small className="profile-wallet-copy">Wallet del navegador: {browserWallet || "ninguna"}</small>
                <small className="profile-wallet-copy">Wallet vinculada: {linkedWallet || "ninguna"}</small>
              </div>
              <div className="profile-wallet-actions">
                <button
                  type="button"
                  className="profile-edit-save"
                  onClick={handleWalletLink}
                  disabled={walletBusy || !browserWallet || connectedWalletMatchesUser}
                >
                  {walletBusy ? "Procesando" : connectedWalletMatchesUser ? "Wallet ya vinculada" : "Vincular wallet actual"}
                </button>
                <button
                  type="button"
                  className="profile-edit-cancel"
                  onClick={handleWalletUnlink}
                  disabled={walletBusy || !linkedWallet}
                >
                  Desvincular wallet
                </button>
              </div>
              <div className="profile-wallet-meta">
                <small>{user.syncState.walletLinked ? "Wallet enlazada con backend local." : "Aun no has enlazado una wallet."}</small>
                <small>
                  {connectedWalletMatchesUser
                    ? "La wallet conectada coincide con la vinculada en tu perfil."
                    : "Puedes conectar una wallet y luego vincular esa direccion."}
                </small>
              </div>
              {statusMessage ? <small className="profile-wallet-copy">{statusMessage}</small> : null}
            </section>
          ) : null}

          {activePanel === "notifications" ? (
            <section className="profile-panel-card">
              <div className="profile-panel-card__top">
                <h2>Notificaciones</h2>
                <button type="button" onClick={() => setActivePanel(null)} aria-label="Cerrar popup">
                  <X size={16} />
                </button>
              </div>
              <div className="profile-panel-card__tabs">
                <button type="button" className="is-active">New</button>
                <button type="button">All</button>
              </div>
              <div className="profile-panel-card__list">
                {notifications.map(item => (
                  <article key={`${item.title}-${item.time}`} className="profile-notice-item">
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.body}</small>
                    </div>
                    <span>{item.time}</span>
                  </article>
                ))}
              </div>
              <small className="profile-wallet-copy">Fuente real pendiente. Por ahora se muestra solo la UI base.</small>
            </section>
          ) : null}

          {activePanel === "edit" ? (
            <section className="profile-panel-card is-form">
              <div className="profile-panel-card__identity">
                <div className="profile-avatar-ring">
                  <Image src={avatarSrc} alt={studentName} width={68} height={68} className="profile-avatar-ring__image" />
                </div>
                <div>
                  <h2>Editar Perfil</h2>
                  <p>Aqui puedes poner tus datos basicos.</p>
                </div>
              </div>
              <div className="profile-edit-grid">
                <input value={formState.firstName} onChange={event => setFormState(prev => ({ ...prev, firstName: event.target.value }))} placeholder="[nombre]" />
                <input value={formState.lastName} onChange={event => setFormState(prev => ({ ...prev, lastName: event.target.value }))} placeholder="[apellido]" />
                <input value={formState.studentCode} onChange={event => setFormState(prev => ({ ...prev, studentCode: event.target.value }))} placeholder="[codigoestudiantil]" />
                <input value={formState.nationalId} onChange={event => setFormState(prev => ({ ...prev, nationalId: event.target.value }))} placeholder="[cedula]" />
                <input value={formState.program} onChange={event => setFormState(prev => ({ ...prev, program: event.target.value }))} placeholder="[programa]" />
                <div className="profile-edit-select is-static">
                  <span>{selectedUniversity?.name || "Universidad pendiente"}</span>
                  <QrCode size={16} />
                </div>
                <div className="profile-edit-select is-static">
                  <span>{selectedCampus?.name || "Campus pendiente"}</span>
                  <ChevronDown size={16} />
                </div>
                <input value={formState.phone} onChange={event => setFormState(prev => ({ ...prev, phone: event.target.value }))} placeholder="[telefono]" />
              </div>
              <div className="profile-edit-actions">
                <button type="button" className="profile-edit-cancel" onClick={() => setActivePanel(null)}>Cancel</button>
                <button type="button" className="profile-edit-save" onClick={handleProfileSave}>
                  {savingProfile ? "Guardando" : "Guardar"}
                </button>
              </div>
              <div className="profile-edit-footer">
                <small>E-mail Asociado: [{user.email}]</small>
                <small>Cuenta desde: [{user.createdAt.slice(0, 10)}]</small>
                <small>ID: [{user.id}]</small>
              </div>
              {statusMessage ? <small className="profile-wallet-copy">{statusMessage}</small> : null}
            </section>
          ) : null}

          {activePanel === "payment" ? (
            <section className="profile-panel-card is-payment">
              <div className="profile-panel-card__payment-head">
                <button type="button" onClick={() => setActivePanel(null)} aria-label="Volver popup">
                  <ChevronRight size={18} className="is-back" />
                </button>
                <div>
                  <h2>Metodos de pago</h2>
                  <p>Anade aqui tus datos de pago</p>
                </div>
              </div>
              <div className="profile-payment-brands">
                <span className="is-payu">PayU</span>
                <span>VISA</span>
                <span>Mastercard</span>
                <span>Baloto</span>
                <span>efecty</span>
              </div>
              <div className="profile-payment-form">
                <label>
                  <span>Card number</span>
                  <input type="text" value="••••••••••••••••" readOnly />
                </label>
                <div className="profile-payment-form__row">
                  <label>
                    <span>Exp. Date</span>
                    <input type="text" value="12/34" readOnly />
                  </label>
                  <label>
                    <span>CVV</span>
                    <input type="text" value="•••" readOnly />
                  </label>
                </div>
                <button type="button" className="profile-edit-save">Guardar Metodo de Pago</button>
              </div>
              <p className="profile-payment-divider">O puedes vincular</p>
              <button type="button" className="profile-payment-google">Google Pay</button>
              <small className="profile-wallet-copy">Este modulo sigue en UI solamente; aun no se guarda en backend.</small>
            </section>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
