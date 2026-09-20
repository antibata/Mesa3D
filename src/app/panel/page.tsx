"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Store,
  Utensils,
  Box,
  Plus,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";
import { Workspace } from "@/components/workspace";
import { useApp } from "@/components/provider";
import { Modal, Notice } from "@/components/ui";
import { RestaurantForm } from "@/components/editors";
export default function Dashboard() {
  const app = useApp();
  const [creating, setCreating] = useState(false),
    [reset, setReset] = useState(false),
    [notice, setNotice] = useState("");
  const restaurants = app.restaurants.filter(
    (r) =>
      app.access?.kind === "platform" ||
      app.access?.restaurantIds.includes(r.id),
  );
  const dishes = app.dishes.filter((d) =>
    restaurants.some((r) => r.id === d.restaurant_id),
  );
  return (
    <Workspace>
      <div className="workspace-heading">
        <div>
          <h1>
            {app.access?.kind === "platform"
              ? "Tus restaurantes"
              : "Mi restaurante"}
          </h1>
          <p>Cartas listas para abrir el apetito.</p>
        </div>
        {app.access?.kind === "platform" ? (
          <button className="btn primary" onClick={() => setCreating(true)}>
            <Plus size={18} /> Nuevo restaurante
          </button>
        ) : null}
      </div>
      {notice ? <Notice>{notice}</Notice> : null}
      <div className="stats">
        <div className="stat">
          <span className="stat-label">
            Restaurantes <Store size={18} />
          </span>
          <strong>{restaurants.length}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">
            Platos en carta <Utensils size={18} />
          </span>
          <strong>{dishes.filter((d) => d.available).length}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">
            Modelos 3D <Box size={18} />
          </span>
          <strong>{dishes.filter((d) => d.model_url).length}</strong>
        </div>
      </div>
      <div className="section-label">
        <h2>Todo en un solo lugar</h2>
        <span>
          {restaurants.filter((r) => r.published).length} cartas publicadas
        </span>
      </div>
      {restaurants.length ? (
        <div className="restaurant-grid">
          {restaurants.map((r) => (
            <article className="restaurant-card" key={r.id}>
              <div
                className="restaurant-cover"
                style={{
                  background: r.accent === "#35694c" ? "#314f3b" : "#283024",
                }}
              >
                <div>
                  <span className="restaurant-cover-name">{r.name}</span>
                  <span className="status">
                    {r.published ? "Publicada" : "Borrador"}
                  </span>
                </div>
                <p>{r.tagline}</p>
              </div>
              <div className="restaurant-card-body">
                <p>
                  {app.dishes.filter((d) => d.restaurant_id === r.id).length}{" "}
                  platos <span aria-hidden="true">·</span>{" "}
                  {
                    app.dishes.filter(
                      (d) => d.restaurant_id === r.id && d.model_url,
                    ).length
                  }{" "}
                  modelos 3D
                </p>
                <div className="restaurant-card-actions">
                  <Link
                    href={`/panel/restaurantes/${r.id}`}
                    className="btn dark"
                  >
                    Administrar carta
                  </Link>
                  {r.published ? (
                    <Link href={`/r/${r.slug}`} className="btn ghost">
                      Ver carta <ArrowUpRight size={16} />
                    </Link>
                  ) : (
                    <span className="subtle">Pendiente de publicar</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <Store />
          <h3>
            {app.access?.kind === "platform"
              ? "Crea tu primer restaurante"
              : "Todavía no tienes un restaurante asignado"}
          </h3>
          <p>
            {app.access?.kind === "platform"
              ? "Su carta y su enlace estarán en este espacio."
              : "Contacta con el administrador para activar tu acceso."}
          </p>
        </div>
      )}
      {app.demo ? (
        <div className="section-label">
          <span>
            Puedes recuperar los platos de ejemplo cuando lo necesites.
          </span>
          <button className="btn sm ghost" onClick={() => setReset(true)}>
            <RotateCcw size={14} /> Restablecer demo
          </button>
        </div>
      ) : null}
      {creating ? (
        <Modal title="Nuevo restaurante" onClose={() => setCreating(false)}>
          <RestaurantForm
            onCancel={() => setCreating(false)}
            onSaved={(r) => {
              setCreating(false);
              setNotice(`${r.name} fue creado. Ya puedes cargar su carta.`);
            }}
          />
        </Modal>
      ) : null}
      {reset ? (
        <Modal title="Restablecer demostración" onClose={() => setReset(false)}>
          <div className="form-body">
            <p>
              Se eliminarán los cambios locales y se recuperarán los
              restaurantes y platos de ejemplo.
            </p>
            <div className="form-actions">
              <button className="btn" onClick={() => setReset(false)}>
                Cancelar
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  app.resetDemo();
                  setReset(false);
                  setNotice("Demostración restablecida.");
                }}
              >
                Restablecer demo
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </Workspace>
  );
}
