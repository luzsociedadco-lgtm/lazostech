"use client";

import Image from "next/image";
import { CheckCircle2, Menu, Search, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type MarketItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  mode: string;
  seller: string;
  location: string;
  image: string;
};

const categories = ["Todos", "Libros", "Tecnología", "Trueque", "Ropa", "Emprendimientos"];
const storageKey = "lazostech-unimarket-demo-items";

const seedItems: MarketItem[] = [
  { id: "books", title: "Calculadoras y libros", description: "Kit de estudio, excelente estado", category: "Libros", price: "350", mode: "Trueque", seller: "Valentina · Univalle", location: "Biblioteca Central", image: "/images/slide-1.jpg" },
  { id: "laptop", title: "Laptop para clases", description: "8GB RAM, poco uso", category: "Tecnología", price: "1.800", mode: "Oferta", seller: "Carlos · Univalle", location: "Cafetería Meléndez", image: "/images/slide-1.jpg" },
  { id: "brownies", title: "Brownies de la casa", description: "Entrega en campus esta tarde", category: "Emprendimientos", price: "8", mode: "Comprar", seller: "Laura · Univalle", location: "Plazoleta Ingenierías", image: "/images/slide-1.jpg" },
];

const emptyForm = { title: "", description: "", category: "Libros", price: "", mode: "Trueque", location: "" };

export default function UniMarketPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [items, setItems] = useState(seedItems);
  const [selected, setSelected] = useState<MarketItem | null>(null);
  const [published, setPublished] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as MarketItem[];
        if (Array.isArray(parsed)) setItems([...parsed, ...seedItems]);
      }
    } catch {
      // The demo still works with the seed data if local storage is unavailable.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const customItems = items.filter(item => !seedItems.some(seed => seed.id === item.id));
    window.localStorage.setItem(storageKey, JSON.stringify(customItems));
  }, [hydrated, items]);

  const visibleItems = useMemo(() => items.filter(item => {
    const matchesCategory = category === "Todos" || item.category === category;
    const haystack = `${item.title} ${item.description} ${item.category} ${item.seller}`.toLowerCase();
    return matchesCategory && (!query.trim() || haystack.includes(query.trim().toLowerCase()));
  }), [category, items, query]);

  function updateForm(field: keyof typeof emptyForm, value: string) {
    setForm(current => ({ ...current, [field]: value }));
  }

  function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newItem: MarketItem = {
      id: `demo-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      price: form.price.trim() || "A convenir",
      mode: form.mode,
      seller: "Tu · Univalle",
      location: form.location.trim() || "Punto seguro del campus",
      image: "/images/slide-1.jpg",
    };
    setItems(current => [newItem, ...current]);
    setForm(emptyForm);
    setPublished(false);
    setNotice("Tu publicación quedó guardada en esta demo.");
  }

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

        {notice ? <p className="market-demo-notice" role="status">{notice}</p> : null}

        <label className="market-searchbar">
          <Search size={16} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar en mi campus..." aria-label="Buscar en mi campus" />
        </label>

        <div className="market-demo-categories" aria-label="Filtrar por categoría">
          {categories.map(option => <button key={option} type="button" className={category === option ? "is-active" : ""} onClick={() => setCategory(option)}>{option}</button>)}
        </div>

        <section className="market-section">
          <div className="market-section__header"><h2>Publicaciones destacadas</h2><span className="market-demo-count">{visibleItems.length} disponibles</span></div>
          <div className="market-featured-strip market-demo-items">
            {visibleItems.map(item => (
              <article key={item.id} className="market-product-card" role="button" tabIndex={0} onClick={() => setSelected(item)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") setSelected(item); }}>
                <div className="market-product-card__image"><Image src={item.image} alt="" fill sizes="146px" /></div>
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

      {selected ? <div className="market-demo-modal-layer"><section className="market-demo-modal" role="dialog" aria-modal="true" aria-labelledby="item-title"><button type="button" className="market-demo-close" onClick={() => setSelected(null)} aria-label="Cerrar detalle"><X size={18} /></button><span className="market-demo-modal-label">PUBLICACIÓN VERIFICADA</span><h2 id="item-title">{selected.title}</h2><p>{selected.description}</p><div className="market-demo-modal-meta"><strong>{selected.price}</strong><span>{selected.mode}</span><span>{selected.seller}</span><span>Entrega: {selected.location}</span></div><button type="button" className="market-demo-primary market-demo-full" onClick={() => { setSelected(null); setNotice("Solicitud preparada para el intercambio."); }}>Solicitar intercambio</button></section></div> : null}

      {published ? <div className="market-demo-modal-layer"><section className="market-demo-modal" role="dialog" aria-modal="true" aria-labelledby="publish-title"><button type="button" className="market-demo-close" onClick={() => setPublished(false)} aria-label="Cerrar publicación"><X size={18} /></button><span className="market-demo-modal-label">NUEVA PUBLICACIÓN</span><h2 id="publish-title">Publica dentro de tu campus</h2><p>Completa los datos y guarda un borrador funcional en esta demo.</p><form className="market-demo-form" onSubmit={handlePublish}><input className="market-demo-input" value={form.title} onChange={event => updateForm("title", event.target.value)} placeholder="¿Qué quieres ofrecer?" aria-label="Título de la publicación" required /><textarea className="market-demo-input" value={form.description} onChange={event => updateForm("description", event.target.value)} placeholder="Describe el ítem o servicio" aria-label="Descripción" rows={3} required /><div className="market-demo-form-grid"><select className="market-demo-input" value={form.category} onChange={event => updateForm("category", event.target.value)} aria-label="Categoría">{categories.slice(1).map(option => <option key={option}>{option}</option>)}</select><input className="market-demo-input" value={form.price} onChange={event => updateForm("price", event.target.value)} placeholder="Precio" aria-label="Precio" /></div><div className="market-demo-form-grid"><select className="market-demo-input" value={form.mode} onChange={event => updateForm("mode", event.target.value)} aria-label="Modalidad"><option>Trueque</option><option>Oferta</option><option>Comprar</option></select><input className="market-demo-input" value={form.location} onChange={event => updateForm("location", event.target.value)} placeholder="Punto de entrega" aria-label="Punto de entrega" /></div><button type="submit" className="market-demo-primary market-demo-full">Guardar publicación</button></form></section></div> : null}
    </main>
  );
}
