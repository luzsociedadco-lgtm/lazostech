"use client";

import Image from "next/image";
import { CheckCircle2, Handshake, ImagePlus, Menu, Search, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, MutableRefObject, PointerEvent, RefObject } from "react";

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

type DragState = {
  active: boolean;
  moved: boolean;
  startX: number;
  startScrollLeft: number;
};

const categories = ["Todos", "Libros", "Tecnología", "Trueque", "Ropa", "Emprendimientos"];
const storageKey = "lazostech-unimarket-demo-items";

const seedItems: MarketItem[] = [
  { id: "books", title: "Calculadoras y libros", description: "Kit de estudio, excelente estado", category: "Libros", price: "350", mode: "Trueque", seller: "Valentina · Univalle", location: "Biblioteca Central", image: "/images/slide-1.jpg" },
  { id: "laptop", title: "Laptop para clases", description: "8GB RAM, poco uso", category: "Tecnología", price: "1.800", mode: "Oferta", seller: "Carlos · Univalle", location: "Cafetería Meléndez", image: "/images/slide-1.jpg" },
  { id: "brownies", title: "Brownies de la casa", description: "Entrega en campus esta tarde", category: "Emprendimientos", price: "8", mode: "Comprar", seller: "Laura · Univalle", location: "Plazoleta Ingenierías", image: "/images/slide-1.jpg" },
  { id: "bike", title: "Bicicleta urbana", description: "Lista para moverse por el campus", category: "Trueque", price: "1.200", mode: "Oferta", seller: "Andrés · Univalle", location: "Portería Meléndez", image: "/images/slide-1.jpg" },
  { id: "jacket", title: "Chaqueta impermeable", description: "Talla M, poco uso", category: "Ropa", price: "90", mode: "Comprar", seller: "Natalia · Univalle", location: "Cafetería Central", image: "/images/slide-1.jpg" },
  { id: "branding", title: "Diseño para emprendimiento", description: "Logo y piezas para redes", category: "Emprendimientos", price: "25", mode: "Oferta", seller: "Sofía · Univalle", location: "Coworking campus", image: "/images/slide-1.jpg" },
];

const emptyForm = { title: "", description: "", category: "Libros", price: "", mode: "Trueque", location: "" };

