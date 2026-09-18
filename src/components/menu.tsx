'use client';
import { useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowUpRight, Box, MapPin, Clock3, Utensils, ChevronRight, Sparkles } from 'lucide-react';
import { useApp } from './provider';
import { Brand, Modal, Notice, Photo } from './ui';
import { priceLabel } from '@/lib/validation';
import type { Dish } from '@/lib/types';
const FoodViewer = dynamic(() => import('./model-viewer').then(v => v.FoodViewer), { ssr: false, loading: () => <div className="viewer-wrap viewer-loading">Preparando vista 3D…</div> });
export function MenuPage({ slug }: { slug: string }) {
  const { restaurants, dishes, loading, demo, error, reload } = useApp();
  const [category, setCategory] = useState('Todos');
  const [selected, setSelected] = useState<Dish | null>(null);
  const restaurant = restaurants.find(r => r.slug === slug && r.published);
  if (loading) return <div className="page-loading"><Brand/><p>Cargando la carta…</p></div>;
  if (error) return <div className="page-loading"><Notice error>{error}</Notice><button className="btn" onClick={() => void reload()}>Volver a intentar</button></div>;
  if (!restaurant) return <div className="page-loading"><Brand/><h1>Esta carta no está disponible</h1><p>Comprueba el enlace o consulta con el restaurante.</p><Link href="/" className="btn">Volver al inicio</Link></div>;
  const menu = dishes.filter(d => d.restaurant_id === restaurant.id && d.available).sort((a,b) => a.sort_order-b.sort_order);
  const shown = category === 'Todos' ? menu : menu.filter(d => d.category === category);
  return <main className="menu-page" style={{ '--accent': restaurant.accent } as CSSProperties}>
    <div className="demo-top"><div className="container demo-top-inner"><Brand dark/><span>{demo ? 'RESTAURANTE DE DEMOSTRACIÓN' : 'CARTA DIGITAL'}</span><Link href="/acceso">Administrar <ArrowUpRight size={16}/></Link></div></div>
    <header className="restaurant-header"><div className="container restaurant-header-inner"><div><div className="eyebrow"><span className="line"/> {restaurant.tagline}</div><h1>{restaurant.name}<span className="name-dot">.</span></h1><p className="restaurant-description">{restaurant.description}</p><div className="restaurant-meta"><span><MapPin size={16}/>{restaurant.address}</span><span><Clock3 size={16}/>{restaurant.hours}</span></div></div><div className="menu-seal" aria-hidden="true"><Utensils size={31}/><span>A TU GUSTO.<br/>A TU MESA.</span></div></div></header>
    <div className="category-bar"><nav className="container categories" aria-label="Categorías de la carta">{['Todos', ...restaurant.categories].map(c => <button key={c} className={c === category ? 'category active' : 'category'} aria-pressed={c === category} onClick={() => setCategory(c)}>{c === 'Todos' ? <Utensils size={16}/> : null}{c}</button>)}</nav></div>
    <section className="container menu-content"><div className="section-heading"><div><span className="eyebrow dark">HECHO PARA DISFRUTAR</span><h2>{category === 'Todos' ? 'Nuestra carta' : category}</h2></div><div className="menu-hint"><Box size={21}/><span>Los platos con <b>3D</b><br/>se pueden explorar de cerca.</span></div></div>
      {shown.length ? <div className="dish-grid">{shown.map((d, i) => <button className="dish-card" key={d.id} onClick={() => setSelected(d)} aria-label={`Ver ${d.name}`}><div className={`dish-photo ${d.model_url ? 'model-photo' : ''}`}><Photo src={d.image_url} alt={d.name} priority={i < 3}/>{d.model_url ? <span className="badge badge-3d"><Box size={14}/> Explorar en 3D</span> : d.featured ? <span className="badge badge-white">De la casa</span> : null}<span className="card-arrow"><ArrowUpRight size={22}/></span></div><div className="dish-body"><span className="dish-category">{d.category}</span><div className="dish-title-row"><h3>{d.name}</h3><span className="price">{priceLabel(d.price,restaurant.currency)}</span></div><p>{d.description}</p><span className="dish-more">{d.model_url ? 'Descubre el plato' : 'Ver detalle'} <ChevronRight size={15}/></span></div></button>)}</div> : <div className="empty"><Utensils size={34}/><h3>Estamos preparando esta sección</h3><p>Explora las otras categorías de nuestra carta.</p></div>}
      <div className="menu-footnote"><Sparkles size={17}/><p>{demo ? 'Carta de ejemplo. Las fotos, los precios y los modelos son ilustrativos. Los modelos pueden diferir de las fotografías.' : '¿Tienes alguna alergia? Consulta con nuestro equipo antes de pedir.'}</p><span>Precios en {restaurant.currency}</span></div>
    </section><footer className="menu-footer"><Brand/><span>Una nueva forma de elegir.</span><Link href="/creditos">Créditos de los recursos</Link></footer>
    {selected ? <Modal title={selected.name} onClose={() => setSelected(null)} wide><div className={`dish-detail ${selected.model_url ? 'with-model' : ''}`}><div className="detail-info"><span className="eyebrow dark">{selected.category}</span><h2>{selected.name}</h2><p>{selected.description}</p><strong className="detail-price">{priceLabel(selected.price,restaurant.currency)}</strong>{selected.allergens ? <div className="allergens"><strong>Alérgenos declarados</strong><p>{selected.allergens}. Consulta por posibles trazas.</p></div> : <p className="subtle">Consulta al restaurante por alérgenos y posibles trazas.</p>}{selected.demo_model ? <div className="model-note"><Box size={18}/><span>Modelo de demostración. Su apariencia puede diferir de la foto y el tamaño es orientativo.</span></div> : null}</div>{selected.model_url ? <FoodViewer key={selected.model_url} dish={selected}/> : <Photo src={selected.image_url} alt={selected.name} className="detail-photo"/>}</div></Modal> : null}
  </main>;
}
