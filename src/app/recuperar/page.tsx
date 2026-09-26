"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { menuUrl } from "@/lib/site-url";
import { Brand, Notice } from "@/components/ui";
export default function RecoverAccount() {
  const [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  return (
    <main className="account-page">
      <Brand />
      <h1>Recuperar contraseña</h1>
      <p>Te enviaremos un enlace para elegir una nueva contraseña.</p>
      {!supabase ? (
        <Notice>
          La recuperación de cuentas se habilita al conectar Supabase.
        </Notice>
      ) : null}
      {error ? <Notice error>{error}</Notice> : null}
      {sent ? (
        <Notice>
          Si existe una cuenta con ese correo, recibirás un enlace. Revisa
          también la carpeta de spam.
        </Notice>
      ) : null}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!supabase) return;
          const email = String(new FormData(e.currentTarget).get("email"));
          setBusy(true);
          setError("");
          try {
            const origin = new URL(
              menuUrl(
                "",
                window.location.origin,
                process.env.NEXT_PUBLIC_SITE_URL,
              ),
            ).origin;
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${origin}/activar`,
            });
            if (error)
              throw new Error(
                "No se pudo solicitar el enlace. Espera unos minutos y vuelve a intentarlo.",
              );
            setSent(true);
          } catch (e) {
            setError(
              e instanceof Error
                ? e.message
                : "No se pudo solicitar el enlace.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="field">
          Correo electrónico
          <input
            type="email"
            name="email"
            autoComplete="email"
            maxLength={254}
            required
            disabled={busy || !supabase}
          />
        </label>
        <button className="btn primary" disabled={busy || sent || !supabase}>
          {busy ? "Solicitando…" : "Enviar enlace de recuperación"}
        </button>
      </form>
      <Link className="back-link" href="/acceso">
        Volver al acceso
      </Link>
    </main>
  );
}
