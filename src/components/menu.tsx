"use client";
import { useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  MapPin,
  Clock3,
  Utensils,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useApp } from "./provider";
import { Brand, Modal, Notice, Photo } from "./ui";
import { priceLabel } from "@/lib/validation";
import type { Dish } from "@/lib/types";
export function MenuPage({
  slug,
  previewId,
}: {
  slug?: string;
  previewId?: string;
}) {
  const {
    restaurants,
    dishes,
    loading,
    demo,
    error,
    reload,
    resetDemo,
    access,
  } = useApp();
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<Dish | null>(null);
  const canPreview = Boolean(
    previewId &&
    (access?.kind === "platform" || access?.restaurantIds.includes(previewId)),
  );
  const restaurant = restaurants.find((r) =>
    previewId
      ? canPreview && r.id === previewId
      : r.slug === slug && r.published,
  );
  if (loading)
    return (
      <div className="page-loading">
        <Brand />
        <p>Cargando la carta…</p>
      </div>
    );
  if (error)
    return (
      <div className="page-loading">
        <Brand />
        <Notice error>{error}</Notice>
        <button className="btn" onClick={() => void reload()}>
          Volver a intentar
        </button>
        {demo ? (
          <button
            className="btn"
            onClick={() => {
              if (
                window.confirm(
                  "¿Restablecer los datos de ejemplo? Se eliminarán los cambios locales.",
                )
              )
                resetDemo();
            }}
          >
            Restablecer demo
          </button>
        ) : null}
      </div>
    );
  if (!restaurant)
    return (
      <div className="page-loading">
        <Brand />
        <h1>Esta carta no está disponible</h1>
        <p>Comprueba el enlace o consulta con el restaurante.</p>
        <Link href="/" className="btn">
          Volver al inicio
        </Link>
      </div>
    );
  const menu = dishes
    .filter((d) => d.restaurant_id === restaurant.id && d.available)
    .sort(
      (a, b) =>
        restaurant.categories.indexOf(a.category) -
          restaurant.categories.indexOf(b.category) ||
        a.sort_order - b.sort_order ||
        a.id.localeCompare(b.id),
    );
  const activeCategory =
    category && restaurant.categories.includes(category) ? category : null;
  const shown =
    activeCategory === null
      ? menu
      : menu.filter((d) => d.category === activeCategory);
  return (
    <main
      className="menu-page"
      style={{ "--accent": restaurant.accent } as CSSProperties}
    >
      <div className="demo-top">
        <div className="container demo-top-inner">
          <Brand dark />
          <span>
            {canPreview
              ? "VISTA PREVIA PRIVADA"
              : demo
                ? "RESTAURANTE DE DEMOSTRACIÓN"
                : "CARTA DIGITAL"}
          </span>
        </div>
      </div>
      <header className="restaurant-header">
        <div className="container restaurant-header-inner">
          <div>
            <div className="eyebrow">
              <span className="line" /> {restaurant.tagline}
            </div>
            <h1>
              {restaurant.name}
              <span className="name-dot">.</span>
            </h1>
            <p className="restaurant-description">{restaurant.description}</p>
            <div className="restaurant-meta">
              <span>
                <MapPin size={16} />
                {restaurant.address}
              </span>
              <span>
                <Clock3 size={16} />
                {restaurant.hours}
              </span>
            </div>
          </div>
          <div className="menu-seal" aria-hidden="true">
            <Utensils size={31} />
            <span>
              A TU GUSTO.
              <br />A TU MESA.
            </span>
          </div>
        </div>
      </header>
      <div className="category-bar">
        <nav
          className="container categories"
          aria-label="Categorías de la carta"
        >
          <button
            className={activeCategory === null ? "category active" : "category"}
            aria-pressed={activeCategory === null}
            onClick={() => setCategory(null)}
          >
            <Utensils size={16} />
            Toda la carta
          </button>
          {restaurant.categories.map((c) => (
            <button
              key={c}
              className={c === activeCategory ? "category active" : "category"}
              aria-pressed={c === activeCategory}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </nav>
      </div>
      <section className="container menu-content">
        <div className="section-heading">
          <div>
            <span className="eyebrow dark">HECHO PARA DISFRUTAR</span>
            <h2>{activeCategory ?? "Nuestra carta"}</h2>
          </div>
          <div className="menu-hint">
            Fotos, ingredientes y precios al alcance de tu mano.
          </div>
        </div>
        {shown.length ? (
          <div className="dish-grid">
            {shown.map((d, i) => (
              <button
                className="dish-card"
                key={d.id}
                onClick={() => setSelected(d)}
                aria-label={`Ver ${d.name}`}
              >
                <div className="dish-photo">
                  <Photo src={d.image_url} alt={d.name} priority={i < 3} />
                  {d.featured ? (
                    <span className="badge badge-white">De la casa</span>
                  ) : null}
                  <span className="card-arrow">
                    <ArrowUpRight size={22} />
                  </span>
                </div>
                <div className="dish-body">
                  <span className="dish-category">{d.category}</span>
                  <div className="dish-title-row">
                    <h3>{d.name}</h3>
                    <span className="price">
                      {priceLabel(d.price, restaurant.currency)}
                    </span>
                  </div>
                  <p>{d.description}</p>
                  <span className="dish-more">
                    Ver detalle <ChevronRight size={15} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty">
            <Utensils size={34} />
            <h3>Estamos preparando esta sección</h3>
            <p>Explora las otras categorías de nuestra carta.</p>
          </div>
        )}
        <div className="menu-footnote">
          <Sparkles size={17} />
          <p>
            {demo
              ? "Carta de ejemplo. Las fotos y los precios son ilustrativos."
              : "¿Tienes alguna alergia? Consulta con nuestro equipo antes de pedir."}
          </p>
          <span>Precios en {restaurant.currency}</span>
        </div>
      </section>
      <footer className="menu-footer">
        <Brand />
        <span>Una nueva forma de elegir.</span>
        <Link href="/creditos">Créditos de los recursos</Link>
      </footer>
      {selected ? (
        <Modal title={selected.name} onClose={() => setSelected(null)} wide>
          <div className="dish-detail">
            <div className="detail-info">
              <span className="eyebrow dark">{selected.category}</span>
              <h2>{selected.name}</h2>
              <p>{selected.description}</p>
              <strong className="detail-price">
                {priceLabel(selected.price, restaurant.currency)}
              </strong>
              {selected.allergens ? (
                <div className="allergens">
                  <strong>Alérgenos declarados</strong>
                  <p>{selected.allergens}. Consulta por posibles trazas.</p>
                </div>
              ) : (
                <p className="subtle">
                  Consulta al restaurante por alérgenos y posibles trazas.
                </p>
              )}
            </div>
            <Photo
              src={selected.image_url}
              alt={selected.name}
              className="detail-photo"
            />
          </div>
        </Modal>
      ) : null}
    </main>
  );
}
