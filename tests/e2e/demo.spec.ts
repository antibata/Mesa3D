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
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
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

test("las fotografías cargan y el diálogo se cierra sin visor tridimensional", async ({
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
    await expect(dialog.locator("img")).toBeVisible();
    await expect(dialog.locator("img")).toHaveJSProperty("complete", true);
    await expect(dialog.locator("img")).not.toHaveJSProperty("naturalWidth", 0);
    await expect(page.locator("model-viewer")).toHaveCount(0);
    const bounds = await dialog.boundingBox();
    expect(bounds?.x).toBeGreaterThanOrEqual(0);
    if (name === "Burger de la casa")
      await page.screenshot({
        path: `test-results/photo-${test.info().project.name}.png`,
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
  await expect(page).toHaveURL(/\/alta$/);
  await page.goto("/panel");
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
  await expect(page.locator(".notice.error")).toContainText(
    "No se pudo recuperar",
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Restablecer demo", exact: true })
    .click();
  await expect(page.locator(".dish-card")).toHaveCount(4);
});

test("gestionar secciones, duplicar y ordenar platos, publicar y exportar", async ({
  page,
}) => {
  await enter(page);
  await page.goto(brasaPanel);
  await page.getByRole("tab", { name: "Secciones", exact: true }).click();
  await page
    .getByRole("button", { name: "Añadir sección", exact: true })
    .click();
  await page.getByLabel("Nombre de la sección").fill("Especiales");
  await page
    .getByRole("button", { name: "Guardar sección", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Renombrar sección Principales", exact: true })
    .click();
  await page.getByLabel("Nombre de la sección").fill("De la parrilla");
  await page
    .getByRole("button", { name: "Guardar sección", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Eliminar sección De la parrilla",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Eliminar sección", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("contiene platos");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page
    .getByRole("button", { name: "Subir sección De la parrilla", exact: true })
    .click();
  await expect(page.locator(".section-row").first()).toContainText(
    "De la parrilla",
  );
  await page.reload();
  await page.getByRole("tab", { name: "Secciones", exact: true }).click();
  await expect(page.locator(".section-row").first()).toContainText(
    "De la parrilla",
  );
  await page.screenshot({
    path: `test-results/sections-${test.info().project.name}.png`,
    fullPage: true,
  });
  await noOverflow(page);
  await page.getByRole("tab", { name: /^Carta/ }).click();
  await page
    .getByRole("combobox", { name: "Sección", exact: true })
    .selectOption("De la parrilla");
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Subir plato Pizza margarita", exact: true })
    .click();
  await expect(page.locator("tbody tr").first()).toContainText(
    "Pizza margarita",
  );
  await page
    .getByRole("button", { name: "Duplicar Pizza margarita", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await expect(
    page.getByRole("switch", {
      name: "Disponibilidad de Pizza margarita (copia)",
      exact: true,
    }),
  ).toHaveAttribute("aria-checked", "false");
  await page.getByLabel("Buscar platos").fill("(copia)");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByLabel("Buscar platos").fill("");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar carta" }).click();
  expect((await download).suggestedFilename()).toBe("carta-brasa.json");
  await page.screenshot({
    path: `test-results/admin-${test.info().project.name}.png`,
    fullPage: true,
  });
  await noOverflow(page);
  await page.goto("/r/brasa");
  await expect(page.locator(".dish-card").first()).toContainText(
    "Pizza margarita",
  );
  await expect(
    page.getByRole("button", {
      name: "Ver Pizza margarita (copia)",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.goto(brasaPanel);
  await page.getByRole("button", { name: "Despublicar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Publicar carta", exact: true }),
  ).toBeVisible();
  await page.goto("/r/brasa");
  await expect(page.getByText("Esta carta no está disponible")).toBeVisible();
  await page.goto(`${brasaPanel}/vista-previa`);
  await expect(page.locator(".notice").filter({hasText:"Vista previa privada."})).toBeVisible();
  await expect(page.locator(".dish-card")).toHaveCount(4);
  await noOverflow(page);
  await page.screenshot({path: `test-results/preview-${test.info().project.name}.png`, fullPage: true});
  await page.getByRole("button", {name:"Salir",exact:true}).click();
  await page.goto(`${brasaPanel}/vista-previa`);
  await expect(page).toHaveURL(/\/acceso$/);
});

test("alta de cliente, acceso, entrega y aislamiento del contacto", async ({page,request})=>{
  await enter(page); await page.goto(`${brasaPanel}/alta`);
  await page.getByLabel('Nombre del contacto',{exact:true}).fill('María Encargada');
  await page.getByLabel('Correo del encargado',{exact:true}).fill('maria@example.com');
  await page.getByLabel('Teléfono de contacto',{exact:true}).fill('+54 11 5555 5555');
  await page.getByRole('button',{name:'Guardar y continuar'}).click();
  await expect(page.getByRole('heading',{name:'Acceso del encargado'})).toBeVisible();
  await page.getByRole('button',{name:'Asignar acceso',exact:true}).click();
  await expect(page.locator('.member-row')).toContainText('maria@example.com');
  await page.reload();
  await expect(page.getByLabel('Nombre del contacto',{exact:true})).toHaveValue('María Encargada');
  await page.getByRole('button',{name:'Acceso',exact:true}).click();
  await expect(page.locator('.member-row')).toHaveCount(1);
  await page.getByRole('button',{name:'Asignar acceso',exact:true}).click();
  await expect(page.locator('.member-row')).toHaveCount(1);
  await page.getByRole('button',{name:'Revocar acceso de maria@example.com',exact:true}).click();
  await page.getByRole('button',{name:'Revocar acceso',exact:true}).click();
  await expect(page.locator('.member-row')).toHaveCount(0);
  await page.getByRole('button',{name:'Entrega',exact:true}).click();
  await expect(page.getByRole('button',{name:'Registrar entrega de prueba'})).toBeDisabled();
  await page.getByRole('button',{name:'Acceso',exact:true}).click();
  await page.getByRole('button',{name:'Asignar acceso',exact:true}).click();
  await expect(page.locator('.member-row')).toHaveCount(1);
  await page.getByRole('button',{name:'Carta',exact:true}).click();
  await expect(page.getByText('4 platos cargados · 4 disponibles')).toBeVisible();
  await page.getByRole('button',{name:'Preparar entrega'}).click();
  const posterDownload=page.waitForEvent('download');
  await page.getByRole('link',{name:'Descargar cartel',exact:true}).click();
  const download=await posterDownload;
  expect(download.suggestedFilename()).toBe('cartel-brasa.svg');
  const posterHref=await page.getByRole('link',{name:'Descargar cartel',exact:true}).getAttribute('href');
  expect(posterHref).toContain('data:image/svg+xml');
  const valid=await page.evaluate(src=>!new DOMParser().parseFromString(decodeURIComponent(src!.split(',')[1]),'image/svg+xml').querySelector('parsererror'),posterHref);
  expect(valid).toBe(true);
  await expect(page.getByLabel('Mensaje de entrega')).toHaveValue(/BRASA[\s\S]*\/r\/brasa[\s\S]*\/acceso/);
  await page.getByRole('button',{name:'Registrar entrega de prueba'}).click();
  await expect(page.getByRole('button',{name:'Entrega registrada',exact:true})).toBeDisabled();
  await page.screenshot({path:`test-results/onboarding-${test.info().project.name}.png`,fullPage:true});
  await noOverflow(page);
  await page.goto('/r/brasa'); await expect(page.getByText('maria@example.com')).toHaveCount(0);
  await enter(page,'Panel del restaurante'); await page.goto(`${brasaPanel}/alta`);
  await expect(page.getByRole('heading',{name:'Acceso reservado a la administración general'})).toBeVisible();
  const endpoint='/api/restaurants/11111111-1111-4111-8111-111111111111/onboarding';
  expect((await request.get(endpoint)).status()).toBe(401);
  expect((await request.post(endpoint,{data:{action:'assign',email:'intruso@example.com'}})).status()).toBe(401);
});

test("sin sesión no entra al panel; la API y las cabeceras bloquean accesos ajenos",async({page,request})=>{
  await page.goto('/panel');await expect(page).toHaveURL(/\/acceso$/);
  await page.goto(`${brasaPanel}/alta`);await expect(page).toHaveURL(/\/acceso$/);
  const login=await request.get('/acceso');
  expect(login.headers()['x-frame-options']).toBe('DENY');
  expect(login.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(login.headers()['content-security-policy']).toContain("object-src 'none'");
  expect(login.headers()['x-robots-tag']).toContain('noindex');
  const endpoint='/api/restaurants/11111111-1111-4111-8111-111111111111/onboarding';
  const anonymous=await request.get(endpoint);
  expect(anonymous.status()).toBe(401);expect(anonymous.headers()['cache-control']).toBe('no-store');
  expect((await request.post(endpoint,{headers:{Origin:'https://evil.example'},data:{action:'assign',email:'evil@example.com'}})).status()).toBe(403);
  await page.goto('/r/brasa');await expect(page.locator('.dish-card')).toHaveCount(4);
});
