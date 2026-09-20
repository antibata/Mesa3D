"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Download, Copy, Check, ExternalLink } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { menuUrl } from "@/lib/site-url";
import { Notice } from "./ui";
import { useApp } from "./provider";

export function QrPanel({ restaurant }: { restaurant: Restaurant }) {
  const { demo } = useApp();
  const [url, setUrl] = useState(""),
    [png, setPng] = useState(""),
    [copied, setCopied] = useState(false),
    [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let stopped = false;
    setUrl("");
    setPng("");
    setError("");
    setCopied(false);
    async function generate() {
      try {
        const link = menuUrl(
          restaurant.slug,
          window.location.origin,
          process.env.NEXT_PUBLIC_SITE_URL,
        );
        setUrl(link);
        const q = await import("qrcode");
        const image = await q.toDataURL(link, {
          width: 900,
          margin: 3,
          errorCorrectionLevel: "H",
          color: { dark: "#20241f", light: "#ffffff" },
        });
        if (!stopped) setPng(image);
      } catch (e) {
        if (!stopped)
          setError(
            e instanceof Error
              ? e.message
              : "No se pudo generar el QR. Vuelve a abrir esta pestaña.",
          );
      }
    }
    void generate();
    return () => {
      stopped = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [restaurant.slug]);
  const local =
    url &&
    ["terminal.local", "localhost", "127.0.0.1", "[::1]"].includes(
      new URL(url).hostname,
    );
  return (
    <>
      {error ? <Notice error>{error}</Notice> : null}
      {!restaurant.published ? (
        <Notice>
          La carta está en borrador. Publícala desde Identidad para que el QR
          permita verla.
        </Notice>
      ) : null}
      <div className="qr-panel">
        <div className="qr-card">
          <h2>{restaurant.name}</h2>
          {png ? (
            <Image
              src={png}
              alt={`Código QR para la carta de ${restaurant.name}`}
              width={900}
              height={900}
              unoptimized
            />
          ) : (
            <p role="status">
              {error ? "QR no disponible" : "Generando código…"}
            </p>
          )}
          <p>Escanea. Explora. Disfruta.</p>
          <small>Descubre nuestra carta</small>
        </div>
        <div className="qr-info">
          <h2>Tu carta, a un escaneo.</h2>
          <p>
            Descarga el QR para colocarlo en las mesas. Puedes actualizar platos
            y precios sin cambiar este código.
          </p>
          {url ? <div className="url-box">{url}</div> : null}
          {demo ? (
            <Notice>
              En modo demo, las modificaciones solo existen en este navegador.
              El QR no las comparte con otros dispositivos. Conecta Supabase
              antes de usarlo con clientes.
            </Notice>
          ) : null}
          {local ? (
            <Notice>
              Este enlace es local. Genera el QR definitivo después de publicar
              la plataforma y configurar su dominio.
            </Notice>
          ) : null}
          <div className="actions">
            {png ? (
              <a
                className="btn primary"
                href={png}
                download={`qr-${restaurant.slug}.png`}
              >
                <Download size={17} /> Descargar QR
              </a>
            ) : null}
            <button
              className="btn"
              disabled={!url}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  if (timer.current) clearTimeout(timer.current);
                  timer.current = setTimeout(() => setCopied(false), 2500);
                } catch {
                  setError(
                    "No se pudo copiar. Selecciona y copia el enlace mostrado.",
                  );
                }
              }}
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}{" "}
              {copied ? "Copiado" : "Copiar enlace"}
            </button>
            {url && restaurant.published ? (
              <a
                className="btn"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={17} /> Probar enlace
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
