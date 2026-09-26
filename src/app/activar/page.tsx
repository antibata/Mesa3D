"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Brand, Notice } from "@/components/ui";
export default function ActivateAccount() {
  const router = useRouter();
  const token = useRef<string | null>(null);
  const verified = useRef(false);
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("type") === "invite" && hash.get("token_hash")) {
      token.current = hash.get("token_hash");
      setReady(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
    const recovery = hash.get("type") === "recovery";
    if (recovery)
      void supabase?.auth.getSession().then(({ data, error }) => {
        if (!error && data.session) {
          verified.current = true;
          setReady(true);
        }
      });
    const subscription = supabase?.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        verified.current = true;
        setReady(true);
      }
    });
    return () => subscription?.data.subscription.unsubscribe();
  }, []);
  return (
    <main className="account-page">
      <Brand />
      <h1>Configura tu contraseña</h1>
      <p>
        Elegí una contraseña personal para administrar la carta de tu
        restaurante.
      </p>
      {!supabase ? (
        <Notice>
          Esta es una demo. Los enlaces de activación reales requieren conectar
          Supabase.
        </Notice>
      ) : !ready ? (
        <Notice error>
          Abre el enlace de activación que te compartieron o solicita uno nuevo
          desde Recuperar contraseña.
        </Notice>
      ) : null}
      {error ? <Notice error>{error}</Notice> : null}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!supabase || !ready) return;
          const fd = new FormData(e.currentTarget);
          const password = String(fd.get("password"));
          if (password !== fd.get("confirm")) {
            setError("Las contraseñas no coinciden.");
            return;
          }
          setBusy(true);
          setError("");
          try {
            if (!verified.current && token.current) {
              const { error } = await supabase.auth.verifyOtp({
                token_hash: token.current,
                type: "invite",
              });
              if (error)
                throw new Error(
                  "El enlace venció o ya fue usado. Solicita una nueva activación o recupera tu contraseña.",
                );
              verified.current = true;
              token.current = null;
            }
            const { error } = await supabase.auth.updateUser({ password });
            if (error)
              throw new Error(
                "No se pudo guardar. Usa una contraseña más segura e inténtalo nuevamente.",
              );
            router.replace("/panel");
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "No se pudo activar la cuenta.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy || !ready || !supabase}>
          <label className="field">
            Nueva contraseña
            <input
              name="password"
              type="password"
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
              required
            />
            <small>Como mínimo 10 caracteres.</small>
          </label>
          <label className="field">
            Repetir contraseña
            <input
              name="confirm"
              type="password"
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>
          <button className="btn primary">
            {busy ? "Guardando…" : "Guardar contraseña y entrar"}
          </button>
        </fieldset>
      </form>
      <Link className="back-link" href="/recuperar">
        Recuperar contraseña
      </Link>
      <Link className="back-link" href="/acceso">
        Volver al acceso
      </Link>
    </main>
  );
}
