"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, ExternalLink, LogOut, Info } from "lucide-react";
import { useApp } from "./provider";
import { Brand, Notice } from "./ui";
export function Workspace({
  children,
  title = "Restaurantes",
}: {
  children: ReactNode;
  title?: string;
}) {
  const app = useApp(),
    router = useRouter();
  const [logoutError, setLogoutError] = useState(""),
    [leaving, setLeaving] = useState(false);
  async function logout() {
    setLeaving(true);
    setLogoutError("");
    try {
      await app.logout();
      router.push("/acceso");
    } catch (e) {
      setLogoutError(
        e instanceof Error ? e.message : "No se pudo cerrar sesión.",
      );
    } finally {
      setLeaving(false);
    }
  }
  useEffect(() => {
    if (!app.loading && !app.access && !app.error) router.replace("/acceso");
  }, [app.loading, app.access, app.error, router]);
  if (!app.loading && !app.access && app.error)
    return (
      <div className="page-loading">
        <Brand />
        <Notice error>{app.error}</Notice>
        <button className="btn" onClick={() => void app.reload()}>
          Reintentar
        </button>
        <Link className="btn" href="/acceso">
          Volver al acceso
        </Link>
      </div>
    );
  if (app.loading || !app.access)
    return (
      <div className="page-loading">
        <Brand />
        <p>Preparando tu espacio…</p>
      </div>
    );
  const restaurant = app.restaurants.find(
    (r) =>
      app.access?.kind === "platform" ||
      app.access?.restaurantIds.includes(r.id),
  );
  if (app.access.kind === "restaurant" && !app.access.restaurantIds.length)
    return <div className="page-loading"><Brand/><h1>Cuenta sin acceso asignado</h1><p>Contacta al administrador para que te asigne un restaurante.</p><button className="btn" disabled={leaving} onClick={()=>void logout()}>Salir</button>{logoutError?<Notice error>{logoutError}</Notice>:null}</div>;
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Brand dark />
        <span className="sidebar-label">TU ESPACIO</span>
        <Link
          href="/panel"
          className="side-link active"
          title="Restaurantes"
          aria-label="Mis restaurantes"
        >
          <Store size={19} />{" "}
          {app.access.kind === "platform" ? "Restaurantes" : "Mi restaurante"}
        </Link>
        {restaurant?.published ? (
          <Link
            href={`/r/${restaurant.slug}`}
            className="side-link"
            title="Ver carta"
            aria-label="Ver carta pública"
          >
            <ExternalLink size={19} /> Ver carta
          </Link>
        ) : null}
        <div className="side-footer">
          <strong>
            {app.access.kind === "platform"
              ? "Administración general"
              : "Administración del restaurante"}
          </strong>
          <span>{app.access.email}</span>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-top">
          <span>
            Tu espacio <span aria-hidden="true">/</span> <b>{title}</b>
          </span>
          <div className="actions">
            {app.demo ? (
              <Link className="btn sm ghost" href="/acceso">
                Cambiar acceso
              </Link>
            ) : null}
            <button
              className="btn sm ghost"
              disabled={leaving}
              onClick={() => void logout()}
            >
              <LogOut size={16} />
              {leaving ? "Saliendo…" : "Salir"}
            </button>
          </div>
        </header>
        <div className="workspace-content">
          {app.demo ? (
            <div className="demo-notice">
              <Info size={16} />
              <span>
                <strong>Modo demostración.</strong> Los cambios se guardan
                únicamente en este navegador; no se comparten con otros
                dispositivos.
              </span>
            </div>
          ) : null}
          {logoutError ? <Notice error>{logoutError}</Notice> : null}
          {app.error ? (
            <Notice error>
              {app.error}
              <button className="btn sm" onClick={() => void app.reload()}>
                Reintentar
              </button>
            </Notice>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
