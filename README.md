# Mesa · Administración de cartas

Carta digital para varios restaurantes con fotografías, precios, secciones, disponibilidad, destacados y QR permanente.

## Probar localmente

Requiere Node.js 22.6 o posterior.

```sh
npm ci
npm run dev
```

Abre `/acceso` para entrar al panel general o al panel de BRASA. La carta pública de ejemplo está en `/r/brasa`.

Para la demostración local configura `NEXT_PUBLIC_DEMO_MODE=true` en `.env.local`, sin variables Supabase. Sin configuración la aplicación se bloquea: no activa la demo automáticamente. La demo permite entrar sin contraseña; sus cambios persisten en el navegador y se sincronizan entre sus pestañas, pero no entre dispositivos. La subida de fotografías propias requiere Supabase; la demo admite enlaces HTTPS y fotos del catálogo. El servidor local escucha únicamente en `127.0.0.1`.

Para cuentas reales usa `NEXT_PUBLIC_DEMO_MODE=false` y configura Supabase. La demo está prohibida cuando `VERCEL_ENV=production` o `MESA_DEPLOYMENT_ENV=production`. Consulta [SEGURIDAD.md](SEGURIDAD.md) para el alcance de las comprobaciones.

## Funciones

- Crear restaurantes y personalizar nombre, descripción, ubicación, horarios, color y moneda.
- Crear, editar y eliminar platos; precio con dos decimales, descripción, fotografía y alérgenos.
- Añadir, renombrar y ordenar secciones; el cambio de nombre mueve sus platos en una transacción. Para eliminar una sección primero mueve sus platos desde el editor.
- Buscar platos y filtrar por sección, disponibilidad o destacados.
- Duplicar platos como ocultos y ordenar platos dentro de su sección.
- Publicar/despublicar cartas sin cambiar el enlace permanente.
- Descargar y copiar QR/enlace; exportar el contenido de una carta como JSON (exportación, sin importador).
- Separación de permisos entre administración general y encargados de restaurantes.
- Visualización exclusivamente fotográfica, con imagen alternativa si el archivo falla.

## Datos reales

Sigue [CONFIGURACION.md](CONFIGURACION.md). Ejecuta **todas las migraciones en orden**, no solo la inicial. En instalaciones existentes aplica únicamente las pendientes. La migración `20260925172332_menu_management_images.sql` añade las operaciones atómicas de secciones y orden, restringe las subidas a imágenes de 5 MB y elimina las columnas del antiguo visor. No elimina platos, fotografías ni restaurantes. Los antiguos objetos del almacenamiento remoto no se borran automáticamente.

Configura las variables de `.env.example`. La cuenta del administrador inicial se crea en Supabase Authentication; después puedes asignar encargados desde Alta y entrega. Sigue CONFIGURACION.md para la configuración. No incluyas claves secretas en variables públicas.

## Verificación

```sh
npm run typecheck
npm run test:unit
npm run test:security
npm run build
npm run test:smoke
npx playwright install chromium
npm run test:e2e
```

Las pruebas de navegador requieren una compilación en modo demo y cubren escritorio y móvil. Las pruebas de base de datos ejecutan las migraciones en PGlite y verifican aislamiento entre restaurantes, renombrado, eliminación protegida y orden. Auth y subidas a Storage deben comprobarse además en el proyecto Supabase real.

Fuentes de las fotografías: [ASSETS.md](ASSETS.md).

## Alta comercial

El panel general incorpora **Alta y entrega**: datos privados del cliente, acceso del encargado, preparación de carta y entrega de QR/cartel. Los contactos reales se guardan en una tabla protegida por RLS; la gestión de Supabase Auth se ejecuta exclusivamente en el servidor tras verificar la sesión y el rol de administrador general.

Requiere la migración `20260925175146_client_onboarding.sql`, `SUPABASE_SECRET_KEY` solo en el servidor y un dominio público. Consulta CONFIGURACION.md para activación y recuperación. Los accesos de demo son simulados. Referencia comercial y precios sugeridos: [PRECIOS.md](PRECIOS.md).
