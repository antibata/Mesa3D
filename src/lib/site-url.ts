/** QR codes must point to the permanent public origin, never an arbitrary path. */
export function menuUrl(
  slug: string,
  fallbackOrigin: string,
  configuredOrigin?: string,
) {
  const origin = (configuredOrigin?.trim() || fallbackOrigin).replace(
    /\/$/,
    "",
  );
  const parsed = new URL(origin);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if (
    parsed.username ||
    parsed.password ||
    (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:"))
  ) {
    throw new Error(
      "El dominio del QR debe ser una URL HTTPS válida. Revisa NEXT_PUBLIC_SITE_URL.",
    );
  }
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error(
      "Configura NEXT_PUBLIC_SITE_URL solo con el dominio, sin rutas, parámetros ni /r/brasa.",
    );
  }
  return `${parsed.origin}/r/${encodeURIComponent(slug)}`;
}
