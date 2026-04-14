"use client";

import Image from "next/image";
import {
  BookOpen,
  BriefcaseBusiness,
  CookingPot,
  Megaphone,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Shirt,
  ShoppingBag,
  Tag,
  Ticket,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";

const categories = [
  { label: "Alimentos", icon: CookingPot },
  { label: "Libros", icon: BookOpen },
  { label: "Trueque", icon: WalletCards },
  { label: "Emprendim", icon: BriefcaseBusiness },
  { label: "Ropa", icon: Shirt },
  { label: "Accesorios", icon: ShoppingBag },
  { label: "Stickers", icon: Tag },
  { label: "Pines", icon: Megaphone },
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
    image: "/images/Capa_01.png",
  },
  {
    title: "Laptop Asus",
    subtitle: "8GB RAM, poco uso",
    meta: "tecnologia",
    price: "1800",
    action: "Oferta",
    image: "/images/slide-1.jpg",
  },
];

const inventoryLinks = [
  { label: "My Account", icon: UserRound },
  { label: "Publicaciones", icon: Tag },
  { label: "Mensajes", icon: MessageSquare },
  { label: "Actividad de ventas", icon: BriefcaseBusiness },
  { label: "Notificaciones", icon: Megaphone },
  { label: "Settings", icon: Settings },
  { label: "Soporte AI", icon: MessageSquare },
];

const recentItems = [
  {
    title: "Calculadora cientifica",
    subtitle: "Casio fx-991LA X, poco uso",
    icon: BookOpen,
  },
  {
    title: "Mochila deportiva",
    subtitle: "Marca Nike, color negro",
    icon: ShoppingBag,
  },
];

export default function MarketplacePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <main className="market-screen">
        <section className="market-shell">
          <header className="market-topbar">
            <h1>Marketplace</h1>
            <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Abrir inventario">
              <Menu size={18} />
            </button>
          </header>

          <section className="market-balance-card">
            <div>
              <span>Tu balance</span>
              <strong>1,250 NUDOS</strong>
            </div>
            <button type="button" onClick={() => setDrawerOpen(true)}>
              Vender +
            </button>
          </section>

          <label className="market-searchbar">
            <Search size={16} />
            <input type="text" placeholder="Buscar productos, servicios..." />
          </label>

          <section className="market-category-strip">
            {categories.map(({ label, icon: Icon }) => (
              <button key={label} type="button" className="market-category-pill">
                <span>
                  <Icon size={18} />
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

            <div className="market-featured-strip">
              {featured.map(item => (
                <article key={item.title} className="market-product-card">
                  <div className="market-product-card__image">
                    <Image src={item.image} alt={item.title} fill />
                  </div>
                  <div className="market-product-card__body">
                    <h3>{item.title}</h3>
                    <p>{item.subtitle}</p>
                    <small>{item.meta}</small>
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
                <Image src="/images/slide-1.jpg" alt="Tour Cultural Siloe" fill />
              </div>
              <div className="market-tour-card__overlay">
                <h3>Tour Cultural Siloe</h3>
                <p>
                  Descubre la historia y cultura de Siloe con guias locales.
                </p>
                <strong>450 $NUDOS</strong>
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
            <strong>Randy Peterson</strong>
            <span>randy.p@domainname.com</span>
          </div>
        </div>

        <div className="market-drawer__publish">
          <div>
            <strong>Postea Nuevo Item</strong>
            <span>45,200 actions</span>
          </div>
          <button type="button">
            <Plus size={16} />
            <span>Publicar</span>
          </button>
        </div>

        <div className="market-drawer__links">
          {inventoryLinks.map(({ label, icon: Icon }) => (
            <button key={label} type="button" className="market-drawer__link">
              <span>
                <Icon size={18} />
                <strong>{label}</strong>
              </span>
            </button>
          ))}
        </div>

        <button type="button" className="market-drawer__logout">
          Log out
        </button>
      </aside>
    </>
  );
}
