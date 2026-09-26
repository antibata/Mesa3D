import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { onboardingActionSchema } from "@/lib/onboarding";
import { menuUrl } from "@/lib/site-url";
import { HttpError, bearerToken, requirePlatformAdmin, requireSameOrigin, readLimitedJson } from "@/lib/server-authorization";
export const runtime = "nodejs";
const response = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
async function authorize(request: Request, id: string) {
  if (!z.uuid().safeParse(id).success)
    throw new HttpError(400, "Restaurante inválido.");
  const token = bearerToken(request);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new HttpError(
      503,
      "La administración de cuentas reales requiere Supabase.",
    );
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await requirePlatformAdmin(client,token);
  const { data: restaurant } = await client
    .from("restaurants")
    .select("id,slug,published")
    .eq("id", id)
    .maybeSingle();
  if (!restaurant) throw new HttpError(404, "Restaurante no disponible.");
  return { client, restaurant };
}
function accountAdmin() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key)
    throw new HttpError(
      503,
      "Falta configurar la clave privada de Supabase en el servidor para gestionar accesos.",
    );
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
function failure(error: unknown) {
  return response(
    {
      error:
        error instanceof HttpError
          ? error.message
          : "No se pudo completar la operación. Comprueba la conexión y las migraciones.",
    },
    error instanceof HttpError ? error.status : 500,
  );
}
type RouteContext = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { client } = await authorize(request, id);
    const [contact, memberships] = await Promise.all([
      client
        .from("restaurant_clients")
        .select("contact_name,email,phone,delivered_at")
        .eq("restaurant_id", id)
        .maybeSingle(),
      client
        .from("restaurant_members")
        .select("user_id")
        .eq("restaurant_id", id),
    ]);
    if (contact.error || memberships.error)
      throw new Error("Database read failed");
    const admin = memberships.data.length ? accountAdmin() : null;
    const members = await Promise.all(
      memberships.data.map(async (m) => {
        const { data, error } = await admin!.auth.admin.getUserById(m.user_id);
        if (error) throw new Error("Account read failed");
        return {
          user_id: m.user_id,
          email: data.user.email ?? "Sin correo",
          confirmed: Boolean(data.user.email_confirmed_at),
        };
      }),
    );
    return response({ client: contact.data, members });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request, context: RouteContext) {
  try {
    requireSameOrigin(request,process.env.NEXT_PUBLIC_SITE_URL);
    const { id } = await context.params;
    const { client, restaurant } = await authorize(request, id);
    const json = await readLimitedJson(request);
    const parsed = onboardingActionSchema.safeParse(json);
    if (!parsed.success)
      throw new HttpError(400, "Revisa el nombre y el correo del cliente.");
    const body = parsed.data;
    if (body.action === "contact") {
      const { action: _, ...contact } = body;
      const { error } = await client
        .from("restaurant_clients")
        .upsert({ restaurant_id: id, ...contact });
      if (error) throw new Error("Contact save failed");
      return response({ ok: true });
    }
    if (body.action === "revoke") {
      const { error } = await client
        .from("restaurant_members")
        .delete()
        .eq("restaurant_id", id)
        .eq("user_id", body.user_id);
      if (error) throw new Error("Revoke failed");
      return response({ ok: true });
    }
    if (body.action === "delivered") {
      const origin = process.env.NEXT_PUBLIC_SITE_URL;
      if (
        !origin ||
        new URL(menuUrl(restaurant.slug, origin)).protocol !== "https:"
      )
        throw new HttpError(
          409,
          "Configura un dominio público HTTPS antes de entregar la carta.",
        );
      const [dishes, members] = await Promise.all([
        client
          .from("dishes")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", id)
          .eq("available", true),
        client
          .from("restaurant_members")
          .select("user_id", { count: "exact", head: true })
          .eq("restaurant_id", id),
      ]);
      if (dishes.error || members.error) throw new Error("Read failed");
      if (!restaurant.published || !dishes.count || !members.count)
        throw new HttpError(
          409,
          "Publica la carta con platos disponibles y asigna un encargado antes de entregarla.",
        );
      const { data, error } = await client
        .from("restaurant_clients")
        .update({ delivered_at: new Date().toISOString() })
        .eq("restaurant_id", id)
        .select("restaurant_id")
        .single();
      if (error || !data)
        throw new HttpError(409, "Guarda primero los datos del cliente.");
      return response({ ok: true });
    }
    // Privileged Auth calls happen only after token and platform role verification.
    const admin = accountAdmin();
    const { data: users, error: lookupError } = await admin.rpc(
      "lookup_onboarding_user",
      { p_email: body.email },
    );
    if (lookupError) throw new Error("Lookup failed");
    let userId: string | undefined = users?.[0]?.id;
    let activationUrl: string | null = null;
    if (!userId || !users[0].confirmed) {
      const origin = process.env.NEXT_PUBLIC_SITE_URL;
      if (!origin)
        throw new HttpError(
          503,
          "Configura el dominio definitivo antes de generar un acceso.",
        );
      const base = new URL(menuUrl(restaurant.slug, origin)).origin;
      const { data, error } = await admin.auth.admin.generateLink({
        type: "invite",
        email: body.email,
      });
      if (error || !data.user || !data.properties)
        throw new HttpError(
          409,
          "No se pudo generar la activación. Verifica el correo o pide al encargado que use Recuperar contraseña.",
        );
      userId = data.user.id;
      // Fragment avoids recording activation tokens in server request logs.
      activationUrl = `${base}/activar#token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=invite`;
    }
    const { error: memberError } = await client
      .from("restaurant_members")
      .upsert({ restaurant_id: id, user_id: userId });
    if (memberError)
      throw new HttpError(
        500,
        "La cuenta existe, pero no se pudo asignar el acceso. Reintenta con el mismo correo.",
      );
    return response({
      ok: true,
      activationUrl,
      existingAccount: !activationUrl,
    });
  } catch (e) {
    return failure(e);
  }
}
