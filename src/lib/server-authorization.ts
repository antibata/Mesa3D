import type { SupabaseClient } from "@supabase/supabase-js";
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export function bearerToken(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer ([^\s]+)$/)?.[1];
  if (!token || token.length > 8192)
    throw new HttpError(401, "Inicia sesión para continuar.");
  return token;
}
export async function requirePlatformAdmin(
  client: SupabaseClient,
  token: string,
) {
  // Never trust localStorage, user_metadata or a JWT decoded without verification.
  const { data: auth, error } = await client.auth.getUser(token);
  if (error || !auth.user)
    throw new HttpError(401, "La sesión venció. Vuelve a ingresar.");
  const { data: admin, error: permissionError } = await client
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (permissionError || !admin)
    throw new HttpError(
      403,
      "Solo la administración general puede gestionar clientes y accesos.",
    );
  return auth.user.id;
}
export function requireSameOrigin(request: Request, configuredSite?: string) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new HttpError(403, "Origen no permitido.");
  const allowed = new Set([new URL(request.url).origin]);
  if (configuredSite) allowed.add(new URL(configuredSite).origin);
  if (origin && !allowed.has(origin))
    throw new HttpError(403, "Origen no permitido.");
}
export async function readLimitedJson(
  request: Request,
  limit = 8192,
): Promise<unknown> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new HttpError(415, "Se requiere contenido JSON.");
  if (Number(request.headers.get("content-length")) > limit)
    throw new HttpError(413, "Solicitud demasiado grande.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Solicitud inválida.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new HttpError(413, "Solicitud demasiado grande.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new HttpError(400, "Solicitud inválida.");
  }
}
