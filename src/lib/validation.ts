import { z } from "zod";
export function isAssetUrl(value: string, kind: "image" | "model" = "image") {
  if (!value) return true;
  try {
    const url = new URL(value, "https://mesa3d.invalid");
    if (value.startsWith("/"))
      return (
        !value.startsWith("//") &&
        !value.includes("\\") &&
        url.origin === "https://mesa3d.invalid" &&
        url.pathname.startsWith(kind === "image" ? "/media/" : "/models/")
      );
    return (
      url.protocol === "https:" &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password &&
      /^https:\/\//i.test(value)
    );
  } catch {
    return false;
  }
}
const asset = (kind: "image" | "model") =>
  z
    .string()
    .trim()
    .max(2048)
    .refine(
      (v) => isAssetUrl(v, kind),
      "Usa un enlace HTTPS válido o un archivo del catálogo.",
    );
export const restaurantSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Usa letras minúsculas, números y guiones.",
    )
    .min(2)
    .max(60),
  tagline: z.string().max(120),
  description: z.string().max(500),
  address: z.string().max(200),
  hours: z.string().max(160),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  currency: z.enum(["ARS", "USD", "EUR"]),
  categories: z
    .array(z.string().trim().min(1).max(60))
    .min(1)
    .max(20)
    .refine(
      (v) => new Set(v.map((c) => c.toLocaleLowerCase("es"))).size === v.length,
      "Las categorías no deben repetirse.",
    ),
  published: z.boolean(),
});
export const dishSchema = z.object({
  id: z.uuid(),
  restaurant_id: z.uuid(),
  name: z.string().trim().min(2).max(100),
  description: z.string().max(600),
  price: z
    .number()
    .finite()
    .min(0)
    .max(10000000)
    .refine(
      (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.000001,
      "El precio admite como máximo dos decimales.",
    ),
  category: z.string().trim().min(1).max(60),
  image_url: asset("image"),
  model_url: asset("model"),
  usdz_url: asset("model"),
  available: z.boolean(),
  featured: z.boolean(),
  demo_model: z.boolean(),
  allergens: z.string().max(250),
  sort_order: z.number().int().min(0),
});
export function priceLabel(price: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);
}
