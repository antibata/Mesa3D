"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  ExternalLink,
  Pencil,
  Trash2,
  Box,
  Copy,
  Star,
  ArrowUp,
  ArrowDown,
  Download,
  ArrowLeft,
} from "lucide-react";
import { Workspace } from "./workspace";
import { useApp } from "./provider";
import { Modal, Notice, Photo } from "./ui";
import { RestaurantForm, DishForm } from "./editors";
import { SectionsPanel } from "./sections-panel";
import { QrPanel } from "./qr-panel";
import { priceLabel } from "@/lib/validation";
import type { Dish } from "@/lib/types";
export function RestaurantPanel({ id }: { id: string }) {
  const app = useApp();
  const [tab, setTab] = useState("Carta"),
    [editing, setEditing] = useState<Dish | null>(null),
    [adding, setAdding] = useState(false),
    [deleting, setDeleting] = useState<Dish | null>(null),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [pending, setPending] = useState("");
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("");
  const [status, setStatus] = useState("");
  const r = app.restaurants.find((v) => v.id === id);
  const allowed =
    app.access?.kind === "platform" || app.access?.restaurantIds.includes(id);
  const dishes = app.dishes
    .filter((d) => d.restaurant_id === id)
    .sort(
      (a, b) =>
        (r?.categories.indexOf(a.category) ?? 0) -
          (r?.categories.indexOf(b.category) ?? 0) ||
        a.sort_order - b.sort_order ||
        a.id.localeCompare(b.id),
    );
  const visible = dishes.filter(
    (d) =>
      (!section ||
        !r?.categories.includes(section) ||
        d.category === section) &&
      (!status ||
        (status === "visible"
          ? d.available
          : status === "hidden"
            ? !d.available
            : d.featured)) &&
      `${d.name} ${d.description} ${d.category}`
        .toLocaleLowerCase("es")
        .includes(search.toLocaleLowerCase("es")),
  );
  async function run(action: () => Promise<void>, success: string) {
    setPending("action");
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setPending("");
    }
  }
  function move(d: Dish, direction: number) {
    const list = [...dishes];
    const index = list.findIndex((v) => v.id === d.id);
    const target = index + direction;
    if (!list[target] || list[target].category !== d.category) return;
    [list[index], list[target]] = [list[target], list[index]];
    void run(
      () =>
        app.reorderDishes(
          id,
          list.map((v) => v.id),
        ),
      "Orden de platos guardado.",
    );
  }
  function exportMenu() {
    if (!r) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ restaurant: r, dishes }, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `carta-${r.slug}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function toggle(d: Dish) {
    setPending(d.id);
    setError("");
    try {
      await app.saveDish({ ...d, available: !d.available });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar.");
    } finally {
      setPending("");
    }
  }
  return (
    <Workspace title={r?.name ?? "Restaurante"}>
      {!r || !allowed ? (
        <div className="empty">
          <h2>Restaurante no disponible</h2>
          <p>No tienes acceso a esta carta o ya no existe.</p>
          <Link className="btn" href="/panel">
            Volver a mis restaurantes
          </Link>
        </div>
      ) : (
        <>
          <Link
            href="/panel"
            className="back-link"
            style={{ marginTop: 0, marginBottom: 20 }}
          >
            <ArrowLeft size={14} /> Mis restaurantes
          </Link>
          <div className="workspace-heading">
            <div>
              <h1>
                {r.name}
                <span
                  className="pill"
                  style={{ marginLeft: 12, verticalAlign: "middle" }}
                >
                  {r.published ? "Publicada" : "Borrador"}
                </span>
              </h1>
              <p>Una carta siempre al día.</p>
            </div>
            <div className="actions">
              {app.access?.kind === "platform" ? <Link className="btn" href={`/panel/restaurantes/${id}/alta`}>Alta y entrega</Link> : null}
              <Link
                className="btn"
                href={`/panel/restaurantes/${id}/vista-previa`}
              >
                Vista previa
              </Link>
              <button className="btn" onClick={exportMenu}>
                <Download size={16} /> Exportar carta
              </button>
              <button
                className="btn"
                disabled={Boolean(pending)}
                onClick={() =>
                  void run(
                    () => app.saveRestaurant({ ...r, published: !r.published }),
                    r.published ? "Carta despublicada." : "Carta publicada.",
                  )
                }
              >
                {r.published ? "Despublicar" : "Publicar carta"}
              </button>
              {r.published ? (
                <Link href={`/r/${r.slug}`} className="btn">
                  <ExternalLink size={16} /> Ver carta
                </Link>
              ) : null}
              <button className="btn primary" onClick={() => setAdding(true)}>
                <Plus size={18} /> Añadir plato
              </button>
            </div>
          </div>
          <div className="stats menu-stats">
            <div className="stat">
              <span className="stat-label">Platos disponibles</span>
              <strong>
                {dishes.filter((d) => d.available).length}
                <small> / {dishes.length}</small>
              </strong>
            </div>
            <div className="stat">
              <span className="stat-label">Secciones</span>
              <strong>{r.categories.length}</strong>
            </div>
            <div className="stat">
              <span className="stat-label">Destacados</span>
              <strong>{dishes.filter((d) => d.featured).length}</strong>
            </div>
          </div>
          <div
            className="tabs"
            role="tablist"
            aria-label="Administración del restaurante"
          >
            {["Carta", "Secciones", "Identidad", "Código QR"].map((t) => (
              <button
                key={t}
                role="tab"
                tabIndex={tab === t ? 0 : -1}
                aria-selected={tab === t}
                aria-controls="restaurant-tab-content"
                id={`tab-${t.replaceAll(" ", "-")}`}
                className={`tab ${tab === t ? "active" : ""}`}
                onClick={() => {
                  setTab(t);
                  setNotice("");
                  setError("");
                }}
                onKeyDown={(e) => {
                  const tabs = ["Carta", "Secciones", "Identidad", "Código QR"];
                  const index = tabs.indexOf(t);
                  const next =
                    e.key === "ArrowRight"
                      ? (index + 1) % tabs.length
                      : e.key === "ArrowLeft"
                        ? (index + tabs.length - 1) % tabs.length
                        : e.key === "Home"
                          ? 0
                          : e.key === "End"
                            ? tabs.length - 1
                            : -1;
                  if (next < 0) return;
                  e.preventDefault();
                  setTab(tabs[next]);
                  setNotice("");
                  setError("");
                  document
                    .getElementById(`tab-${tabs[next].replaceAll(" ", "-")}`)
                    ?.focus();
                }}
              >
                {t}
                {t === "Carta" ? ` (${dishes.length})` : ""}
              </button>
            ))}
          </div>
          {notice ? <Notice>{notice}</Notice> : null}
          {error ? <Notice error>{error}</Notice> : null}
          <div
            id="restaurant-tab-content"
            role="tabpanel"
            aria-labelledby={`tab-${tab.replaceAll(" ", "-")}`}
          >
            {tab === "Carta" ? (
              <>
                <div className="menu-toolbar">
                  <label className="field">
                    Buscar platos
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Nombre, descripción o sección"
                    />
                  </label>
                  <label className="field">
                    Sección
                    <select
                      value={r.categories.includes(section) ? section : ""}
                      onChange={(e) => setSection(e.target.value)}
                    >
                      <option value="">Todas las secciones</option>
                      {r.categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Estado
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">Todos los platos</option>
                      <option value="visible">Disponibles</option>
                      <option value="hidden">Ocultos</option>
                      <option value="featured">Destacados</option>
                    </select>
                  </label>
                </div>
                <p className="subtle" aria-live="polite">
                  {visible.length} de {dishes.length} platos · Usa las flechas
                  para ordenar dentro de cada sección.
                </p>
                {visible.length ? (
                  <div className="table-wrap">
                    <table className="dish-table">
                      <thead>
                        <tr>
                          <th>Plato</th>
                          <th>Precio</th>
                          <th>Destacado</th>
                          <th>Disponible</th>
                          <th>
                            <span className="sr-only">Acciones</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((d) => (
                          <tr key={d.id}>
                            <td>
                              <div className="dish-cell">
                                <Photo src={d.image_url} alt="" />
                                <div>
                                  <strong>{d.name}</strong>
                                  <small>{d.category}</small>
                                </div>
                              </div>
                            </td>
                            <td>{priceLabel(d.price, r.currency)}</td>
                            <td>
                              <button
                                className="icon-button"
                                aria-label={`Destacar ${d.name}`}
                                aria-pressed={d.featured}
                                disabled={Boolean(pending)}
                                onClick={() =>
                                  void run(
                                    () =>
                                      app.saveDish({
                                        ...d,
                                        featured: !d.featured,
                                      }),
                                    "Destacado actualizado.",
                                  )
                                }
                              >
                                <Star
                                  size={18}
                                  fill={d.featured ? "currentColor" : "none"}
                                />
                              </button>
                            </td>
                            <td>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={d.available}
                                aria-label={`Disponibilidad de ${d.name}`}
                                className="switch"
                                disabled={Boolean(pending)}
                                onClick={() => void toggle(d)}
                              >
                                <span className="switch-track" />
                                {d.available ? "Visible" : "Oculto"}
                              </button>
                            </td>
                            <td>
                              <div className="actions dish-actions">
                                <button
                                  className="icon-button"
                                  aria-label={`Subir plato ${d.name}`}
                                  disabled={
                                    Boolean(pending) ||
                                    dishes[dishes.indexOf(d) - 1]?.category !==
                                      d.category
                                  }
                                  onClick={() => move(d, -1)}
                                >
                                  <ArrowUp size={16} />
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={`Bajar plato ${d.name}`}
                                  disabled={
                                    Boolean(pending) ||
                                    dishes[dishes.indexOf(d) + 1]?.category !==
                                      d.category
                                  }
                                  onClick={() => move(d, 1)}
                                >
                                  <ArrowDown size={16} />
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={`Duplicar ${d.name}`}
                                  disabled={Boolean(pending)}
                                  onClick={() =>
                                    void run(
                                      () =>
                                        app.saveDish({
                                          ...d,
                                          id: crypto.randomUUID(),
                                          name: `${d.name.slice(0, 92)} (copia)`,
                                          available: false,
                                          sort_order:
                                            Math.max(
                                              -1,
                                              ...dishes.map(
                                                (v) => v.sort_order,
                                              ),
                                            ) + 1,
                                        }),
                                      "Plato duplicado como oculto. Puedes editarlo antes de publicarlo.",
                                    )
                                  }
                                >
                                  <Copy size={16} />
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={`Editar ${d.name}`}
                                  onClick={() => setEditing(d)}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={`Eliminar ${d.name}`}
                                  onClick={() => setDeleting(d)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty">
                    <Box />
                    <h3>
                      {dishes.length
                        ? "No hay platos con estos filtros"
                        : "Tu carta empieza aquí"}
                    </h3>
                    <p>
                      Añade platos con fotografía, descripción, precio y
                      alérgenos.
                    </p>
                    <button
                      className="btn primary"
                      onClick={() => setAdding(true)}
                    >
                      Añadir primer plato
                    </button>
                  </div>
                )}
              </>
            ) : tab === "Secciones" ? (
              <SectionsPanel restaurant={r} />
            ) : tab === "Identidad" ? (
              <div className="form-card">
                <RestaurantForm
                  key={r.id}
                  restaurant={r}
                  onSaved={() =>
                    setNotice("Los cambios de tu restaurante están guardados.")
                  }
                />
              </div>
            ) : (
              <QrPanel restaurant={r} />
            )}
          </div>
          {adding || editing ? (
            <Modal
              title={editing ? "Editar plato" : "Nuevo plato"}
              onClose={() => {
                setAdding(false);
                setEditing(null);
              }}
            >
              <DishForm
                key={editing?.id ?? "new"}
                restaurant={r}
                dish={editing ?? undefined}
                onCancel={() => {
                  setAdding(false);
                  setEditing(null);
                }}
                onSaved={() => {
                  setAdding(false);
                  setEditing(null);
                  setNotice("Plato guardado. La carta ya refleja los cambios.");
                }}
              />
            </Modal>
          ) : null}
          {deleting ? (
            <Modal title="Eliminar plato" onClose={() => setDeleting(null)}>
              <div className="form-body">
                <p>
                  ¿Eliminar <strong>{deleting.name}</strong> de la carta? Esta
                  acción no se puede deshacer.
                </p>
                <div className="form-actions">
                  <button className="btn" onClick={() => setDeleting(null)}>
                    Cancelar
                  </button>
                  <button
                    className="btn danger"
                    disabled={pending === "delete"}
                    onClick={async () => {
                      setPending("delete");
                      try {
                        await app.deleteDish(deleting.id);
                        setDeleting(null);
                        setNotice("Plato eliminado.");
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message
                            : "No se pudo eliminar.",
                        );
                        setDeleting(null);
                      } finally {
                        setPending("");
                      }
                    }}
                  >
                    Eliminar plato
                  </button>
                </div>
              </div>
            </Modal>
          ) : null}
        </>
      )}
    </Workspace>
  );
}
