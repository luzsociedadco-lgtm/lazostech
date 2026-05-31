"use client";

import Image from "next/image";
import {
  BookMarked,
  HandHeart,
  Megaphone,
  Menu,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Shirt,
  SlidersHorizontal,
  ShoppingBag,
  Smartphone,
  Tag,
  UserRound,
  Utensils,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { FeatureGate } from "@/app/components/FeatureGate";
import ComingSoonCover from "@/app/components/ComingSoonCover";
import { useNudosErc20Balance } from "@/app/hooks/useNudosErc20Balance";
import { useAuth } from "@/app/providers/AuthProvider";

const categories = [
  { label: "Alimentos", iconSrc: "/marketplace-categories/cubiertos.svg", tone: "food" },
  { label: "Libros", iconSrc: "/marketplace-categories/libro.svg", tone: "books" },
  { label: "Trueque", iconSrc: "/marketplace-categories/trueque.svg", tone: "swap" },
  { label: "Emprendim", iconSrc: "/marketplace-categories/emprendimientos.svg", tone: "venture" },
  { label: "Ropa", iconSrc: "/marketplace-categories/ropa.svg", tone: "clothes" },
  { label: "Accesorios", iconSrc: "/marketplace-categories/accesorios.svg", tone: "accessories" },
  { label: "Stickers", iconSrc: "/marketplace-categories/stickers.svg", tone: "stickers" },
  { label: "Pines", iconSrc: "/marketplace-categories/pines.svg", tone: "pins" },
];

const featured = [
  {
    title: "Libros de Calculo",
    subtitle: "Excelente estado, 3 libros",
    meta: "libros",
    price: "350",
    action: "Trueque",
    image: "/images/slide-1.jpg",
  },
  {
    title: "Ticket Almuerzo",
    subtitle: "Valido para cafeteria central",
    meta: "ticket",
    price: "120",
    action: "Comprar",
    image: "/images/slide-1.jpg",
  },
  {
    title: "Laptop usada",
    subtitle: "8GB RAM, poco uso",
    meta: "tecnologia",
    price: "1800",
    action: "Oferta",
    image: "/images/slide-1.jpg",
  },
];

type DrawerPanel = "publish" | "account" | "posts" | "messages" | "sales" | "notifications" | "support";

const inventoryLinks: Array<{ key: DrawerPanel; label: string; icon: typeof UserRound }> = [
  { key: "account", label: "Mi cuenta", icon: UserRound },
  { key: "posts", label: "Publicaciones", icon: Tag },
  { key: "messages", label: "Mensajes", icon: MessageSquare },
  { key: "sales", label: "Actividad de ventas", icon: HandHeart },
  { key: "notifications", label: "Notificaciones", icon: Megaphone },
  { key: "support", label: "Soporte AI", icon: MessageSquare },
];

const drawerPanelCopy: Record<DrawerPanel, { title: string; body: string; action: string }> = {
  publish: {
    title: "Publicar nuevo item",
    body: "Carga el nombre, categoria, fotos y condiciones de trueque o venta para dejar el producto listo en el marketplace universitario.",
    action: "Crear borrador"
  },
  account: {
    title: "Mi cuenta",
    body: "Consulta tu identidad de vendedor, reputacion, wallet vinculada y resumen de participacion dentro del mercado.",
    action: "Ver perfil"
  },
  posts: {
    title: "Publicaciones",
    body: "Administra tus productos activos, pausados y borradores antes de enviarlos a revision o publicarlos.",
    action: "Gestionar items"
  },
  messages: {
    title: "Mensajes",
    body: "Revisa conversaciones con otros estudiantes para coordinar entregas, trueques, ofertas y puntos de encuentro.",
    action: "Abrir inbox"
  },
  sales: {
    title: "Actividad de ventas",
    body: "Sigue solicitudes, intercambios en curso, pagos pendientes y cierres de operaciones del marketplace.",
    action: "Ver actividad"
  },
  notifications: {
    title: "Notificaciones",
    body: "Recibe avisos sobre nuevas ofertas, mensajes, cambios de estado y oportunidades destacadas.",
    action: "Configurar avisos"
  },
  support: {
    title: "Soporte AI",
    body: "Obtén ayuda para redactar publicaciones, mejorar precios, responder compradores o clasificar productos.",
    action: "Pedir ayuda"
  }
};

const sellerPosts = [
  { title: "Libros de Calculo", status: "Activa", action: "Desactivar" },
  { title: "Laptop usada", status: "Inactiva", action: "Activar" },
  { title: "Kit de stickers", status: "Activa", action: "Desactivar" },
];

const sellerMessages = [
  { item: "Ticket Almuerzo", from: "Laura M.", body: "Aceptas trueque por calculadora?" },
  { item: "Libros de Calculo", from: "Carlos R.", body: "Puedo recogerlo en biblioteca central." },
];

const salesHistory = [
  { item: "Mochila deportiva", status: "Exitosa", gas: "0.00042 ETH" },
  { item: "Laptop usada", status: "Fallida", gas: "0.00018 ETH" },
  { item: "Kit de stickers", status: "Exitosa", gas: "0.00021 ETH" },
];

const marketplaceNotifications = [
  "Nueva oferta recibida por Libros de Calculo.",
  "Tienes una conversacion pendiente por cerrar.",
  "Una publicacion inactiva puede volver a publicarse.",
];

const recentItems = [
  {
    title: "Calculadora cientifica",
    subtitle: "Casio fx-991LA X, poco uso",
    icon: BookMarked,
  },
  {
    title: "Mochila deportiva",
    subtitle: "Marca Nike, color negro",
    icon: ShoppingBag,
  },
  {
    title: "Audifonos bluetooth",
    subtitle: "Estuche completo, buen estado",
    icon: Smartphone,
  },
  {
    title: "Kit de stickers",
    subtitle: "Disenos UV, edicion limitada",
    icon: Tag,
  },
];

function useHorizontalDrag() {
  const ref = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 });

  return {
    ref,
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      drag.current = {
        active: true,
        startX: event.clientX,
        scrollLeft: event.currentTarget.scrollLeft
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      if (!drag.current.active) return;
      event.currentTarget.scrollLeft = drag.current.scrollLeft - (event.clientX - drag.current.startX);
    },
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
      drag.current.active = false;
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    onPointerCancel: () => {
      drag.current.active = false;
    },
    onWheel: (event: React.WheelEvent<HTMLDivElement>) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.currentTarget.scrollLeft += event.deltaY;
      event.preventDefault();
    }
  };
}

