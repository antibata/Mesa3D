import { test, expect, type Page } from "@playwright/test";

const brasaPanel = "/panel/restaurantes/11111111-1111-4111-8111-111111111111";
async function enter(page: Page, name = "Panel general") {
  await page.goto("/acceso");
  // Refuse to exercise mutation flows against real Supabase accounts.
  await expect(page.getByText("Explora la plataforma")).toBeVisible();
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await expect(page).toHaveURL(/\/panel$/);
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    ),
  ).toBe(true);
}

test("carta, categorías, menú desconocido y sin enlaces de administración", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/r/brasa");
  await expect(page.getByRole("heading", { name: "BRASA." })).toBeVisible();
  await expect(page.locator(".dish-card")).toHaveCount(4);
  await expect(page.getByRole("link", { name: /Administrar/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Principales", exact: true }).click();
  await expect(page.locator(".dish-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Bebidas", exact: true }).click();
  await expect(page.getByText("Estamos preparando esta sección")).toBeVisible();
  await page.getByRole("button", { name: "Toda la carta" }).click();
  await noOverflow(page);
  await page.screenshot({
    path: `test-results/menu-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.goto("/r/no-existe");
  await expect(page.getByText("Esta carta no está disponible")).toBeVisible();
  expect(errors).toEqual([]);
});

test("los cuatro modelos cargan con sus texturas y el diálogo se cierra", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/r/brasa");
  for (const name of [
    "Palta de estación",
    "Burger de la casa",
    "Pizza margarita",
    "Postre de chocolate",
  ]) {
    await page
      .getByRole("button", { name: `Ver ${name}`, exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Restablecer vista 3D" }),
    ).toBeEnabled({ timeout: 30000 });
    await expect(page.locator("model-viewer")).toHaveJSProperty("loaded", true);
    const bounds = await dialog.boundingBox();
    expect(bounds?.x).toBeGreaterThanOrEqual(0);
    if (name === "Burger de la casa")
      await page.screenshot({
        path: `test-results/model-${test.info().project.name}.png`,
      });
    await page.getByRole("button", { name: "Cerrar ventana" }).click();
    await expect(dialog).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("crear, editar, ocultar y eliminar un plato; precio decimal persistente", async ({
  page,
}) => {
  await enter(page);
  await page.goto(brasaPanel);
  await page.getByRole("button", { name: "Añadir plato", exact: true }).click();
  await page
    .getByLabel("Nombre del plato", { exact: true })
    .fill("Plato de prueba");
  await page.getByLabel("Precio (ARS)", { exact: true }).fill("12.50");
  await page
    .getByRole("button", { name: "Guardar plato", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("Plato guardado.", { exact: false }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("row").filter({ hasText: "Plato de prueba" }),
  ).toContainText("12,50");
  await page
    .getByRole("button", { name: "Editar Plato de prueba", exact: true })
    .click();
  await page
    .getByLabel("Nombre del plato", { exact: true })
    .fill("Plato actualizado");
  await page
    .getByRole("button", { name: "Guardar plato", exact: true })
    .click();
  await page
    .getByRole("switch", { name: "Disponibilidad de Plato actualizado" })
    .click();
  await expect(
    page.getByRole("switch", { name: "Disponibilidad de Plato actualizado" }),
  ).toHaveAttribute("aria-checked", "false");
  await page.goto("/r/brasa");
  await expect(page.getByRole("heading", { name: "BRASA." })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ver Plato actualizado" }),
  ).toHaveCount(0);
  await page.goto(brasaPanel);
  await page
    .getByRole("button", { name: "Eliminar Plato actualizado", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Eliminar plato", exact: true })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "Plato actualizado" }),
  ).toHaveCount(0);
  await noOverflow(page);
});

test("crear restaurante, publicar, QR, enlace permanente y acceso limitado", async ({
  page,
}) => {
  await enter(page);
  await page
    .getByRole("button", { name: "Nuevo restaurante", exact: true })
    .click();
  await page
    .getByLabel("Nombre del restaurante", { exact: true })
    .fill("Prueba restaurante");
  await page
    .getByLabel("Enlace de la carta", { exact: false })
    .fill("prueba-restaurante");
  await page.getByLabel("Carta publicada y visible por QR").check();
  await page
    .getByRole("button", { name: "Crear restaurante", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .locator(".restaurant-card")
    .filter({ hasText: "Prueba restaurante" })
    .getByRole("link", { name: "Administrar carta" })
    .click();
  await page.getByRole("tab", { name: "Identidad", exact: true }).click();
  await expect(
    page.getByLabel("Enlace de la carta", { exact: false }),
  ).toBeDisabled();
  await page.getByRole("tab", { name: "Código QR", exact: true }).click();
  await expect(
    page.getByRole("img", {
      name: "Código QR para la carta de Prueba restaurante",
    }),
  ).toBeVisible();
  await expect(page.locator(".url-box")).toContainText("/r/prueba-restaurante");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Descargar QR" }).click();
  expect((await download).suggestedFilename()).toBe(
    "qr-prueba-restaurante.png",
  );
  await noOverflow(page);
  await page.getByRole("button", { name: "Salir", exact: true }).click();
  await expect(page).toHaveURL(/\/acceso$/);
  await enter(page, "Panel del restaurante");
  await expect(page.locator(".restaurant-card")).toHaveCount(1);
  await page.goto("/panel/restaurantes/22222222-2222-4222-8222-222222222222");
  await expect(page.getByText("Restaurante no disponible")).toBeVisible();
});

test("modelo roto muestra foto y permite reintentar", async ({ page }) => {
  await page.route("**/models/burger.glb", (route) =>
    route.fulfill({ status: 404, body: "Missing test model" }),
  );
  await page.goto("/r/brasa");
  await page
    .getByRole("button", { name: "Ver Burger de la casa", exact: true })
    .click();
  await expect(page.getByText("No pudimos cargar el modelo 3D.")).toBeVisible();
  await page.unroute("**/models/burger.glb");
  await page
    .getByRole("button", { name: "Reintentar 3D", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Restablecer vista 3D" }),
  ).toBeEnabled({ timeout: 30000 });
});

test("cambios de demo se sincronizan entre pestañas y se recupera almacenamiento corrupto", async ({
  page,
  context,
}) => {
  await page.goto("/r/brasa");
  const other = await context.newPage();
  await enter(other);
  await other.goto(brasaPanel);
  await other
    .getByRole("switch", { name: "Disponibilidad de Burger de la casa" })
    .click();
  await expect(
    page.getByRole("button", { name: "Ver Burger de la casa", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() =>
    localStorage.setItem("mesa3d-demo-v1", "{invalid-json"),
  );
  await page.reload();
  await expect(page.locator('.notice.error')).toContainText("No se pudo recuperar");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Restablecer demo", exact: true })
    .click();
  await expect(page.locator(".dish-card")).toHaveCount(4);
});
