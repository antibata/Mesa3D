'use client';
import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, ExternalLink, LogOut, Info } from 'lucide-react';
import { useApp } from './provider';
import { Brand, Notice } from './ui';
export function Workspace({ children, title = 'Restaurantes' }: { children: ReactNode; title?: string }) {
  const app = useApp(), router = useRouter();
  useEffect(() => { if (!app.loading && !app.access) router.replace('/acceso'); }, [app.loading, app.access, router]);
  if (app.loading || !app.access) return <div className="page-loading"><Brand/><p>Preparando tu espacio…</p></div>;
  const restaurant = app.restaurants.find(r => app.access?.kind === 'platform' || app.access?.restaurantIds.includes(r.id));
  return <div className="workspace"><aside className="sidebar"><Brand dark/><span className="sidebar-label">TU ESPACIO</span><Link href="/panel" className="side-link active" title="Restaurantes"><Store size={19}/> {app.access.kind === 'platform' ? 'Restaurantes' : 'Mi restaurante'}</Link>{restaurant?.published ? <Link href={`/r/${restaurant.slug}`} className="side-link" title="Ver carta"><ExternalLink size={19}/> Ver carta</Link> : null}<div className="side-footer"><strong>{app.access.kind === 'platform' ? 'Administración general' : 'Administración del restaurante'}</strong><span>{app.access.email}</span><button onClick={async () => { try { await app.logout(); router.push('/acceso'); } catch(e) { alert(e instanceof Error ? e.message : 'No se pudo cerrar sesión.'); } }}><LogOut size={15}/> Salir</button></div></aside><div className="workspace-main"><header className="workspace-top"><span>Tu espacio <span aria-hidden="true">/</span> <b>{title}</b></span><div className="actions"><Link className="btn sm ghost" href="/acceso">{app.demo ? 'Cambiar acceso' : 'Mi cuenta'}</Link><span className="avatar">{app.access.kind === 'platform' ? 'MG' : 'RE'}</span></div></header><div className="workspace-content">{app.demo ? <div className="demo-notice"><Info size={16}/><span><strong>Modo demostración.</strong> Los cambios se guardan únicamente en este navegador; no se comparten con otros dispositivos.</span></div> : null}{app.error ? <Notice error>{app.error}<button className="btn sm" onClick={() => void app.reload()}>Reintentar</button></Notice> : null}{children}</div></div></div>;
}
