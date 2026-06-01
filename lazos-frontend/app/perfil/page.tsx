"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";

import { useNudosErc20Balance } from "@/app/hooks/useNudosErc20Balance";
import { WalletConnect } from "@/app/components/WalletConnect";
import { NUDOS_DIAMOND_ADDRESS, profileFacetAbi } from "@/app/lib/diamondContracts";
import { useAuth } from "@/app/providers/AuthProvider";
import { config as wagmiConfig } from "@/app/providers/WagmiWrapper";

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
  disabled = false,
  onClick
}: {
  label: string;
  detail: string;
  icon: LucideIcon;
  general?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`profile-drawer__row ${general ? "is-general" : ""} ${disabled ? "is-disabled" : ""}`}
      type="button"
      disabled={disabled}
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
  const router = useRouter();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { user, catalog, logout, updateProfile, linkWallet, unlinkWallet, refresh } = useAuth();
  const { balance: erc20Balance, isLoading: erc20Loading, isConnected: erc20Connected } = useNudosErc20Balance();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"avatar" | "wallet" | "notifications" | "edit" | "payment" | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [avatarStatus, setAvatarStatus] = useState("");
  const [notificationFilter, setNotificationFilter] = useState<"new" | "all">("new");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const walletFlowRef = useRef<{
    syncingAddress: string | null;
    disconnecting: boolean;
  }>({
    syncingAddress: null,
    disconnecting: false
  });
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    studentCode: "",
    nationalId: "",
    universityId: 0,
    campusId: 1,
    programId: 0,
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
  const formUniversity = useMemo(
    () => catalog?.universities.find(item => item.id === formState.universityId) ?? null,
    [catalog, formState.universityId]
  );
  const formCampus = useMemo(
    () => formUniversity?.campuses.find(item => item.id === formState.campusId) ?? null,
    [formUniversity, formState.campusId]
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
      universityId: user.profile.universityId || 0,
      campusId: user.profile.campusId || 1,
      programId: user.profile.programId || 0,
      phone: user.profile.phone || ""
    });
  }, [user]);

  const studentName =
    user ? `${user.profile.firstName} ${user.profile.lastName}`.trim() || user.email.split("@")[0] : "";
  const displayCode = user?.profile.studentCode || user?.profile.nationalId || "Sin codigo";
  const studentTypeLabel = user?.profile.studentType || "Estudiante registrado";
  const benefitLabel = user?.profile.benefitLabel || "Almuerzo regular";
  const programName =
    selectedCampus?.programs.find(program => program.id === user?.profile.programId)?.name ||
    "Programa pendiente";
  const linkedWallet = user?.linkedWallet?.address || "";
  const browserWallet = address || "";
  const connectedWalletMatchesUser =
    Boolean(browserWallet) &&
    Boolean(linkedWallet) &&
    browserWallet.toLowerCase() === linkedWallet.toLowerCase();
  const availableTickets = user?.tickets.available ?? 0;
  const recycleActions = 0;
  const recycleSavings = 0;
  const erc20BalanceDisplay = erc20Connected
    ? erc20Loading
      ? "..."
      : erc20Balance ?? "0"
    : "0";
  const nudosSymbol = "$NUDOS";
  const recycleCountDisplay = String(recycleActions);
  const identityLines = [
    displayCode || "Codigo",
    programName,
    user?.email || "",
    user?.profile.nationalId || "Cedula"
  ];
  const ticketsActive = availableTickets > 0;
  const recycleActive = recycleActions > 0;
  const savingsActive = recycleSavings > 0;
  const nudosActive = Number(erc20Balance ?? 0) > 0;
  const filteredNotifications =
    notificationFilter === "all"
      ? user?.notifications ?? []
      : (user?.notifications ?? []).filter(item => !item.isRead);

  const parseJson = async (response: Response) => response.json().catch(() => ({}));

  const handleProfileSave = async () => {
    setSavingProfile(true);
    setStatusMessage("");

    const result = await updateProfile({
      firstName: formState.firstName,
      lastName: formState.lastName,
      nationalId: formState.nationalId,
      phone: formState.phone,
      studentCode: formState.studentCode,
      universityId: formState.universityId,
      campusId: formState.campusId,
      programId: formState.programId
    });

    setSavingProfile(false);

    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setStatusMessage("Perfil actualizado correctamente.");
  };

  const syncBrowserWallet = async (walletAddress: string) => {
    if (!publicClient) {
      setStatusMessage("No hay cliente blockchain disponible en este momento.");
      return;
    }

    setWalletBusy(true);
    setStatusMessage("");

    try {
      const localLink = await linkWallet(walletAddress);
      if (localLink.error) {
        setStatusMessage(localLink.error);
        return;
      }

      if (!user) {
        setStatusMessage("No hay una sesion activa para completar la vinculacion.");
        return;
      }

      const preferredUniversityId = user.profile.universityId === 1000 ? 1000n : 0n;
      let profileRegistered = true;

      setStatusMessage("Wallet enlazada localmente. Verificando perfil en Diamond...");

      try {
        await publicClient.readContract({
          address: NUDOS_DIAMOND_ADDRESS,
          abi: profileFacetAbi,
          functionName: "getProfile",
          args: [walletAddress as `0x${string}`]
        });
      } catch {
        profileRegistered = false;
      }

      if (!profileRegistered) {
        setStatusMessage("Registrando perfil en Diamond...");

        const registerHash = await writeContractAsync({
          address: NUDOS_DIAMOND_ADDRESS,
          abi: profileFacetAbi,
          functionName: "registerProfile",
          args: [`lazos://profile/${user.id}`, preferredUniversityId, 1]
        });

        await waitForTransactionReceipt(wagmiConfig, { hash: registerHash });
      }

      setStatusMessage("Sincronizando afiliacion institucional con el operador...");

      const syncResponse = await fetch("/api/wallet/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const syncJson = await parseJson(syncResponse);

      await refresh();

      if (!syncResponse.ok) {
        setStatusMessage(syncJson.error || "La wallet quedo enlazada, pero no se pudo completar la sincronizacion con Diamond.");
        return;
      }

      setStatusMessage(syncJson.sync?.message || "Wallet enlazada y sincronizada correctamente con Diamond.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "No se pudo completar la integracion de la wallet.");
    } finally {
      setWalletBusy(false);
      walletFlowRef.current.syncingAddress = null;
    }
  };

  const handleWalletUnlink = async () => {
    setWalletBusy(true);
    setStatusMessage("");
    const result = await unlinkWallet();
    setWalletBusy(false);
    walletFlowRef.current.disconnecting = false;

    if (result.error) {
      setStatusMessage(result.error);
      return;
    }

    setStatusMessage("Wallet desvinculada al desconectarse del navegador.");
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    if (activePanel !== "wallet") {
      return;
    }

    if (browserWallet) {
      const normalizedBrowserWallet = browserWallet.toLowerCase();

      if (
        connectedWalletMatchesUser ||
        walletBusy ||
        walletFlowRef.current.syncingAddress === normalizedBrowserWallet
      ) {
        return;
      }

      walletFlowRef.current.syncingAddress = normalizedBrowserWallet;
      void syncBrowserWallet(browserWallet);
      return;
    }

    if (
      !browserWallet &&
      linkedWallet &&
      !walletBusy &&
      !walletFlowRef.current.disconnecting
    ) {
      walletFlowRef.current.disconnecting = true;
      void handleWalletUnlink();
    }
  }, [activePanel, browserWallet, connectedWalletMatchesUser, linkedWallet, walletBusy]);

  const handleAvatarFileChange = () => {
    setAvatarStatus("La actualizacion de foto estara disponible mas adelante.");
  };

  const handleNotificationClick = async (notificationId: string, href: string | null) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId })
    });

    await refresh();

    if (href) {
      setMenuOpen(false);
      setActivePanel(null);
      router.push(href);
    }
  };

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
                <UserCircle2 size={72} aria-label={studentName || "Usuario"} />
              </div>

              <div className="profile-head-metrics">
                <div className="profile-head-metric">
                  <strong>{erc20BalanceDisplay}</strong>
                  <span>{nudosSymbol}</span>
                </div>
                <div className="profile-head-metric">
                  <strong>{String(availableTickets)}</strong>
                  <span>TICKETS</span>
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
              value={String(availableTickets)}
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
              value={erc20BalanceDisplay}
              label={nudosSymbol}
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
            <button
              type="button"
              className="profile-avatar-trigger"
              onClick={() => {
                setAvatarStatus("");
                setActivePanel("avatar");
              }}
              aria-label="Opciones de foto de perfil"
            >
              <div className="profile-avatar-ring is-small">
                <UserCircle2 size={38} aria-label={studentName || "Usuario"} />
              </div>
            </button>

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
                    ? "Deshabilitado por ahora"
                    : item.key === "edit"
                      ? user.completion.profileComplete
                        ? "Perfil listo para operar"
                        : "Completa tus datos"
                      : item.detail
                }
                icon={item.icon}
                disabled={item.key === "wallet"}
                onClick={() => {
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
            ---- cerrar sesión ----
          </button>
        </div>
      </aside>

      {menuOpen && activePanel ? (
        <div className="profile-panel-layer">
          {activePanel === "avatar" ? (
            <section className="profile-panel-card profile-panel-card--avatar">
              <div className="profile-panel-card__top">
                <div className="profile-panel-card__line" />
                <button type="button" onClick={() => setActivePanel(null)} aria-label="Cerrar popup avatar">
                  <X size={16} />
                </button>
              </div>
              <h2>Foto de perfil</h2>
              <p>Escoge si quieres actualizar la foto actual o dejar visible la ruta futura del avatar personalizable.</p>
              <div className="profile-avatar-options">
                <button
                  type="button"
                  className="profile-avatar-option"
                  disabled
                  onClick={() => {
                    setAvatarStatus("La actualizacion de foto estara disponible mas adelante.");
                  }}
                >
                  <strong>Actualizar foto de perfil</strong>
                  <small>Esta funcion esta deshabilitada por ahora.</small>
                </button>
                <button type="button" className="profile-avatar-option is-disabled" disabled>
                  <strong>Editar avatar pfp customizable</strong>
                  <small>Visible por ahora. Esta sección llegará después.</small>
                </button>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="profile-avatar-input"
                onChange={handleAvatarFileChange}
                disabled
              />
              <button
                type="button"
                className="profile-avatar-save"
                disabled
                onClick={() => {
                  setAvatarStatus("La actualizacion de foto estara disponible mas adelante.");
                }}
              >
                Guardar cambios
              </button>
              {avatarStatus ? <small className="profile-wallet-copy">{avatarStatus}</small> : null}
            </section>
          ) : null}

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
                <small className="profile-wallet-copy">Wallet vinculada: {linkedWallet || "ninguna"}</small>
              </div>
              <div className="profile-wallet-meta">
                <small>
                  {user.syncState.onchainAffiliationSynced
                    ? "Wallet enlazada y sincronizada con Diamond."
                    : user.syncState.onchainProfileRegistered
                      ? "Perfil ya registrado en Diamond. Falta confirmar la afiliacion final."
                      : user.syncState.walletLinked
                        ? "Wallet enlazada localmente. Falta terminar la sincronizacion on-chain."
                        : "Aun no has enlazado una wallet."}
                </small>
                <small>
                  {connectedWalletMatchesUser
                    ? "La wallet conectada coincide con la vinculada y puede operar sobre el Diamond."
                    : browserWallet
                      ? "La wallet conectada se vinculara automaticamente con esta cuenta."
                      : "Si desconectas la wallet desde WalletConnect, tambien se desvinculara de esta cuenta."}
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
                <button
                  type="button"
                  className={notificationFilter === "new" ? "is-active" : ""}
                  onClick={() => setNotificationFilter("new")}
                >
                  New
                </button>
                <button
                  type="button"
                  className={notificationFilter === "all" ? "is-active" : ""}
                  onClick={() => setNotificationFilter("all")}
                >
                  All
                </button>
              </div>
              <div className="profile-panel-card__list">
                {filteredNotifications.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className={`profile-notice-item ${item.type === "dao" ? "is-dao" : ""}`}
                    onClick={() => handleNotificationClick(item.id, item.href)}
                  >
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.body}</small>
                    </div>
                    <span>{new Date(item.createdAt).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit" })}</span>
                  </button>
                ))}
              </div>
              {!filteredNotifications.length ? (
                <small className="profile-wallet-copy">No tienes notificaciones en esta vista.</small>
              ) : null}
            </section>
          ) : null}

          {activePanel === "edit" ? (
            <section className="profile-panel-card is-form">
              <div className="profile-panel-card__identity">
                <div className="profile-avatar-ring">
                  <UserCircle2 size={52} aria-label={studentName || "Usuario"} />
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
                <select
                  className="profile-edit-select"
                  value={formState.universityId}
                  onChange={event => {
                    const universityId = Number(event.target.value);
                    const university = catalog?.universities.find(item => item.id === universityId);
                    const campusId = university?.campuses[0]?.id ?? 1;
                    const programId = university?.campuses[0]?.programs[0]?.id ?? 0;
                    setFormState(prev => ({ ...prev, universityId, campusId, programId }));
                  }}
                >
                  <option value={0}>Universidad pendiente</option>
                  {catalog?.universities.map(university => (
                    <option key={university.id} value={university.id}>
                      {university.name}
                    </option>
                  ))}
                </select>
                <select
                  className="profile-edit-select"
                  value={formState.campusId}
                  onChange={event => {
                    const campusId = Number(event.target.value);
                    const campus = formUniversity?.campuses.find(item => item.id === campusId);
                    setFormState(prev => ({ ...prev, campusId, programId: campus?.programs[0]?.id ?? 0 }));
                  }}
                >
                  {(formUniversity?.campuses.length ? formUniversity.campuses : selectedUniversity?.campuses ?? []).map(campus => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
                <select
                  className="profile-edit-select"
                  value={formState.programId}
                  onChange={event => setFormState(prev => ({ ...prev, programId: Number(event.target.value) }))}
                >
                  <option value={0}>Programa pendiente</option>
                  {formCampus?.programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
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
