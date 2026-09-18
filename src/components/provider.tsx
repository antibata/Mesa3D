'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { supabase, isDemo } from '@/lib/supabase';
import { freshSeed, DEMO_RESTAURANT_ID } from '@/lib/seed';
import { dishSchema, restaurantSchema } from '@/lib/validation';
import type { Access, AppData, Dish, Restaurant } from '@/lib/types';
const STORE_KEY = 'mesa3d-demo-v1';
type Context = AppData & {
  loading: boolean; error: string; access: Access | null; demo: boolean;
  saveRestaurant: (r: Restaurant) => Promise<void>; saveDish: (d: Dish) => Promise<void>;
  deleteDish: (id: string) => Promise<void>; enterDemo: (role: 'platform' | 'restaurant') => void;
  login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>;
  resetDemo: () => void; reload: () => Promise<void>;
};
const Ctx = createContext<Context | null>(null);
const message = (e: unknown) => e instanceof Error ? e.message : 'No se pudo completar la operación. Vuelve a intentarlo.';
export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(isDemo ? freshSeed() : { restaurants: [], dishes: [] });
  const [access, setAccess] = useState<Access | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pathname = usePathname();
  const reload = useCallback(async () => {
    if (!supabase) return;
    setLoading(true); setError('');
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      let nextAccess: Access | null = null;
      if (user) {
        const [admin, members] = await Promise.all([
          supabase.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle(),
          supabase.from('restaurant_members').select('restaurant_id').eq('user_id', user.id)
        ]);
        if (admin.error || members.error) throw new Error('No se pudieron comprobar los permisos de esta cuenta.');
        nextAccess = { kind: admin.data ? 'platform' : 'restaurant', restaurantIds: (members.data ?? []).map(m => m.restaurant_id), email: user.email ?? '' };
      }
      setAccess(nextAccess);
      let rq = supabase.from('restaurants').select('*').order('name');
      const slug = pathname.startsWith('/r/') ? decodeURIComponent(pathname.split('/')[2] ?? '') : null;
      if (slug) rq = rq.eq('slug', slug).eq('published', true);
      else if (nextAccess?.kind === 'restaurant') rq = rq.in('id', nextAccess.restaurantIds);
      else if (!nextAccess) { setData({ restaurants: [], dishes: [] }); return; }
      const r = await rq;
      if (r.error) throw new Error('No se pudo cargar la carta. Revisa la conexión e inténtalo de nuevo.');
      const ids = (r.data ?? []).map(v => v.id);
      const d = ids.length ? await supabase.from('dishes').select('*').in('restaurant_id', ids).order('sort_order') : { data: [], error: null };
      if (d.error) throw new Error('No se pudieron cargar los platos.');
      setData({ restaurants: r.data ?? [], dishes: d.data ?? [] });
    } catch (e) { setError(message(e)); } finally { setLoading(false); }
  }, [pathname]);
  useEffect(() => {
    if (isDemo) {
      try {
        const stored = localStorage.getItem(STORE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed.restaurants) && Array.isArray(parsed.dishes)) setData({ restaurants: parsed.restaurants.map((v: unknown) => restaurantSchema.parse(v)), dishes: parsed.dishes.map((v: unknown) => dishSchema.parse(v)) });
        }
        const role = sessionStorage.getItem('mesa3d-demo-role');
        if (role === 'platform' || role === 'restaurant') setAccess({ kind: role, restaurantIds: role === 'platform' ? [] : [DEMO_RESTAURANT_ID], email: 'Cuenta de demostración' });
      } catch { setError('No se pudo recuperar la demo guardada. Puedes restablecerla desde el panel.'); }
      setLoading(false);
      return;
    }
    void reload();
    const { data: subscription } = supabase!.auth.onAuthStateChange(() => { setTimeout(() => void reload(), 0); });
    return () => subscription.subscription.unsubscribe();
  }, [reload]);
  function commit(next: AppData) {
    if (isDemo) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); }
      catch { throw new Error('El navegador no pudo guardar los cambios. Libera espacio o permite el almacenamiento local.'); }
    }
    setData(next);
  }
  function canManage(restaurantId: string) { return access?.kind === 'platform' || access?.restaurantIds.includes(restaurantId); }
  async function saveRestaurant(input: Restaurant) {
    const r = restaurantSchema.parse(input);
    const existing = data.restaurants.find(v => v.id === r.id);
    if ((!existing && access?.kind !== 'platform') || (existing && !canManage(r.id))) throw new Error('No tienes acceso a este restaurante.');
    if (existing && existing.slug !== r.slug) throw new Error('El enlace es permanente para conservar el código QR.');
    if (data.restaurants.some(v => v.slug === r.slug && v.id !== r.id)) throw new Error('Ese enlace ya está en uso. Elige otro.');
    if (supabase) {
      const query = existing ? supabase.from('restaurants').update(r).eq('id', r.id) : supabase.from('restaurants').insert(r);
      const { data: saved, error } = await query.select('id').single();
      if (error || !saved) throw new Error(error?.code === '23505' ? 'Ese enlace ya está en uso.' : 'No se pudo guardar el restaurante.');
    }
    commit({ ...data, restaurants: existing ? data.restaurants.map(v => v.id === r.id ? r : v) : [...data.restaurants, r] });
  }
  async function saveDish(input: Dish) {
    const d = dishSchema.parse(input);
    if (!canManage(d.restaurant_id)) throw new Error('No tienes acceso a este restaurante.');
    const restaurant = data.restaurants.find(v => v.id === d.restaurant_id);
    if (!restaurant?.categories.includes(d.category)) throw new Error('Selecciona una categoría de este restaurante.');
    if (supabase) {
      const { data: saved, error } = await supabase.from('dishes').upsert(d).select('id').single();
      if (error || !saved) throw new Error('No se pudo guardar el plato.');
    }
    commit({ ...data, dishes: data.dishes.some(v => v.id === d.id) ? data.dishes.map(v => v.id === d.id ? d : v) : [...data.dishes, d] });
  }
  async function deleteDish(id: string) {
    const d = data.dishes.find(v => v.id === id);
    if (!d || !canManage(d.restaurant_id)) throw new Error('No tienes acceso a este plato.');
    if (supabase) {
      const { data: removed, error } = await supabase.from('dishes').delete().eq('id', id).select('id');
      if (error || !removed?.length) throw new Error('No se pudo eliminar el plato.');
    }
    commit({ ...data, dishes: data.dishes.filter(v => v.id !== id) });
  }
  function enterDemo(kind: 'platform' | 'restaurant') {
    if (!isDemo) return;
    sessionStorage.setItem('mesa3d-demo-role', kind);
    setAccess({ kind, restaurantIds: kind === 'platform' ? [] : [DEMO_RESTAURANT_ID], email: 'Cuenta de demostración' });
  }
  async function login(email: string, password: string) {
    if (!supabase) throw new Error('Usa los accesos de demostración.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('No pudimos iniciar sesión. Comprueba tu correo y contraseña.');
    await reload();
  }
  async function logout() {
    if (supabase) { const { error } = await supabase.auth.signOut(); if (error) throw new Error('No se pudo cerrar sesión.'); }
    sessionStorage.removeItem('mesa3d-demo-role'); setAccess(null);
  }
  function resetDemo() { if (isDemo) { commit(freshSeed()); setError(''); } }
  return <Ctx.Provider value={{ ...data, loading, error, access, demo: isDemo, saveRestaurant, saveDish, deleteDish, enterDemo, login, logout, resetDemo, reload }}>{children}</Ctx.Provider>;
}
export function useApp() { const value = useContext(Ctx); if (!value) throw new Error('Falta AppProvider.'); return value; }
