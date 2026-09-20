"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { supabase, isDemo } from "@/lib/supabase";
import { freshSeed, DEMO_RESTAURANT_ID } from "@/lib/seed";
import { dishSchema, restaurantSchema } from "@/lib/validation";
import type { Access, AppData, Dish, Restaurant } from "@/lib/types";
const STORE_KEY = "mesa3d-demo-v1";
type Context = AppData & {
  loading: boolean;
  error: string;
  access: Access | null;
  demo: boolean;
  saveRestaurant: (r: Restaurant) => Promise<void>;
  saveDish: (d: Dish) => Promise<void>;
  deleteDish: (id: string) => Promise<void>;
  enterDemo: (role: "platform" | "restaurant") => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetDemo: () => void;
  reload: () => Promise<void>;
};
const Ctx = createContext<Context | null>(null);
const message = (e: unknown) =>
  e instanceof Error
    ? e.message
    : "No se pudo completar la operación. Vuelve a intentarlo.";
export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() =>
    isDemo ? freshSeed() : { restaurants: [], dishes: [] },
  );
  const latestData = useRef(data);
  const requestId = useRef(0);
  const authUserId = useRef<string | null>(null);
  const [loadedPath, setLoadedPath] = useState("");
  const [access, setAccess] = useState<Access | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pathname = usePathname();
  const readDemo = useCallback(() => {
    setError("");
    try {
      const stored = localStorage.getItem(STORE_KEY);
      const parsed = stored ? JSON.parse(stored) : freshSeed();
      const next = {
        restaurants: parsed.restaurants.map((v: unknown) =>
          restaurantSchema.parse(v),
        ),
        dishes: parsed.dishes.map((v: unknown) => dishSchema.parse(v)),
      };
      latestData.current = next;
      setData(next);
    } catch {
      setError(
        "No se pudo recuperar la demo guardada. Puedes restablecer los datos de ejemplo.",
      );
    }
    setLoading(false);
  }, []);
  const reload = useCallback(async () => {
    if (!supabase) {
      readDemo();
      return;
    }
    const currentRequest = ++requestId.current;
    const current = () => requestId.current === currentRequest;
    setLoading(true);
    setError("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError && authError.name !== "AuthSessionMissingError")
        throw new Error(
          "No se pudo verificar tu sesión. Revisa la conexión y vuelve a intentarlo.",
        );
      const user = auth.user;
      if (current()) authUserId.current = user?.id ?? null;
      let nextAccess: Access | null = null;
      if (user) {
        const [admin, members] = await Promise.all([
          supabase
            .from("platform_admins")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("restaurant_members")
            .select("restaurant_id")
            .eq("user_id", user.id),
        ]);
        if (admin.error || members.error)
          throw new Error(
            "No se pudieron comprobar los permisos de esta cuenta.",
          );
        nextAccess = {
          kind: admin.data ? "platform" : "restaurant",
          restaurantIds: (members.data ?? []).map((m) => m.restaurant_id),
          email: user.email ?? "",
        };
      }
      if (!current()) return;
      setAccess(nextAccess);
      let rq = supabase.from("restaurants").select("*").order("name");
      const slug = pathname.startsWith("/r/")
        ? decodeURIComponent(pathname.split("/")[2] ?? "")
        : null;
      if (slug) rq = rq.eq("slug", slug).eq("published", true);
      else if (nextAccess?.kind === "restaurant")
        rq = rq.in("id", nextAccess.restaurantIds);
      else if (!nextAccess) {
        latestData.current = { restaurants: [], dishes: [] };
        setData(latestData.current);
        return;
      }
      const r = await rq;
      if (r.error)
        throw new Error(
          "No se pudo cargar la carta. Revisa la conexión e inténtalo de nuevo.",
        );
      const ids = (r.data ?? []).map((v) => v.id);
      const d = ids.length
        ? await supabase
            .from("dishes")
            .select("*")
            .in("restaurant_id", ids)
            .order("sort_order")
        : { data: [], error: null };
      if (d.error) throw new Error("No se pudieron cargar los platos.");
      if (current()) {
        latestData.current = {
          restaurants: r.data ?? [],
          dishes: d.data ?? [],
        };
        setData(latestData.current);
      }
    } catch (e) {
      if (current()) {
        latestData.current = { restaurants: [], dishes: [] };
        setData(latestData.current);
        setError(message(e));
      }
    } finally {
      if (current()) {
        setLoading(false);
        setLoadedPath(pathname);
      }
    }
  }, [pathname, readDemo]);
  useEffect(() => {
    if (isDemo) {
      readDemo();
      try {
        const role = sessionStorage.getItem("mesa3d-demo-role");
        if (role === "platform" || role === "restaurant")
          setAccess({
            kind: role,
            restaurantIds: role === "platform" ? [] : [DEMO_RESTAURANT_ID],
            email: "Cuenta de demostración",
          });
      } catch {
        /* A blocked session store must not prevent browsing the menu. */
      }
      const sync = (event: StorageEvent) => {
        if (event.key === STORE_KEY || event.key === null) readDemo();
      };
      window.addEventListener("storage", sync);
      return () => window.removeEventListener("storage", sync);
    }
    void reload();
    let disposed = false;
    const { data: subscription } = supabase!.auth.onAuthStateChange((event, session) => {
      // Supabase also emits SIGNED_IN when a tab regains focus. Do not erase
      // an open form just because the same user refocuses or refreshes a token.
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;
      if (event === "SIGNED_IN" && session?.user.id === authUserId.current) return;
      if (event === "SIGNED_OUT") {
        authUserId.current = null; requestId.current++;
        setAccess(null); latestData.current = { restaurants: [], dishes: [] }; setData(latestData.current);
      }
      setTimeout(() => {
        if (!disposed) void reload();
      }, 0);
    });
    return () => {
      disposed = true;
      requestId.current++;
      subscription.subscription.unsubscribe();
    };
  }, [reload, readDemo]);
  function commit(change: (previous: AppData) => AppData) {
    const next = change(latestData.current);
    if (isDemo) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        throw new Error(
          "El navegador no pudo guardar los cambios. Libera espacio o permite el almacenamiento local.",
        );
      }
    }
    latestData.current = next;
    setData(next);
  }
  function canManage(restaurantId: string) {
    return (
      access?.kind === "platform" ||
      access?.restaurantIds.includes(restaurantId)
    );
  }
  async function saveRestaurant(input: Restaurant) {
    const r = restaurantSchema.parse(input);
    const existing = latestData.current.restaurants.find((v) => v.id === r.id);
    if (
      (!existing && access?.kind !== "platform") ||
      (existing && !canManage(r.id))
    )
      throw new Error("No tienes acceso a este restaurante.");
    if (existing && existing.slug !== r.slug)
      throw new Error("El enlace es permanente para conservar el código QR.");
    if (
      latestData.current.restaurants.some(
        (v) => v.slug === r.slug && v.id !== r.id,
      )
    )
      throw new Error("Ese enlace ya está en uso. Elige otro.");
    if (supabase) {
      const query = existing
        ? supabase.from("restaurants").update(r).eq("id", r.id)
        : supabase.from("restaurants").insert(r);
      const { data: saved, error } = await query.select("id").single();
      if (error || !saved)
        throw new Error(
          error?.code === "23505"
            ? "Ese enlace ya está en uso."
            : "No se pudo guardar el restaurante.",
        );
    }
    commit((previous) => ({
      ...previous,
      restaurants: existing
        ? previous.restaurants.map((v) => (v.id === r.id ? r : v))
        : [...previous.restaurants, r],
    }));
  }
  async function saveDish(input: Dish) {
    const d = dishSchema.parse(input);
    if (!canManage(d.restaurant_id))
      throw new Error("No tienes acceso a este restaurante.");
    const existing = latestData.current.dishes.find((v) => v.id === d.id);
    if (existing && existing.restaurant_id !== d.restaurant_id)
      throw new Error("No se puede mover un plato entre restaurantes.");
    const restaurant = latestData.current.restaurants.find(
      (v) => v.id === d.restaurant_id,
    );
    if (!restaurant?.categories.includes(d.category))
      throw new Error("Selecciona una categoría de este restaurante.");
    if (supabase) {
      const { data: saved, error } = await supabase
        .from("dishes")
        .upsert(d)
        .select("id")
        .single();
      if (error || !saved) throw new Error("No se pudo guardar el plato.");
    }
    commit((previous) => ({
      ...previous,
      dishes: previous.dishes.some((v) => v.id === d.id)
        ? previous.dishes.map((v) => (v.id === d.id ? d : v))
        : [...previous.dishes, d],
    }));
  }
  async function deleteDish(id: string) {
    const d = latestData.current.dishes.find((v) => v.id === id);
    if (!d || !canManage(d.restaurant_id))
      throw new Error("No tienes acceso a este plato.");
    if (supabase) {
      const { data: removed, error } = await supabase
        .from("dishes")
        .delete()
        .eq("id", id)
        .select("id");
      if (error || !removed?.length)
        throw new Error("No se pudo eliminar el plato.");
    }
    commit((previous) => ({
      ...previous,
      dishes: previous.dishes.filter((v) => v.id !== id),
    }));
  }
  function enterDemo(kind: "platform" | "restaurant") {
    if (!isDemo) return;
    try {
      sessionStorage.setItem("mesa3d-demo-role", kind);
    } catch {
      throw new Error(
        "Permite el almacenamiento del navegador para entrar al panel de demostración.",
      );
    }
    setAccess({
      kind,
      restaurantIds: kind === "platform" ? [] : [DEMO_RESTAURANT_ID],
      email: "Cuenta de demostración",
    });
  }
  async function login(email: string, password: string) {
    if (!supabase) throw new Error("Usa los accesos de demostración.");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error)
      throw new Error(
        "No pudimos iniciar sesión. Comprueba tu correo y contraseña.",
      );
    await reload();
  }
  async function logout() {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error("No se pudo cerrar sesión.");
    }
    try {
      sessionStorage.removeItem("mesa3d-demo-role");
    } catch {
      /* Session may not be persisted. */
    }
    requestId.current++;
    setAccess(null);
    if (!isDemo) {
      latestData.current = { restaurants: [], dishes: [] };
      setData(latestData.current);
    }
    setLoading(false);
  }
  function resetDemo() {
    if (isDemo) {
      try {
        commit(() => freshSeed());
        setError("");
      } catch (e) {
        setError(message(e));
      }
    }
  }
  return (
    <Ctx.Provider
      value={{
        ...data,
        loading: loading || (!isDemo && loadedPath !== pathname),
        error,
        access,
        demo: isDemo,
        saveRestaurant,
        saveDish,
        deleteDish,
        enterDemo,
        login,
        logout,
        resetDemo,
        reload,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
export function useApp() {
  const value = useContext(Ctx);
  if (!value) throw new Error("Falta AppProvider.");
  return value;
}
