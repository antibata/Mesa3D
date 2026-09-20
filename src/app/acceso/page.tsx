"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Store, PanelsTopLeft } from "lucide-react";
import { Brand, Notice } from "@/components/ui";
import { useApp } from "@/components/provider";
export default function AccessPage() {
  const app = useApp(),
    router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  function demo(kind: "platform" | "restaurant") {
    try {
      app.enterDemo(kind);
      router.push("/panel");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo abrir la demo.");
    }
  }
  return (
    <main className="access-page">
      <section className="access-story">
        <Brand dark />
        <div className="access-story-content">
          <span className="eyebrow">TU CARTA, CON OTRA DIMENSIÓN</span>
          <h1>
            El próximo plato
            <br />
            empieza con
            <br />
            <em>una buena vista.</em>
          </h1>
          <p>
            Todos tus restaurantes, sus cartas y sus platos en un mismo lugar.
          </p>
        </div>
        <small>Mesa3D · Plataforma para restaurantes</small>
      </section>
      <section className="access-form">
        <div className="access-box">
          <div className="mobile-brand">
            <Brand />
          </div>
          <h2>{app.demo ? "Explora la plataforma" : "Bienvenido de nuevo"}</h2>
          <p>
            {app.demo
              ? "Elige un acceso para recorrer la demostración."
              : "Ingresa a tu cuenta para administrar tu carta."}
          </p>
          {error ? <Notice error>{error}</Notice> : null}
          {app.demo ? (
            <>
              <button
                className="access-option"
                onClick={() => demo("platform")}
              >
                <PanelsTopLeft size={23} />
                <span>
                  <strong>Panel general</strong>
                  <small>Administra todos los restaurantes.</small>
                </span>
                <ChevronRight size={18} />
              </button>
              <button
                className="access-option"
                onClick={() => demo("restaurant")}
              >
                <Store size={23} />
                <span>
                  <strong>Panel del restaurante</strong>
                  <small>Gestiona la carta de BRASA.</small>
                </span>
                <ChevronRight size={18} />
              </button>
              <div className="demo-notice">
                Demo local: los cambios se guardan solo en este navegador. Estos
                accesos no son cuentas reales.
              </div>
            </>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                setBusy(true);
                setError("");
                try {
                  await app.login(
                    String(fd.get("email")),
                    String(fd.get("password")),
                  );
                  router.push("/panel");
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "No se pudo iniciar sesión.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label className="field">
                Correo electrónico
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="tu@restaurante.com"
                />
              </label>
              <label className="field">
                Contraseña
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              <button className="btn primary" disabled={busy}>
                {busy ? "Ingresando…" : "Ingresar"}
              </button>
              <p className="subtle">
                Si necesitas acceso o recuperar tu cuenta, contacta con el
                administrador de la plataforma.
              </p>
            </form>
          )}
          <Link className="back-link" href={app.demo ? "/r/brasa" : "/"}>
            <ArrowLeft size={15} />
            {app.demo ? "Volver a la carta de ejemplo" : "Volver al inicio"}
          </Link>
        </div>
      </section>
    </main>
  );
}
