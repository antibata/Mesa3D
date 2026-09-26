"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, UserPlus, Copy, Trash2, ArrowRight } from "lucide-react";
import { Workspace } from "./workspace";
import { useApp } from "./provider";
import { Modal, Notice } from "./ui";
import { QrPanel } from "./qr-panel";
import { supabase } from "@/lib/supabase";
import {
  contactSchema,
  onboardingDataSchema,
  onboardingActionSchema,
  deliveryMessage,
  type OnboardingData,
  type ClientMember,
} from "@/lib/onboarding";
import { menuUrl } from "@/lib/site-url";
const empty: OnboardingData = { client: null, members: [] };
export function ClientOnboarding({ id }: { id: string }) {
  const app = useApp();
  const restaurant = app.restaurants.find((r) => r.id === id);
  const isAdmin = app.access?.kind === "platform";
  const dishes = app.dishes.filter((d) => d.restaurant_id === id);
  const [data, setData] = useState<OnboardingData>(empty),
    [step, setStep] = useState(0),
    [loading, setLoading] = useState(true),
    [failed, setFailed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [activation, setActivation] = useState(""),
    [revoke, setRevoke] = useState<ClientMember | null>(null),
    [delivery, setDelivery] = useState(""),
    [origin, setOrigin] = useState("");
  const storeKey = `mesa-onboarding:${id}`;
  const api = useCallback(
    async (body?: unknown) => {
      const { data: session } = await supabase!.auth.getSession();
      if (!session.session) throw new Error("Vuelve a iniciar sesión.");
      const result = await fetch(`/api/restaurants/${id}/onboarding`, {
        method: body ? "POST" : "GET",
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });
      const json = await result.json();
      if (!result.ok)
        throw new Error(json.error ?? "No se pudo completar la operación.");
      return json;
    },
    [id],
  );
  const load = useCallback(async () => {
    if (app.demo) {
      const stored = localStorage.getItem(storeKey);
      const next = stored ? onboardingDataSchema.parse(JSON.parse(stored)) : empty;
      setData(next);
      return;
    }
    setData(await api());
  }, [app.demo, api, storeKey]);
  useEffect(() => {
    if (!isAdmin || app.loading) return;
    let active = true;
    setLoading(true);
    setFailed(false);
    load()
      .catch((e) => {
        if (active) {
          setError(
            e instanceof Error ? e.message : "No se pudo cargar el cliente.",
          );
          setFailed(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAdmin, app.loading, load]);
  useEffect(() => {
    if (!restaurant) return;
    try {
      const url = menuUrl(
        restaurant.slug,
        window.location.origin,
        process.env.NEXT_PUBLIC_SITE_URL,
      );
      const base = new URL(url).origin;
      setOrigin(base);
      setDelivery(deliveryMessage(restaurant.name, url, `${base}/acceso`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dominio no válido.");
    }
  }, [restaurant]);
  async function mutate(input: unknown, success: string) {
    const parsed = onboardingActionSchema.safeParse(input);
    if (!parsed.success) { setError("Revisa los datos del contacto y el correo electrónico."); return false; }
    const body = parsed.data;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (app.demo) {
        const next: OnboardingData = structuredClone(data);
        if (body.action === "contact") {
          const { action: _, ...contact } = body;
          next.client = {
            ...contact,
            delivered_at: next.client?.delivered_at ?? null,
          };
        }
        if (
          body.action === "assign" &&
          !next.members.some((m) => m.email === body.email)
        )
          next.members.push({
            user_id: crypto.randomUUID(),
            email: body.email,
            confirmed: false,
          });
        if (body.action === "revoke")
          next.members = next.members.filter((m) => m.user_id !== body.user_id);
        if (body.action === "delivered" && next.client)
          next.client.delivered_at = new Date().toISOString();
        localStorage.setItem(storeKey, JSON.stringify(next));
        setData(next);
      } else {
        const result = await api(body);
        if (body.action === "assign") setActivation(result.activationUrl ?? "");
        await load();
      }
      setNotice(success);
      setRevoke(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Copiado al portapapeles.");
    } catch {
      setError("No se pudo copiar. Selecciona el texto y cópialo manualmente.");
    }
  }
  const complete = [
    Boolean(data.client),
    data.members.length > 0,
    dishes.some((d) => d.available),
    Boolean(data.client?.delivered_at),
  ];
  const publicOrigin = Boolean(
    origin &&
    new URL(origin).protocol === "https:" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname),
  );
  const canDeliver = Boolean(
    data.client &&
    data.members.length &&
    restaurant?.published &&
    dishes.some((d) => d.available) &&
    (app.demo || publicOrigin),
  );
  return (
    <Workspace title="Alta y entrega">
      {!isAdmin || !restaurant ? (
        <div className="empty">
          <h1>Acceso reservado a la administración general</h1>
          <Link className="btn" href="/panel">
            Volver
          </Link>
        </div>
      ) : (
        <>
          <Link className="back-link" href="/panel">
            Volver a clientes
          </Link>
          <div className="workspace-heading">
            <div>
              <span className="eyebrow dark">ALTA Y ENTREGA</span>
              <h1>{restaurant.name}</h1>
              <p>
                Prepara la carta y deja a tu cliente listo para administrarla.
              </p>
            </div>
            <Link className="btn" href={`/panel/restaurantes/${id}`}>
              Administrar carta
            </Link>
          </div>
          <nav className="onboarding-steps" aria-label="Pasos del alta">
            {["Cliente", "Acceso", "Carta", "Entrega"].map((label, i) => (
              <button
                key={label}
                aria-label={label}
                disabled={busy}
                className={
                  step === i ? "onboarding-step active" : "onboarding-step"
                }
                aria-current={step === i ? "step" : undefined}
                onClick={() => {
                  setStep(i);
                  setNotice("");
                  setError("");
                }}
              >
                <span>{complete[i] ? <Check size={17} /> : i + 1}</span>
                {label}
              </button>
            ))}
          </nav>
          {app.demo ? (
            <Notice>
              Recorrido de demostración: los contactos y accesos son simulados,
              no se crean cuentas ni se envían mensajes.
            </Notice>
          ) : null}
          {error ? <Notice error>{error}</Notice> : null}
          {notice ? <Notice>{notice}</Notice> : null}
          {loading ? (
            <p role="status">Cargando alta…</p>
          ) : failed ? (
            <div className="empty">
              <p>
                No se pudieron cargar los datos. Recarga para volver a
                intentarlo.
              </p>
              <button className="btn" onClick={() => window.location.reload()}>
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {step === 0 ? (
                <div className="form-card">
                  <form
                    className="form-body"
                    key={data.client?.email ?? "contact"}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const parsed = contactSchema.safeParse(
                        Object.fromEntries(fd),
                      );
                      if (!parsed.success) {
                        setError(parsed.error.issues[0].message);
                        return;
                      }
                      if (
                        await mutate(
                          { action: "contact", ...parsed.data },
                          "Contacto guardado.",
                        )
                      )
                        setStep(1);
                    }}
                  >
                    <h2>Datos de tu cliente</h2>
                    <p className="subtle">
                      Estos datos son privados. No aparecen en la carta pública.
                    </p>
                    <fieldset disabled={busy}>
                      <label className="field">
                        Nombre del contacto
                        <input
                          name="contact_name"
                          minLength={2}
                          maxLength={100}
                          required
                          defaultValue={data.client?.contact_name}
                        />
                      </label>
                      <label className="field">
                        Correo del encargado
                        <input
                          name="email"
                          type="email"
                          maxLength={254}
                          required
                          defaultValue={data.client?.email}
                        />
                      </label>
                      <label className="field">
                        Teléfono de contacto
                        <input
                          name="phone"
                          type="tel"
                          maxLength={40}
                          defaultValue={data.client?.phone}
                        />
                      </label>
                      <div className="form-actions">
                        <button className="btn primary">
                          Guardar y continuar <ArrowRight size={16} />
                        </button>
                      </div>
                    </fieldset>
                  </form>
                </div>
              ) : null}
              {step === 1 ? (
                <div className="onboarding-card">
                  <h2>Acceso del encargado</h2>
                  <p>
                    Asigna el correo que usará para administrar este
                    restaurante. Una cuenta existente conserva su contraseña.
                  </p>
                  <form
                    className="access-assignment"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const email = String(
                        new FormData(e.currentTarget).get("email"),
                      ).trim();
                      setActivation("");
                      await mutate(
                        { action: "assign", email },
                        app.demo
                          ? "Acceso simulado registrado. No se creó una cuenta real."
                          : "Acceso asignado. Si se generó una activación, compártela de forma privada.",
                      );
                    }}
                  >
                    <label className="field">
                      Correo para asignar acceso
                      <input
                        name="email"
                        type="email"
                        maxLength={254}
                        required
                        defaultValue={data.client?.email}
                        disabled={busy}
                      />
                    </label>
                    <button className="btn primary" disabled={busy}>
                      <UserPlus size={16} />{" "}
                      {busy ? "Asignando…" : "Asignar acceso"}
                    </button>
                  </form>
                  {activation ? (
                    <div className="activation-box">
                      <h3>Enlace personal de activación</h3>
                      <p>
                        El encargado elige su contraseña al abrirlo. Es de un
                        solo uso y vence según la configuración de Supabase. No
                        lo incluyas en el QR público.
                      </p>
                      <label className="field">
                        Enlace de activación
                        <input readOnly value={activation} />
                      </label>
                      <button
                        className="btn"
                        onClick={() => void copy(activation)}
                      >
                        <Copy size={16} /> Copiar activación
                      </button>
                      <p className="subtle">
                        No se envió ningún correo. Este enlace solo se muestra
                        durante esta sesión.
                      </p>
                    </div>
                  ) : null}
                  <div className="member-list">
                    {data.members.length ? (
                      data.members.map((m) => (
                        <div className="member-row" key={m.user_id}>
                          <div>
                            <strong>{m.email}</strong>
                            <small>
                              {app.demo
                                ? "Simulado"
                                : m.confirmed
                                  ? "Cuenta activada"
                                  : "Pendiente de activación"}
                            </small>
                          </div>
                          <button
                            className="icon-button"
                            disabled={busy}
                            aria-label={`Revocar acceso de ${m.email}`}
                            onClick={() => setRevoke(m)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="subtle">
                        Todavía no hay encargados asignados.
                      </p>
                    )}
                  </div>
                  <div className="form-actions">
                    <button
                      className="btn"
                      disabled={busy}
                      onClick={() => setStep(2)}
                    >
                      Continuar a la carta <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ) : null}
              {step === 2 ? (
                <div className="onboarding-card">
                  <h2>Prepara y revisa la carta</h2>
                  <div className="readiness-list">
                    <p>
                      <Check size={17} /> {restaurant.categories.length}{" "}
                      secciones creadas
                    </p>
                    <p>
                      {dishes.length} platos cargados ·{" "}
                      {dishes.filter((d) => d.available).length} disponibles
                    </p>
                    <p>
                      {dishes.filter((d) => !d.image_url).length} platos sin
                      foto · {dishes.filter((d) => !d.description).length} sin
                      descripción
                    </p>
                    <p>
                      Estado:{" "}
                      <strong>
                        {restaurant.published ? "Publicada" : "Borrador"}
                      </strong>
                    </p>
                  </div>
                  <p>
                    Revisa con tu cliente los nombres, precios, fotos y
                    alérgenos antes de publicar.
                  </p>
                  <div className="actions">
                    <Link
                      className="btn primary"
                      href={`/panel/restaurantes/${id}`}
                    >
                      Cargar platos y secciones
                    </Link>
                    <Link
                      className="btn"
                      href={`/panel/restaurantes/${id}/vista-previa`}
                    >
                      Vista previa privada
                    </Link>
                    <button
                      className="btn"
                      disabled={busy || !dishes.some((d) => d.available)}
                      onClick={async () => {
                        setBusy(true);
                        setError("");
                        try {
                          await app.saveRestaurant({
                            ...restaurant,
                            published: !restaurant.published,
                          });
                          setNotice(
                            restaurant.published
                              ? "Carta en borrador."
                              : "Carta publicada.",
                          );
                        } catch (e) {
                          setError(
                            e instanceof Error
                              ? e.message
                              : "No se pudo publicar.",
                          );
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {restaurant.published
                        ? "Pasar a borrador"
                        : "Publicar carta"}
                    </button>
                  </div>
                  <div className="form-actions">
                    <button className="btn" onClick={() => setStep(3)}>
                      Preparar entrega <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ) : null}
              {step === 3 ? (
                <>
                  <QrPanel restaurant={restaurant} />
                  <div className="onboarding-card">
                    <h2>Entrega al cliente</h2>
                    <p>
                      Descarga el QR y el cartel. Copia el siguiente mensaje y
                      adjunta los archivos por el canal que acuerdes con el
                      cliente.
                    </p>
                    <label className="field">
                      Mensaje de entrega
                      <textarea rows={10} readOnly value={delivery} />
                    </label>
                    <div className="actions">
                      <button
                        className="btn"
                        disabled={!delivery}
                        onClick={() => void copy(delivery)}
                      >
                        Copiar mensaje de entrega
                      </button>
                      <button
                        className="btn primary"
                        disabled={
                          busy ||
                          !canDeliver ||
                          Boolean(data.client?.delivered_at)
                        }
                        onClick={() =>
                          void mutate(
                            { action: "delivered" },
                            app.demo
                              ? "Entrega simulada registrada."
                              : "Entrega registrada.",
                          )
                        }
                      >
                        {data.client?.delivered_at
                          ? "Entrega registrada"
                          : app.demo
                            ? "Registrar entrega de prueba"
                            : "Marcar como entregada"}
                      </button>
                    </div>
                    {data.client?.delivered_at ? (
                      <p className="subtle">
                        Registrada el{" "}
                        {new Date(data.client.delivered_at).toLocaleDateString(
                          "es-AR",
                        )}
                        . Este estado registra tu confirmación; no envía
                        mensajes.
                      </p>
                    ) : (
                      <p className="subtle">
                        Para entregar: contacto guardado, acceso asignado,
                        platos disponibles, carta publicada y dominio público
                        configurado.
                      </p>
                    )}
                  </div>
                </>
              ) : null}
            </>
          )}
          {revoke ? (
            <Modal
              title="Revocar acceso"
              onClose={() => {
                if (!busy) setRevoke(null);
              }}
            >
              <div className="form-body">
                <p>
                  ¿Quitar a <strong>{revoke.email}</strong> el acceso a este
                  restaurante? Su cuenta y los accesos a otros restaurantes se
                  conservan. Un administrador general mantiene sus permisos
                  globales.
                </p>
                <div className="form-actions">
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={() => setRevoke(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn danger"
                    disabled={busy}
                    onClick={() =>
                      void mutate(
                        { action: "revoke", user_id: revoke.user_id },
                        "Acceso revocado.",
                      )
                    }
                  >
                    Revocar acceso
                  </button>
                </div>
              </div>
            </Modal>
          ) : null}
        </>
      )}
    </Workspace>
  );
}
