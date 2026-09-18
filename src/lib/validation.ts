import { z } from 'zod';
const asset = z.string().refine(v => !v || v.startsWith('/media/') || v.startsWith('/models/') || /^https:\/\//i.test(v), 'Usa un enlace HTTPS o un archivo del catálogo.');
export const restaurantSchema = z.object({
  id: z.uuid(), name: z.string().trim().min(2).max(80),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa letras minúsculas, números y guiones.').min(2).max(60),
  tagline: z.string().max(120), description: z.string().max(500), address: z.string().max(200), hours: z.string().max(160),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/), currency: z.enum(['ARS', 'USD', 'EUR']),
  categories: z.array(z.string().trim().min(1).max(60)).min(1).max(20).refine(v => new Set(v).size === v.length, 'Las categorías no deben repetirse.'), published: z.boolean()
});
export const dishSchema = z.object({
  id: z.uuid(), restaurant_id: z.uuid(), name: z.string().trim().min(2).max(100), description: z.string().max(600),
  price: z.number().finite().min(0).max(10000000), category: z.string().min(1).max(60), image_url: asset, model_url: asset, usdz_url: asset,
  available: z.boolean(), featured: z.boolean(), demo_model: z.boolean(), allergens: z.string().max(250), sort_order: z.number().int().min(0)
});
export function priceLabel(price: number, currency: string) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price); }
