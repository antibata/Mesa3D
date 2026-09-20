"use client";
import { useEffect, useRef, useState, createElement } from "react";
import { Camera, RotateCcw, Box, LoaderCircle } from "lucide-react";
import { Photo } from "./ui";
import type { Dish } from "@/lib/types";

type ViewerElement = HTMLElement & {
  canActivateAR: boolean;
  activateAR: () => Promise<void>;
  cameraOrbit: string;
  fieldOfView: string;
  cameraTarget: string;
  jumpCameraToGoal: () => void;
  loaded: boolean;
};

export function FoodViewer({ dish }: { dish: Dish }) {
  const ref = useRef<ViewerElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ar, setAr] = useState(false);
  const [arMessage, setArMessage] = useState("");
  const [retrying, setRetrying] = useState(false);
  async function retry() {
    setRetrying(true);
    try {
      // The pinned model-viewer loader also caches failed GLTF instances.
      // Evict only this URL; do not alter signed URLs or other models' cache.
      const { CachingGLTFLoader } = await import('@google/model-viewer/lib/three-components/CachingGLTFLoader.js');
      // A failed GLTF has no scene to dispose; deletion removes its cache
      // entry before that cleanup may reject. Retrying is still valid.
      await Promise.allSettled([CachingGLTFLoader.delete(dish.model_url), CachingGLTFLoader.delete(new URL(dish.model_url, document.baseURI).href)]);
      setAttempt(v => v + 1);
    } catch {
      setArMessage('No se pudo reintentar. Recarga la carta para volver a cargar el visor.');
    } finally { setRetrying(false); }
  }

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setLoaded(false);
    setFailed(false);
    setAr(false);
    setArMessage("");
    timer.current = setTimeout(() => {
      if (!cancelled) setFailed(true);
    }, 25000);
    import("@google/model-viewer")
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [attempt, dish.model_url]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !ready || failed) return;
    const onLoad = () => {
      if (timer.current) clearTimeout(timer.current);
      setLoaded(true);
      setFailed(false);
      setAr(el.canActivateAR);
    };
    const onError = () => {
      if (timer.current) clearTimeout(timer.current);
      setFailed(true);
      setLoaded(false);
      setAr(false);
    };
    const onStatus = (event: Event) => {
      if ((event as CustomEvent).detail.status === "failed")
        setArMessage(
          "No se pudo iniciar la cámara. Comprueba los permisos del navegador.",
        );
    };
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    el.addEventListener("ar-status", onStatus);
    if (el.loaded) onLoad();
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
      el.removeEventListener("ar-status", onStatus);
    };
  }, [ready, attempt, dish.model_url, failed]);

  return (
    <div className="viewer-wrap" aria-busy={!loaded && !failed}>
      <div className="viewer-label">
        <Box size={16} />{" "}
        {failed ? "Fotografía del plato" : "Vista 3D interactiva"}
      </div>
      <div className="viewer-stage">
        {ready && !failed
          ? createElement(
              "model-viewer",
              {
                key: `${dish.model_url}-${attempt}`,
                ref,
                src: dish.model_url,
                "ios-src": dish.usdz_url || undefined,
                alt: `Modelo 3D de ${dish.name}. Arrastra para girar y usa dos dedos para acercar.`,
                "camera-controls": true,
                ar: true,
                "ar-modes": "webxr scene-viewer quick-look",
                "ar-scale": dish.demo_model ? "auto" : "fixed",
                "shadow-intensity": "1.2",
                "shadow-softness": "0.9",
                exposure: "1",
                "environment-image": "neutral",
                "camera-orbit": "25deg 65deg auto",
                "touch-action": "pan-y",
                "interaction-prompt": "auto",
                loading: "eager",
                style: { width: "100%", height: "100%", minHeight: "320px" },
              },
              <button
                slot="ar-button"
                style={{ display: "none" }}
                aria-hidden="true"
                tabIndex={-1}
              />,
            )
          : null}
        {!loaded && !failed ? (
          <div className="viewer-loading" role="status">
            <LoaderCircle className="spin" size={27} />
            <span>Preparando el plato en 3D…</span>
          </div>
        ) : null}
        {failed ? (
          <div className="viewer-fallback">
            <Photo src={dish.image_url} alt={dish.name} />
            <div role="status">
              <p>No pudimos cargar el modelo 3D.</p>
              <span>Puedes seguir consultando la foto y el detalle.</span>
              <button
                type="button"
                className="btn"
                disabled={retrying}
                onClick={() => void retry()}
              >
                <RotateCcw size={16} /> {retrying ? 'Preparando…' : 'Reintentar 3D'}
              </button>
              {arMessage ? <p role="alert">{arMessage}</p> : null}
            </div>
          </div>
        ) : null}
      </div>
      {!failed ? (
        <>
          <div className="viewer-bottom">
            <span>Arrastra para girar · Pellizca para acercar</span>
            <button
              type="button"
              className="icon-button"
              aria-label="Restablecer vista 3D"
              disabled={!loaded}
              onClick={() => {
                if (ref.current) {
                  ref.current.cameraOrbit = "25deg 65deg auto";
                  ref.current.cameraTarget = "auto auto auto";
                  ref.current.fieldOfView = "auto";
                  ref.current.jumpCameraToGoal();
                }
              }}
            >
              <RotateCcw size={18} />
            </button>
          </div>
          <div className="ar-controls">
            <button
              type="button"
              className="btn primary"
              disabled={!loaded || !ar}
              onClick={async () => {
                setArMessage("");
                try {
                  await ref.current?.activateAR();
                } catch {
                  setArMessage(
                    "No se pudo abrir la realidad aumentada en este dispositivo.",
                  );
                }
              }}
            >
              <Camera size={19} /> Ver sobre mi mesa
            </button>
            <small role="status">
              {arMessage ||
                (ar
                  ? "Permite el acceso a la cámara para continuar."
                  : "La cámara se habilita en celulares y navegadores compatibles.")}
            </small>
          </div>
        </>
      ) : null}
    </div>
  );
}
