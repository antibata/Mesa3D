"use client";
import { useState } from "react";
import { Upload } from "lucide-react";
import type { Dish, Restaurant } from "@/lib/types";
import { useApp } from "./provider";
import { Notice, Photo } from "./ui";
import { supabase } from "@/lib/supabase";
const errMessage = (e: unknown) =>
  e instanceof Error
    ? e.name === "ZodError"
      ? "Revisa los campos: nombre, enlaces HTTPS, categorías y precio válido."
      : e.message
    : "No se pudo guardar. Inténtalo otra vez.";
export function RestaurantForm({
  restaurant,
  onSaved,
  onCancel,
}: {
  restaurant?: Restaurant;
  onSaved: (r: Restaurant) => void;
  onCancel?: () => void;
}) {
  const app = useApp();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="form-body"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          const categories = restaurant
            ? restaurant.categories
            : String(fd.get("categories"))
                .split("\n")
                .map((v) => v.trim())
                .filter(Boolean);
          if (
            restaurant &&
            app.dishes.some(
              (d) =>
                d.restaurant_id === restaurant.id &&
                !categories.includes(d.category),
            )
          )
            throw new Error(
              "Mueve primero los platos de las categorías que quieres eliminar.",
            );
          const r: Restaurant = {
            id: restaurant?.id ?? crypto.randomUUID(),
            name: String(fd.get("name")),
            slug: restaurant?.slug ?? String(fd.get("slug")),
            tagline: String(fd.get("tagline")),
            description: String(fd.get("description")),
            address: String(fd.get("address")),
            hours: String(fd.get("hours")),
            accent: String(fd.get("accent")),
            currency: String(fd.get("currency")),
            categories,
            published: fd.has("published"),
          };
          await app.saveRestaurant(r);
          onSaved(r);
        } catch (e) {
          setError(errMessage(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      {error ? <Notice error>{error}</Notice> : null}
      <fieldset disabled={busy}>
        <div className="form-grid">
          <label className="field">
            Nombre del restaurante
            <input
              name="name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={restaurant?.name}
              placeholder="Ej. BRASA"
            />
          </label>
          <label className="field">
            Enlace de la carta
            <input
              name="slug"
              required
              minLength={2}
              maxLength={60}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              defaultValue={restaurant?.slug}
              disabled={Boolean(restaurant)}
              placeholder="ej. brasa"
            />
            <small>
              {restaurant
                ? "Este enlace permanece fijo para conservar tu QR."
                : "Letras minúsculas, números y guiones. Será permanente."}
            </small>
          </label>
        </div>
        <label className="field">
          Tipo de cocina y ubicación
          <input
            name="tagline"
            maxLength={120}
            defaultValue={restaurant?.tagline}
            placeholder="Cocina de autor · Buenos Aires"
          />
        </label>
        <label className="field">
          Descripción
          <textarea
            name="description"
            maxLength={500}
            defaultValue={restaurant?.description}
          />
        </label>
        <div className="form-grid">
          <label className="field">
            Dirección
            <input
              name="address"
              maxLength={200}
              defaultValue={restaurant?.address}
            />
          </label>
          <label className="field">
            Horarios
            <input
              name="hours"
              maxLength={160}
              defaultValue={restaurant?.hours}
            />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            Color de marca
            <input
              name="accent"
              type="color"
              defaultValue={restaurant?.accent ?? "#c84924"}
            />
          </label>
          <label className="field">
            Moneda
            <select
              name="currency"
              defaultValue={restaurant?.currency ?? "ARS"}
            >
              <option value="ARS">Pesos argentinos (ARS)</option>
              <option value="USD">Dólares (USD)</option>
              <option value="EUR">Euros (EUR)</option>
            </select>
          </label>
        </div>
        {!restaurant ? (
          <label className="field">
            Categorías de la carta
            <textarea
              name="categories"
              required
              defaultValue={[
                "Para empezar",
                "Principales",
                "Postres",
                "Bebidas",
              ].join("\n")}
            />
            <small>Una por línea. Se mostrarán en este orden.</small>
          </label>
        ) : (
          <p className="subtle">
            Gestiona los nombres y el orden de las categorías en la pestaña
            Secciones.
          </p>
        )}
        <label className="check-label">
          <input
            type="checkbox"
            name="published"
            defaultChecked={restaurant?.published ?? false}
          />{" "}
          Carta publicada y visible por QR
        </label>
        <div className="form-actions">
          {onCancel ? (
            <button type="button" className="btn" onClick={onCancel}>
              Cancelar
            </button>
          ) : null}
          <button className="btn primary" disabled={busy}>
            {busy
              ? "Guardando…"
              : restaurant
                ? "Guardar cambios"
                : "Crear restaurante"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
export function DishForm({
  dish,
  restaurant,
  onSaved,
  onCancel,
}: {
  dish?: Dish;
  restaurant: Restaurant;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const app = useApp();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false);
  const [image, setImage] = useState(dish?.image_url ?? "");
  async function upload(file: File | undefined) {
    if (!file || !supabase) return;
    setError("");
    setUploading(true);
    try {
      const max = 5;
      if (!file.size)
        throw new Error("El archivo está vacío. Selecciona otro archivo.");
      if (file.size > max * 1024 * 1024)
        throw new Error(`El archivo no debe superar ${max} MB.`);
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!["jpg", "jpeg", "png", "webp"].includes(ext))
        throw new Error("Ese formato de archivo no es válido.");
      const path = `${restaurant.id}/${crypto.randomUUID()}.${ext}`;
      const imageMime =
        ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg";
      const { error } = await supabase.storage
        .from("dish-media")
        .upload(path, file, {
          upsert: false,
          contentType: imageMime,
        });
      if (error)
        throw new Error(
          "No se pudo subir el archivo. Comprueba la conexión y tus permisos.",
        );
      const { data } = supabase.storage.from("dish-media").getPublicUrl(path);
      setImage(data.publicUrl);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setUploading(false);
    }
  }
  return (
    <form
      className="form-body"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          await app.saveDish({
            id: dish?.id ?? crypto.randomUUID(),
            restaurant_id: restaurant.id,
            name: String(fd.get("name")),
            description: String(fd.get("description")),
            price: Number(fd.get("price")),
            category: String(fd.get("category")),
            image_url: image,
            available: fd.has("available"),
            featured: fd.has("featured"),
            allergens: String(fd.get("allergens")),
            sort_order:
              dish?.sort_order ??
              Math.max(
                -1,
                ...app.dishes
                  .filter((v) => v.restaurant_id === restaurant.id)
                  .map((v) => v.sort_order),
              ) + 1,
          });
          onSaved();
        } catch (e) {
          setError(errMessage(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      {error ? <Notice error>{error}</Notice> : null}
      <fieldset disabled={busy || uploading}>
        <label className="field">
          Nombre del plato
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            defaultValue={dish?.name}
          />
        </label>
        <label className="field">
          Descripción
          <textarea
            name="description"
            maxLength={600}
            defaultValue={dish?.description}
          />
        </label>
        <div className="form-grid">
          <label className="field">
            Precio ({restaurant.currency})
            <input
              name="price"
              type="number"
              min="0"
              max="10000000"
              step="0.01"
              required
              defaultValue={dish?.price ?? 0}
            />
          </label>
          <label className="field">
            Categoría
            <select
              name="category"
              defaultValue={dish?.category ?? restaurant.categories[0]}
            >
              {restaurant.categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          Alérgenos declarados
          <input
            name="allergens"
            maxLength={250}
            defaultValue={dish?.allergens}
            placeholder="Ej. Gluten, leche, huevo"
          />
          <small>Confirma esta información con el restaurante.</small>
        </label>
        <label className="field">
          Fotografía · enlace HTTPS
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://…"
          />
        </label>
        {app.demo ? (
          <p className="subtle">
            En la demo puedes usar un enlace HTTPS o una fotografía del
            catálogo. La subida de archivos se habilita al conectar Supabase.
          </p>
        ) : null}
        <label className="field">
          Fotografía del catálogo
          <select
            value={
              [
                "/media/avocado.jpg",
                "/media/burger.jpg",
                "/media/pizza.jpg",
                "/media/dessert.jpg",
              ].includes(image)
                ? image
                : ""
            }
            onChange={(e) => setImage(e.target.value)}
          >
            <option value="">Sin selección</option>
            <option value="/media/avocado.jpg">Palta</option>
            <option value="/media/burger.jpg">Hamburguesa</option>
            <option value="/media/pizza.jpg">Pizza</option>
            <option value="/media/dessert.jpg">Postre</option>
          </select>
        </label>
        {!app.demo ? (
          <label className="field">
            <span>
              <Upload size={14} className="inline" /> O subir fotografía
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(e) => void upload(e.target.files?.[0])}
            />
            <small>JPG, PNG o WebP · máximo 5 MB</small>
          </label>
        ) : null}
        <div className="image-preview">
          <Photo src={image} alt="Vista previa de la fotografía" />
        </div>
        <button type="button" className="btn sm" onClick={() => setImage("")}>
          Quitar fotografía
        </button>
        <label className="check-label">
          <input
            type="checkbox"
            name="available"
            defaultChecked={dish?.available ?? true}
          />{" "}
          Disponible en la carta
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={dish?.featured ?? false}
          />{" "}
          Destacar como plato de la casa
        </label>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn primary" disabled={busy || uploading}>
            {uploading
              ? "Subiendo archivo…"
              : busy
                ? "Guardando…"
                : "Guardar plato"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
