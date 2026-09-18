'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Box, X, UtensilsCrossed } from 'lucide-react';
export function Brand({ dark = false }: { dark?: boolean }) { return <Link className={`brand ${dark ? 'brand-light' : ''}`} href="/"><span className="brand-mark"><Box size={23} strokeWidth={1.7} /></span>Mesa<span className="brand-suffix">3D</span></Link>; }
export function Photo({ src, alt, className = '', priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return src ? <Image src={src} alt={alt} width={900} height={650} className={className} unoptimized={!src.startsWith('/')} priority={priority} /> : <div className={`photo-empty ${className}`}><UtensilsCrossed size={38} /><span>Sin fotografía</span></div>;
}
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; d?.showModal(); const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { d?.close(); document.body.style.overflow = prev; }; }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} onCancel={onClose} onClick={e => { if (e.target === ref.current) onClose(); }} aria-label={title}><div className="modal-head"><h2>{title}</h2><button type="button" className="icon-button" aria-label="Cerrar ventana" onClick={onClose}><X size={22}/></button></div>{children}</dialog>;
}
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) { return <div className={error ? 'notice error' : 'notice'} role={error ? 'alert' : 'status'}>{children}</div>; }