export default function UniMarketPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [items, setItems] = useState(seedItems);
  const [selected, setSelected] = useState<MarketItem | null>(null);
  const [published, setPublished] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const categoryStripRef = useRef<HTMLDivElement>(null);
  const featuredStripRef = useRef<HTMLDivElement>(null);
  const featuredSectionRef = useRef<HTMLElement>(null);
  const safetySectionRef = useRef<HTMLElement>(null);
  const impactSectionRef = useRef<HTMLElement>(null);
  const categoryDragRef = useRef<DragState>({ active: false, moved: false, startX: 0, startScrollLeft: 0 });
  const featuredDragRef = useRef<DragState>({ active: false, moved: false, startX: 0, startScrollLeft: 0 });

  function startHorizontalDrag(ref: RefObject<HTMLDivElement | null>, drag: MutableRefObject<DragState>, event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const element = ref.current;
    if (!element) return;
    drag.current = { active: true, moved: false, startX: event.clientX, startScrollLeft: element.scrollLeft };
    element.setPointerCapture(event.pointerId);
  }

  function moveHorizontalDrag(ref: RefObject<HTMLDivElement | null>, drag: MutableRefObject<DragState>, event: PointerEvent<HTMLDivElement>) {
    const element = ref.current;
    if (!element || !drag.current.active) return;
    const delta = event.clientX - drag.current.startX;
    if (Math.abs(delta) > 4) drag.current.moved = true;
    element.scrollLeft = drag.current.startScrollLeft - delta;
  }

  function endHorizontalDrag(ref: RefObject<HTMLDivElement | null>, drag: MutableRefObject<DragState>, event: PointerEvent<HTMLDivElement>) {
    const element = ref.current;
    if (element?.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    drag.current.active = false;
  }

  function selectCategory(option: string) {
    if (categoryDragRef.current.moved) {
      categoryDragRef.current.moved = false;
      return;
    }
    setCategory(option);
  }

  function openItem(item: MarketItem) {
    if (featuredDragRef.current.moved) {
      featuredDragRef.current.moved = false;
      return;
    }
    setSelected(item);
  }

  function goToSection(ref: RefObject<HTMLElement | null>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  }

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

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImageFiles(Array.from(event.target.files ?? []));
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
    setImageFiles([]);
    setPublished(false);
    setNotice("Tu publicación quedó guardada en esta demo.");
  }

  return (
    <main className="market-screen market-demo-screen">
      <section className="market-shell market-demo-shell">
        <header className="market-topbar">
          <div className="market-brand-lockup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="market-brand-logo" src="/marketplace-lazostech.svg" alt="LazosTech" />
            <div><span className="market-brand-name">LAZOSTECH</span><h1>UniMarket</h1></div>
          </div>
          <button type="button" aria-label="Menú del marketplace" aria-expanded={menuOpen} aria-controls="unimarket-menu" onClick={() => setMenuOpen(current => !current)}><Menu size={19} /></button>
        </header>

        {menuOpen ? <nav id="unimarket-menu" className="market-demo-menu" aria-label="Opciones del marketplace">
          <button type="button" onClick={() => goToSection(featuredSectionRef)}>Explorar publicaciones</button>
          <button type="button" onClick={() => { setMenuOpen(false); setPublished(true); }}>Publicar un ítem</button>
          <button type="button" onClick={() => goToSection(safetySectionRef)}>Intercambio seguro</button>
          <button type="button" onClick={() => goToSection(impactSectionRef)}>Impacto de la comunidad</button>
        </nav> : null}

        <section className="market-demo-banner">
          <div>
            <span>LAZOSTECH · DEMO SHIPATON</span>
            <strong>Intercambio circular universitario</strong>
            <p>Compra, vende o intercambia dentro de tu comunidad universitaria.</p>
          </div>
          <Handshake size={42} aria-hidden="true" />
        </section>

        <div className="market-demo-actions">
          <span className="market-demo-verified"><CheckCircle2 size={18} /> Comunidad verificada</span>
          <button type="button" className="market-demo-primary" onClick={() => setPublished(true)}>Publicar ítem</button>
        </div>

        {notice ? <p className="market-demo-notice" role="status">{notice}</p> : null}

        <label className="market-searchbar">
          <Search size={16} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar en mi campus..." aria-label="Buscar en mi campus" />
        </label>

        <div className="market-demo-categories" aria-label="Filtrar por categoría" ref={categoryStripRef} onPointerDown={event => startHorizontalDrag(categoryStripRef, categoryDragRef, event)} onPointerMove={event => moveHorizontalDrag(categoryStripRef, categoryDragRef, event)} onPointerUp={event => endHorizontalDrag(categoryStripRef, categoryDragRef, event)} onPointerCancel={event => endHorizontalDrag(categoryStripRef, categoryDragRef, event)}>
          {categories.map(option => <button key={option} type="button" className={category === option ? "is-active" : ""} onClick={() => selectCategory(option)}>{option}</button>)}
        </div>

        <section className="market-section" ref={featuredSectionRef}>
          <div className="market-section__header"><h2>Publicaciones destacadas</h2><span className="market-demo-count">{visibleItems.length} disponibles</span></div>
          <div className="market-featured-strip market-demo-items" ref={featuredStripRef} onPointerDown={event => startHorizontalDrag(featuredStripRef, featuredDragRef, event)} onPointerMove={event => moveHorizontalDrag(featuredStripRef, featuredDragRef, event)} onPointerUp={event => endHorizontalDrag(featuredStripRef, featuredDragRef, event)} onPointerCancel={event => endHorizontalDrag(featuredStripRef, featuredDragRef, event)}>
            {visibleItems.map(item => (
              <article key={item.id} className="market-product-card" role="button" tabIndex={0} onClick={() => openItem(item)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") setSelected(item); }}>
                <div className="market-product-card__image"><Image src={item.image} alt="" fill sizes="146px" /></div>
                <div className="market-product-card__body"><h3>{item.title}</h3><p>{item.description}</p><small>{item.seller}</small><div className="market-product-card__footer"><strong>{item.price}</strong><span>{item.mode}</span></div></div>
              </article>
            ))}
            {!visibleItems.length ? <p className="market-empty-state">No hay publicaciones con esos filtros.</p> : null}
          </div>
        </section>

        <section className="market-section" ref={safetySectionRef}>
          <div className="market-section__header"><h2>Intercambio seguro</h2><span className="market-demo-count">Sin comisiones · piloto</span></div>
          <article className="market-demo-safety"><ShieldCheck size={25} /><div><strong>Encuentros dentro del campus</strong><p>Coordina la entrega en puntos visibles y conversa antes de confirmar.</p></div></article>
        </section>

        <section className="market-section" ref={impactSectionRef}>
          <div className="market-section__header"><h2>Impacto de la comunidad</h2><span className="market-demo-count">Piloto Univalle</span></div>
          <div className="market-demo-impact"><div><strong>35</strong><span>estudiantes validando</span></div><div><strong>68</strong><span>ítems en circulación</span></div><div><strong>100%</strong><span>entrega local</span></div></div>
        </section>
      </section>

      {selected ? <div className="market-demo-modal-layer"><section className="market-demo-modal" role="dialog" aria-modal="true" aria-labelledby="item-title"><button type="button" className="market-demo-close" onClick={() => setSelected(null)} aria-label="Cerrar detalle"><X size={18} /></button><span className="market-demo-modal-label">PUBLICACIÓN VERIFICADA</span><h2 id="item-title">{selected.title}</h2><p>{selected.description}</p><div className="market-demo-modal-meta"><strong>{selected.price}</strong><span>{selected.mode}</span><span>{selected.seller}</span><span>Entrega: {selected.location}</span></div><button type="button" className="market-demo-primary market-demo-full" onClick={() => { setSelected(null); setNotice("Solicitud preparada para el intercambio."); }}>Solicitar intercambio</button></section></div> : null}

      {published ? <div className="market-demo-modal-layer"><section className="market-demo-modal" role="dialog" aria-modal="true" aria-labelledby="publish-title"><button type="button" className="market-demo-close" onClick={() => setPublished(false)} aria-label="Cerrar publicación"><X size={18} /></button><span className="market-demo-modal-label">NUEVA PUBLICACIÓN</span><h2 id="publish-title">Publica dentro de tu campus</h2><p>Completa los datos y guarda un borrador funcional en esta demo.</p><form className="market-demo-form" onSubmit={handlePublish}><input className="market-demo-input" value={form.title} onChange={event => updateForm("title", event.target.value)} placeholder="¿Qué quieres ofrecer?" aria-label="Título de la publicación" required /><textarea className="market-demo-input" value={form.description} onChange={event => updateForm("description", event.target.value)} placeholder="Describe el ítem o servicio" aria-label="Descripción" rows={3} required /><div className="market-demo-form-grid"><select className="market-demo-input" value={form.category} onChange={event => updateForm("category", event.target.value)} aria-label="Categoría">{categories.slice(1).map(option => <option key={option}>{option}</option>)}</select><input className="market-demo-input" value={form.price} onChange={event => updateForm("price", event.target.value)} placeholder="Precio" aria-label="Precio" /></div><div className="market-demo-form-grid"><select className="market-demo-input" value={form.mode} onChange={event => updateForm("mode", event.target.value)} aria-label="Modalidad"><option>Trueque</option><option>Oferta</option><option>Comprar</option></select><input className="market-demo-input" value={form.location} onChange={event => updateForm("location", event.target.value)} placeholder="Punto de entrega" aria-label="Punto de entrega" /></div><label className="market-demo-upload"><ImagePlus size={18} aria-hidden="true" /><span><strong>Adjuntar imágenes</strong><small>{imageFiles.length ? `${imageFiles.length} imagen${imageFiles.length === 1 ? "" : "es"} seleccionada${imageFiles.length === 1 ? "" : "s"}` : "JPG, PNG o WebP"}</small></span><input type="file" accept="image/*" multiple onChange={handleImageChange} aria-label="Adjuntar imágenes" /></label><button type="submit" className="market-demo-primary market-demo-full">Guardar publicación</button></form></section></div> : null}
    </main>
  );
}
