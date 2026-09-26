export function validateSecurityConfig(env: {
  url?: string;
  key?: string;
  demo?: string;
  deployment?: string;
  site?: string;
}) {
  if (Boolean(env.url) !== Boolean(env.key))
    throw new Error("Configura juntas la URL y la clave pública de Supabase.");
  const demo = env.demo === "true";
  if (demo && env.url)
    throw new Error("No se puede combinar la demo con una base de datos real.");
  if (!env.url && !demo)
    throw new Error(
      "Falta Supabase. Por seguridad la demo no se activa automáticamente. Para pruebas locales configura NEXT_PUBLIC_DEMO_MODE=true.",
    );
  if (demo && env.deployment === "production")
    throw new Error(
      "La demo sin contraseña está prohibida en producción. Configura Supabase y desactiva NEXT_PUBLIC_DEMO_MODE.",
    );
  if (env.key?.startsWith("sb_secret_"))
    throw new Error("La clave secreta no puede usarse como clave pública.");
  if (env.key?.split(".").length === 3) {
    // Reject legacy privileged JWT keys before bundling them into the browser.
    try {
      const payload = JSON.parse(
        atob(env.key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      if (payload.role === "service_role")
        throw new Error(
          "La clave service_role no puede publicarse en el navegador.",
        );
    } catch (error) {
      if (error instanceof Error && error.message.includes("service_role"))
        throw error;
    }
  }
  if (env.url) {
    const url = new URL(env.url);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      url.username ||
      url.password ||
      (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    )
      throw new Error("La conexión a Supabase debe usar HTTPS.");
  }
  return demo;
}