function DrawerPanelContent({ panel }: { panel: DrawerPanel }) {
  if (panel === "publish") {
    return (
      <div className="market-panel-form">
        <label>
          <span>Nombre del item</span>
          <input type="text" placeholder="Ej. Calculadora cientifica" />
        </label>
        <label>
          <span>Condicion de intercambio</span>
          <input type="text" placeholder="Venta, trueque o mixto" />
        </label>
      </div>
    );
  }

  if (panel === "account") {
    return (
      <div className="market-panel-stack">
        <div className="market-seller-summary">
          <strong>Randy Peterson</strong>
          <span>Vende: libros, tecnologia y accesorios</span>
          <span>Correo: randy.p@domainname.com</span>
          <span>Telefono: +57 300 456 7890</span>
        </div>
        <label className="market-panel-field">
          <span>Biografia editable</span>
          <textarea defaultValue="Estudiante emprendedor. Publico articulos universitarios, tecnologia usada y recursos de estudio." />
        </label>
      </div>
    );
  }

  if (panel === "posts") {
    return (
      <div className="market-panel-list">
        {sellerPosts.map(post => (
          <article key={post.title} className="market-panel-row">
            <div>
              <strong>{post.title}</strong>
              <span>{post.status}</span>
            </div>
            <div className="market-panel-row__actions">
              <button type="button">Editar</button>
              <button type="button">{post.action}</button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (panel === "messages") {
    return (
      <div className="market-panel-list">
        {sellerMessages.map(message => (
          <article key={`${message.item}-${message.from}`} className="market-panel-row">
            <div>
              <strong>{message.item}</strong>
              <span>{message.from}: {message.body}</span>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (panel === "sales") {
    return (
      <div className="market-panel-list">
        {salesHistory.map(sale => (
          <article key={`${sale.item}-${sale.gas}`} className="market-panel-row">
            <div>
              <strong>{sale.item}</strong>
              <span>{sale.status} / Gas generado: {sale.gas}</span>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (panel === "notifications") {
    return (
      <div className="market-panel-list">
        {marketplaceNotifications.map(notification => (
          <article key={notification} className="market-panel-note">
            {notification}
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="market-chatbot">
      <div className="market-chatbot__bubble is-ai">Hola, puedo ayudarte con dudas, inquietudes o arbitrajes.</div>
      <div className="market-chatbot__bubble">Necesito resolver una disputa por un trueque.</div>
      <label>
        <span>Escribe tu consulta</span>
        <input type="text" placeholder="Describe el caso..." />
      </label>
    </div>
  );
}

export default function MarketplacePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [walletQrOpen, setWalletQrOpen] = useState(false);
  const [activeDrawerPanel, setActiveDrawerPanel] = useState<DrawerPanel | null>(null);
  const { user } = useAuth();
  const { balance, isConnected, isLoading, symbol } = useNudosErc20Balance();
  const balanceDisplay = isConnected ? (isLoading ? "..." : balance ?? "0") : "Conecta tu wallet";
  const walletAddress = user?.linkedWallet?.address || "";
  const drawerUserName = [user?.profile.firstName, user?.profile.lastName].filter(Boolean).join(" ") || "Usuario $NUDOS";
  const drawerUserEmail = user?.email || "correo no vinculado";
  const walletQrUrl = walletAddress
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(walletAddress)}`
    : "";
  const categoryDrag = useHorizontalDrag();
  const featuredDrag = useHorizontalDrag();

  return (
    <>
      <main className="market-screen">
        <section className="market-shell">
          <FeatureGate module="marketplace">
          <header className="market-topbar">
            <h1>Marketplace</h1>
            <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Abrir inventario">
              <Menu size={18} />
            </button>
          </header>

          <section className="market-balance-card">
            <div>
              <span>Tu balance</span>
              <strong className={!isConnected ? "is-wallet-prompt" : ""}>
                {`${balanceDisplay}${isConnected ? ` ${symbol}` : ""}`}
              </strong>
            </div>
            <button type="button" onClick={() => setWalletQrOpen(true)}>
              <span className="market-recycle-pill__icon" aria-hidden="true" />
              <span>Reciclar +</span>
            </button>
          </section>

          <label className="market-searchbar">
            <Search size={16} />
            <input type="text" placeholder="Buscar productos, servicios..." />
            <SlidersHorizontal size={16} />
          </label>

          <section className="market-category-strip" {...categoryDrag}>
            {categories.map(({ label, iconSrc, tone }) => (
              <button key={label} type="button" className={`market-category-pill is-${tone}`}>
                <span>
                  <Image src={iconSrc} alt="" width={27} height={27} aria-hidden="true" />
                </span>
                <small>{label}</small>
              </button>
            ))}
          </section>

          <section className="market-section">
            <div className="market-section__header">
              <h2>Destacados</h2>
              <button type="button">Ver todos</button>
            </div>

            <div className="market-featured-strip" {...featuredDrag}>
              {featured.map((item, index) => (
                <article key={item.title} className="market-product-card">
                  <div className="market-product-card__image">
                    <Image src={item.image} alt={item.title} fill sizes="126px" priority={index === 0} />
                  </div>
                  <div className="market-product-card__body">
                    <h3>{item.title}</h3>
                    <p>{item.subtitle}</p>
                    <div className="market-product-card__footer">
                      <strong>{item.price}</strong>
                      <span>{item.action}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="market-section">
            <div className="market-section__header">
              <h2>Turismo</h2>
              <button type="button">Ver todos</button>
            </div>

            <article className="market-tour-card">
              <div className="market-tour-card__image">
                <Image src="/images/Capa_01.png" alt="Tour Cultural Siloe" fill sizes="340px" />
              </div>
              <div className="market-tour-card__overlay">
                <h3>Tour Cultural Siloé</h3>
                <p>
                  Descubre la historia y<br />
                  cultura de Siloé con<br />
                  guías locales.
                </p>
                <strong>100 $NUDOS</strong>
              </div>
            </article>
          </section>

          <section className="market-section">
            <div className="market-section__header">
              <h2>Recien publicados</h2>
              <button type="button">Ver todos</button>
            </div>

            <div className="market-recent-list">
              {recentItems.map(({ title, subtitle, icon: Icon }) => (
                <article key={title} className="market-recent-item">
                  <span className="market-recent-item__icon">
                    <Icon size={18} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <small>{subtitle}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
          </FeatureGate>
        </section>
      </main>

      <div className={`market-overlay ${drawerOpen ? "is-open" : ""}`} onClick={() => setDrawerOpen(false)} />

      <aside className={`market-drawer ${drawerOpen ? "is-open" : ""}`}>
        <div className="market-drawer__top">
          <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Cerrar inventario">
            <X size={18} />
          </button>
        </div>

        <div className="market-drawer__profile">
          <Image
            src="/images/user.jpg"
            alt="Usuario marketplace"
            width={56}
            height={56}
            className="market-drawer__avatar"
          />
          <div>
            <strong>{drawerUserName}</strong>
            <span>{drawerUserEmail}</span>
          </div>
        </div>

        <div className="market-drawer__publish">
          <div>
            <strong>Postea un</strong>
            <strong>nuevo item</strong>
            <span>Inventario universitario</span>
          </div>
          <button type="button" onClick={() => setActiveDrawerPanel("publish")}>
            <Plus size={19} strokeWidth={3.2} />
            <span>Publicar</span>
          </button>
        </div>

        <div className="market-drawer__links">
          {inventoryLinks.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" className="market-drawer__link" onClick={() => setActiveDrawerPanel(key)}>
              <span>
                <Icon size={18} />
                <strong>{label}</strong>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {activeDrawerPanel ? (
        <div className="market-panel-layer">
          <div className="market-panel-overlay" onClick={() => setActiveDrawerPanel(null)} />
          <section className="market-panel-card">
            <div className="market-panel-card__top">
              <h2>{drawerPanelCopy[activeDrawerPanel].title}</h2>
              <button type="button" onClick={() => setActiveDrawerPanel(null)} aria-label="Cerrar popup">
                <X size={18} />
              </button>
            </div>
            <DrawerPanelContent panel={activeDrawerPanel} />
            <button type="button" className="market-panel-card__action">
              {drawerPanelCopy[activeDrawerPanel].action}
            </button>
          </section>
        </div>
      ) : null}

      {walletQrOpen ? (
        <div className="recycle-popup-layer">
          <div className="recycle-popup-overlay" onClick={() => setWalletQrOpen(false)} />
          <section className="recycle-popup-card market-popup-card">
            <div className="recycle-popup-card__top">
              <h2>QR de tu wallet</h2>
              <button type="button" onClick={() => setWalletQrOpen(false)} aria-label="Cerrar popup QR">
                <X size={18} />
              </button>
            </div>

            {walletAddress ? (
              <>
                <p>Este codigo representa la wallet que recibira la acreditacion del reciclaje.</p>
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
      <ComingSoonCover imageSrc="/coming-soon/marketplace.png" tone="marketplace" />
    </>
  );
}
