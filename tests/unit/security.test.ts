import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { validateSecurityConfig } from "../../src/lib/security-config.ts";
import {
  HttpError,
  bearerToken,
  requirePlatformAdmin,
  requireSameOrigin,
  readLimitedJson,
} from "../../src/lib/server-authorization.ts";
const status = (n: number) => (e: unknown) =>
  e instanceof HttpError && e.status === n;
test("missing configuration fails closed and demo must be explicit", () => {
  assert.throws(
    () => validateSecurityConfig({}),
    /no se activa automáticamente/,
  );
  assert.equal(validateSecurityConfig({ demo: "true" }), true);
  assert.throws(
    () => validateSecurityConfig({ demo: "true", deployment: "production" }),
    /prohibida/,
  );
  assert.throws(
    () => validateSecurityConfig({ url: "https://project.supabase.co" }),
    /juntas/,
  );
  assert.throws(
    () =>
      validateSecurityConfig({
        url: "https://project.supabase.co",
        key: "public",
        demo: "true",
      }),
    /combinar/,
  );
  assert.equal(
    validateSecurityConfig({
      url: "https://project.supabase.co",
      key: "sb_publishable_test",
      deployment: "production",
    }),
    false,
  );
});
test("secret credentials cannot be bundled as a browser key", () => {
  assert.throws(
    () =>
      validateSecurityConfig({
        url: "https://project.supabase.co",
        key: "sb_secret_test",
      }),
    /secreta/,
  );
  const jwt =
    "header." +
    Buffer.from(JSON.stringify({ role: "service_role" })).toString(
      "base64url",
    ) +
    ".signature";
  assert.throws(
    () =>
      validateSecurityConfig({ url: "https://project.supabase.co", key: jwt }),
    /service_role/,
  );
});
test("onboarding rejects absent or oversized bearer tokens and cross-site mutation", () => {
  assert.throws(
    () => bearerToken(new Request("https://mesa.example/api")),
    status(401),
  );
  assert.throws(
    () =>
      bearerToken(
        new Request("https://mesa.example/api", {
          headers: { authorization: "Bearer " + "x".repeat(9000) },
        }),
      ),
    status(401),
  );
  assert.throws(
    () =>
      requireSameOrigin(
        new Request("https://mesa.example/api", {
          headers: { origin: "https://evil.example" },
        }),
      ),
    status(403),
  );
  assert.throws(
    () =>
      requireSameOrigin(
        new Request("https://mesa.example/api", {
          headers: { "sec-fetch-site": "cross-site" },
        }),
      ),
    status(403),
  );
  assert.doesNotThrow(() =>
    requireSameOrigin(
      new Request("https://mesa.example/api", {
        headers: { origin: "https://mesa.example" },
      }),
    ),
  );
});
function client({
  valid = true,
  admin = false,
  dbError = false,
}: {
  valid?: boolean;
  admin?: boolean;
  dbError?: boolean;
}) {
  let roleReads = 0;
  const value = {
    auth: {
      getUser: async (token: string) => {
        assert.equal(token, "verified-by-auth-server");
        return {
          data: {
            user: valid
              ? {
                  id: "user-1",
                  user_metadata: { role: "platform", is_admin: true },
                }
              : null,
          },
          error: valid ? null : new Error("invalid token"),
        };
      },
    },
    from: (table: string) => {
      roleReads++;
      assert.equal(table, "platform_admins");
      return {
        select: () => ({
          eq: (column: string, id: string) => {
            assert.equal(column, "user_id");
            assert.equal(id, "user-1");
            return {
              maybeSingle: async () => ({
                data: admin ? { user_id: id } : null,
                error: dbError ? new Error("offline") : null,
              }),
            };
          },
        }),
      };
    },
  };
  return { value: value as unknown as SupabaseClient, reads: () => roleReads };
}
test("forged or expired tokens cannot reach the role lookup", async () => {
  const c = client({ valid: false });
  await assert.rejects(
    () => requirePlatformAdmin(c.value, "verified-by-auth-server"),
    status(401),
  );
  assert.equal(c.reads(), 0);
});
test("valid restaurant user cannot become admin using user-editable metadata", async () => {
  await assert.rejects(
    () =>
      requirePlatformAdmin(
        client({ admin: false }).value,
        "verified-by-auth-server",
      ),
    status(403),
  );
});
test("permission lookup failure denies access and only database admin role passes", async () => {
  await assert.rejects(
    () =>
      requirePlatformAdmin(
        client({ admin: true, dbError: true }).value,
        "verified-by-auth-server",
      ),
    status(403),
  );
  assert.equal(
    await requirePlatformAdmin(
      client({ admin: true }).value,
      "verified-by-auth-server",
    ),
    "user-1",
  );
});
test("request body limit is enforced on actual bytes, even without content-length", async () => {
  await assert.rejects(
    () =>
      readLimitedJson(
        new Request("https://mesa.example/api", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ value: "ñ".repeat(5000) }),
        }),
      ),
    status(413),
  );
  await assert.rejects(
    () =>
      readLimitedJson(
        new Request("https://mesa.example/api", {
          method: "POST",
          headers: { "content-type": "text/plain" },
          body: "{}",
        }),
      ),
    status(415),
  );
  await assert.rejects(
    () =>
      readLimitedJson(
        new Request("https://mesa.example/api", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{broken",
        }),
      ),
    status(400),
  );
  assert.deepEqual(
    await readLimitedJson(
      new Request("https://mesa.example/api", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: '{"action":"delivered"}',
      }),
    ),
    { action: "delivered" },
  );
});
