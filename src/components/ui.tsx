"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, UtensilsCrossed } from "lucide-react";
import { isAssetUrl } from "@/lib/validation";
export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link className={`brand ${dark ? "brand-light" : ""}`} href="/">
      <span className="brand-mark">
        <UtensilsCrossed size={23} strokeWidth={1.7} />
      </span>
      Mesa<span className="brand-suffix"> · menú</span>
    </Link>
  );
}
export function Photo({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return src && isAssetUrl(src) && src !== failedSrc ? (
    <Image
      src={src}
      alt={alt}
      width={900}
      height={650}
      sizes="(max-width: 540px) 100vw, (max-width: 800px) 50vw, 400px"
      className={className}
      unoptimized={!src.startsWith("/")}
      priority={priority}
      onError={() => setFailedSrc(src)}
    />
  ) : (
    <div
      className={`photo-empty ${className}`}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
    >
      <UtensilsCrossed size={38} />
      <span>{src ? "Fotografía no disponible" : "Sin fotografía"}</span>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      d?.close();
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        const d = ref.current;
        if (e.target !== d || !d) return;
        const rect = d.getBoundingClientRect();
        if (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        )
          onClose();
      }}
      aria-label={title}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Cerrar ventana"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={error ? "notice error" : "notice"}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
