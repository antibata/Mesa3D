# Mesa3D

Plataforma de cartas digitales para varios restaurantes. Cada restaurante tiene un enlace y QR permanente, menú propio, precios, categorías y modelos 3D reemplazables. La carta pública se puede abrir sin cuenta; la administración utiliza permisos separados.

**Tecnologías:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, `<model-viewer>` 4, Supabase (PostgreSQL, Auth y Storage) y Vercel.

## Probar la demostración

Requiere Node.js 22.6 o posterior (recomendado: la versión LTS disponible en Vercel).

```bash
npm ci
npm run dev
```

- Carta de ejemplo: `http://localhost:3000/r/brasa`
- Accesos de prueba: `http://localhost:3000/acceso`
- Panel general: desde «Accesos de prueba», elegir «Panel general».
- Panel de restaurante: elegir «Panel del restaurante» (solo administra BRASA).

Sin variables de Supabase, el proyecto funciona en **modo demostración**. Los cambios se guardan en el `localStorage` del navegador y no se comparten con otros dispositivos. Puedes restablecer el contenido de ejemplo desde el panel. Esta modalidad no debe emplearse para menús reales.

En el menú aparecen cuatro modelos 3D predeterminados. El aguacate tiene textura pintada y los de hamburguesa, pizza y torta son estilizados. Todas las fotos, porciones, alérgenos y precios de ejemplo deben revisarse con cada restaurante antes de su carta final.

## Conectar Supabase para usar cuentas y datos compartidos

1. Crea un proyecto nuevo de Supabase dedicado a esta plataforma. **No reutilices una base de datos de otro proyecto.** Ejecuta `supabase/migrations/20260918180438_initial_restaurant_platform.sql` desde el SQL Editor, o usa Supabase CLI con el proyecto vinculado. Si quieres los dos restaurantes de prueba, ejecuta después `supabase/seed.sql`.
2. Crea las dos cuentas de administradores desde Authentication → Users. Registra cada ID de usuario como administrador general desde el SQL Editor:

   ```sql
   insert into public.platform_admins (user_id)
   select id from auth.users where email = 'correo-del-administrador@ejemplo.com';
   ```

   Repite el comando para el segundo administrador con su correo. Las contraseñas se configuran en Supabase; **no se guardan en el código**.
3. Para un restaurante, crea su cuenta desde Authentication → Users, y asígnale acceso a su propio menú:

   ```sql
   insert into public.restaurant_members (restaurant_id, user_id)
   select r.id, u.id
   from public.restaurants r cross join auth.users u
   where r.slug = 'brasa' and u.email = 'encargado@ejemplo.com';
   ```

4. Copia `.env.example` a `.env.local` e indica la URL y la **publishable key** de Supabase. Necesitas ambas. Nunca pongas la secret key ni la antigua `service_role` en una variable `NEXT_PUBLIC_`.
5. Ejecuta `npm run build`, `npm run dev`. Comprueba con dos cuentas que cada restaurante ve y modifica únicamente sus datos. El esquema incluye políticas RLS para menús, integrantes, platos y archivos.

El panel permite subir imágenes JPEG/PNG/WebP y archivos GLB/USDZ a Supabase Storage; para los modelos alojados fuera de Supabase usa enlaces HTTPS que permitan peticiones del navegador. Los modelos GLB deben estar a escala física correcta para que la realidad aumentada represente el plato con fidelidad. En iPhone, Quick Look puede generar USDZ automáticamente; un USDZ preparado permite controlar mejor el resultado. La realidad aumentada depende del celular y su navegador.

## Desplegar en Vercel

1. Sube este proyecto a un repositorio propio de GitHub y conéctalo a Vercel como proyecto **Next.js**. El código se compila con `npm run build`.
2. Configura `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `NEXT_PUBLIC_SITE_URL` con tu dominio HTTPS definitivo. Si aún no conectaste Supabase, publica únicamente una demostración; el panel señalará que los cambios son locales.
3. Abre la carta en un teléfono Android y en un iPhone para comprobar carga, giro, zoom y disponibilidad de AR. Genera y descarga los QR definitivos una vez configurado el dominio; así los QR impresos conservarán su destino.

## Verificación

```bash
npm run typecheck
npm run test:unit
npm run test:assets
npm run build
npm run test:security
npm run test:smoke
npx playwright install chromium
npm run test:e2e
```

`test:security` ejecuta la migración en PGlite, simula usuarios anónimos, administradores y encargados de dos restaurantes y comprueba el aislamiento de sus datos. `test:smoke` verifica que el servidor de producción entregue las páginas y los cuatro archivos GLB. **Esto no sustituye una prueba final de Auth y Storage en un proyecto real de Supabase ni una revisión visual en Android y iPhone**.

`test:assets` también comprueba las texturas externas referenciadas por los GLB. Se ejecuta automáticamente antes de compilar para evitar modelos incompletos. `test:e2e` recorre la demo en escritorio y móvil: categorías, modelos, edición, disponibilidad, borradores, QR, accesos, errores de carga y sincronización de pestañas. Compila **sin variables Supabase** para estas pruebas; el recorrido se detiene si detecta el acceso de cuentas reales. La emulación móvil no comprueba la cámara física ni ARKit/ARCore.

La guía paso a paso para conectar tus cuentas está en [CONFIGURACION.md](CONFIGURACION.md). El historial de esta revisión está en [CAMBIOS.md](CAMBIOS.md).

## Licencias y atribuciones

Las fuentes y licencias de los recursos predeterminados están en [ASSETS.md](ASSETS.md). Los cuatro modelos se distribuyen bajo CC0; las fotografías de menú de Unsplash son ilustrativas. Conserva el archivo de licencia de Kenney y la referencia a las fuentes cuando reutilices el paquete.
