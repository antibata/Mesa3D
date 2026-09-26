import type { NextConfig } from "next";
import { validateSecurityConfig } from "./src/lib/security-config.ts";
validateSecurityConfig({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  demo: process.env.NEXT_PUBLIC_DEMO_MODE,
  deployment: process.env.VERCEL_ENV || process.env.MESA_DEPLOYMENT_ENV,
});
const config: NextConfig = {
  distDir: process.env.MESA_BUILD_DIR || ".next",
  poweredByHeader: false,
  allowedDevOrigins: ["terminal.local"],
  async headers() {
    const sbOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
      : "";
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' https: data: blob:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
      `connect-src 'self' ${sbOrigin}${process.env.NODE_ENV === "development" ? " ws: wss:" : ""}`,
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      ...[
        "/panel/:path*",
        "/acceso",
        "/activar",
        "/recuperar",
        "/api/:path*",
      ].map((source) => ({
        source,
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      })),
    ];
  },
};
export default config;
