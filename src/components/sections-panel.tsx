"use client";
import { useState } from "react";
import { ArrowUp, ArrowDown, Pencil, Plus, Trash2 } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { useApp } from "./provider";
import { Modal, Notice } from "./ui";
export function SectionsPanel({ restaurant: r }: { restaurant: Restaurant }) {
  const app = useApp();
  const [edit, setEdit] = useState<{
    original: string;
    value: string;
    previous: string[];
  } | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function save(
    names: string[],
    previous = r.categories,
    rename?: { from: string; to: string },
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await app.saveSections(r.id, names, previous, rename);
      setEdit(null);
      setRemoving(null);
      setNotice(
        "Secciones guardadas. La carta ya refleja el nuevo orden y los nombres.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="sections-panel">
      <div className="section-label">
        <div>
          <h2>Secciones del menú</h2>
          <p className="subtle">
            Organiza tu carta. Los platos se conservan al cambiar el nombre.
          </p>
        </div>
        <button
          className="btn primary"
          disabled={busy || r.categories.length >= 20}
          onClick={() => {
            setError("");
            setEdit({ original: "", value: "", previous: r.categories });
          }}
        >
          <Plus size={16} /> Añadir sección
        </button>
      </div>
      {notice ? <Notice>{notice}</Notice> : null}
      {error && !edit && !removing ? <Notice error>{error}</Notice> : null}
      <div className="section-list">
        {r.categories.map((c, i) => {
          const count = app.dishes.filter(
            (d) => d.restaurant_id === r.id && d.category === c,
          ).length;
          return (
            <div className="section-row" key={c}>
              <span className="section-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="section-name">
                <strong>{c}</strong>
                <small>{count} platos</small>
              </div>
              <div className="actions">
                <button
                  className="icon-button"
                  aria-label={`Subir sección ${c}`}
                  disabled={busy || i === 0}
                  onClick={() => {
                    const names = [...r.categories];
                    [names[i - 1], names[i]] = [names[i], names[i - 1]];
                    void save(names);
                  }}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Bajar sección ${c}`}
                  disabled={busy || i === r.categories.length - 1}
                  onClick={() => {
                    const names = [...r.categories];
                    [names[i + 1], names[i]] = [names[i], names[i + 1]];
                    void save(names);
                  }}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Renombrar sección ${c}`}
                  disabled={busy}
                  onClick={() => {
                    setError("");
                    setEdit({ original: c, value: c, previous: r.categories });
                  }}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Eliminar sección ${c}`}
                  disabled={busy || r.categories.length === 1}
                  onClick={() => {
                    setError("");
                    setRemoving(c);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="subtle">
        {r.categories.length} de 20 secciones. Para eliminar una sección con
        platos, edita esos platos y asígnales otra sección.
      </p>
      {edit ? (
        <Modal
          title={edit.original ? "Renombrar sección" : "Nueva sección"}
          onClose={() => {
            if (!busy) setEdit(null);
          }}
        >
          <form
            className="form-body"
            onSubmit={(e) => {
              e.preventDefault();
              const value = edit.value.trim();
              void save(
                edit.original
                  ? edit.previous.map((c) => (c === edit.original ? value : c))
                  : [...edit.previous, value],
                edit.previous,
                edit.original ? { from: edit.original, to: value } : undefined,
              );
            }}
          >
            {error ? <Notice error>{error}</Notice> : null}
            <label className="field">
              Nombre de la sección
              <input
                autoFocus
                required
                maxLength={60}
                value={edit.value}
                disabled={busy}
                onChange={(e) => setEdit({ ...edit, value: e.target.value })}
              />
            </label>
            <div className="form-actions">
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => setEdit(null)}
              >
                Cancelar
              </button>
              <button className="btn primary" disabled={busy}>
                {busy ? "Guardando…" : "Guardar sección"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
      {removing ? (
        <Modal
          title="Eliminar sección"
          onClose={() => {
            if (!busy) setRemoving(null);
          }}
        >
          <div className="form-body">
            {error ? <Notice error>{error}</Notice> : null}
            <p>
              ¿Eliminar la sección <strong>{removing}</strong>? Solo se
              eliminará si no contiene platos.
            </p>
            <div className="form-actions">
              <button
                className="btn"
                disabled={busy}
                onClick={() => setRemoving(null)}
              >
                Cancelar
              </button>
              <button
                className="btn danger"
                disabled={busy}
                onClick={() =>
                  void save(r.categories.filter((c) => c !== removing))
                }
              >
                Eliminar sección
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
