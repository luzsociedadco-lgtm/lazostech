"use client";

import Image from "next/image";
import { CheckCircle2, Menu, Search, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";

const categories = ["Todos", "Libros", "Tecnología", "Trueque", "Ropa", "Emprendimientos"];

const items = [
  { title: "Calculadoras y libros", description: "Kit de estudio, excelente estado", category: "Libros", price: "350", mode: "Trueque", seller: "Valentina · Univalle", location: "Biblioteca Central", image: "/images/slide-1.jpg" },
  { title: "Laptop para clases", description: "8GB RAM, poco uso", category: "Tecnología", price: "1.800", mode: "Oferta", seller: "Carlos · Univalle", location: "Cafetería Meléndez", image: "/images/slide-1.jpg" },
  { title: "Brownies de la casa", description: "Entrega en campus esta tarde", category: "Emprendimientos", price: "8", mode: "Comprar", seller: "Laura · Univalle", location: "Plazoleta Ingenierías", image: "/images/slide-1.jpg" },
];

export default function UniMarketPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [selected, setSelected] = useState<(typeof items)[number] | null>(null);
  const [published, setPublished] = useState(false);

  const visibleItems = useMemo(() => items.filter(item => {
    const matchesCategory = category === "Todos" || item.category === category;
    const haystack = `${item.title} ${item.description} ${item.category}`.toLowerCase();
    return matchesCategory && (!query.trim() || haystack.includes(query.trim().toLowerCase()));
  }), [category, query]);

  return (
    <main className="market-screen market-demo-screen">
      <section className="market-shell market-demo-shell">
        <header className="market-topbar">
          <div className="market-brand-lockup">
            <span className="market-brand-mark" aria-hidden="true">L</span>
            <div><span className="market-brand-name">LAZOSTECH</span><h1>UniMarket</h1></div>
          </div>
          <button type="button" aria-label="Menú del demo"><Menu size={19} /></button>
        </header>

        <section className="market-demo-banner">
          <div>
            <span>LAZOSTECH · DEMO SHIPATON</span>
            <strong>Intercambio circular universitario</strong>
            <p>Compra, vende o intercambia dentro de tu comunidad universitaria.</p>
          </div>
          <ShieldCheck size={34} aria-hidden="true" />
        </section>

        <div className="market-demo-actions">
          <span className="market-demo-verified"><CheckCircle2 size={15} /> Comunidad verificada</span>
          <button type="button" className="market-demo-primary" onClick={() => setPublished(true)}>Publicar ítem</button>
        </div>

        <label className="market-searchbar">
          <Search size={16} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar en mi campus..." />
        </label>

        <div className="market-demo-categories" aria-label="Filtrar por categoría">
          {categories.map(option => <button key={option} type="button" className={category === option ? "is-active" : ""} onClick={() => setCategory(option)}>{option}</button>)}
        </div>

        <section className="market-section">
          <div className="market-section__header"><h2>Publicaciones destacadas</h2><span className="market-demo-count">{visibleItems.length} disponibles</span></div>
          <div className="market-featured-strip market-demo-items">
            {visibleItems.map(item => (
              <article key={item.title} className="market-product-card" role="button" tabIndex={0} onClick={() => setSelected(item)} onKeyDown={event => { if (event.key === "Enter") setSelected(item); }}>
                <div className="market-product-card__image"><Image src={item.image} alt="" fill sizes="126px" /></div>
                <div className="market-product-card__body"><h3>{item.title}</h3><p>{item.description}</p><small>{item.seller}</small><div className="market-product-card__footer"><strong>{item.price}</strong><span>{item.mode}</span></div></div>
              </article>
            ))}
            {!visibleItems.length ? <p className="market-empty-state">No hay publicaciones con esos filtros.</p> : null}
          </div>
        </section>

        <section className="market-section">
          <div className="market-section__header"><h2>Intercambio seguro</h2><span className="market-demo-count">Sin comisiones en el piloto</span></div>
          <article className="market-demo-safety"><ShieldCheck size={25} /><div><strong>Encuentros dentro del campus</strong><p>Coordina la entrega en puntos visibles y conversa antes de confirmar.</p></div></article>
        </section>

        <section className="market-section">
          <div className="market-section__header"><h2>Impacto de la comunidad</h2><span className="market-demo-count">Piloto Univalle</span></div>
          <div className="market-demo-impact"><div><strong>35</strong><span>estudiantes validando</span></div><div><strong>68</strong><span>ítems en circulación</span></div><div><strong>100%</strong><span>entrega local</span></div></div>
        </section>
      </section>

      {selected ? <div className="market-demo-modal-layer"><section className="market-demo-modal"><button type="button" className="market-demo-close" onClick={() => setSelected(null)} aria-label="Cerrar"><X size={18} /></button><span className="market-demo-modal-label">PUBLICACIÓN VERIFICADA</span><h2>{selected.title}</h2><p>{selected.description}</p><div className="market-demo-modal-meta"><strong>{selected.price}</strong><span>{selected.mode}</span><span>{selected.seller}</span><span>Entrega: {selected.location}</span></div><button type="button" className="market-demo-primary market-demo-full" onClick={() => setSelected(null)}>Solicitar intercambio</button></section></div> : null}
      {published ? <div className="market-demo-modal-layer"><section className="market-demo-modal"><button type="button" className="market-demo-close" onClick={() => setPublished(false)} aria-label="Cerrar"><X size={18} /></button><span className="market-demo-modal-label">NUEVA PUBLICACIÓN</span><h2>Publica dentro de tu campus</h2><p>En el MVP puedes cargar fotos, precio o condición de trueque y elegir un punto de entrega seguro.</p><input className="market-demo-input" placeholder="¿Qué quieres ofrecer?" /><button type="button" className="market-demo-primary market-demo-full" onClick={() => setPublished(false)}>Crear borrador</button></section></div> : null}
    </main>
  );
}
