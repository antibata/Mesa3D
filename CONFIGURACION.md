# Activar Mesa con tus cuentas

La página puede recorrerse sin cuentas en modo demo. Para compartir cambios reales entre los restaurantes y sus clientes, conecta Supabase y Vercel. No envíes contraseñas, secret keys ni claves `service_role` por mensajes ni las guardes en GitHub.

## 1. Supabase

1. Crea un proyecto dedicado a Mesa. Guarda su contraseña de base de datos en un gestor de contraseñas; la página no necesita esa contraseña.
2. En SQL Editor, ejecuta **una sola vez** el contenido completo de `supabase/migrations/20260918180438_initial_restaurant_platform.sql`. Si ya lo ejecutaste correctamente, no lo repitas. Después ejecuta la migración pendiente `supabase/migrations/20260925172332_menu_management_images.sql`. Añade gestión atómica de secciones y orden y elimina las columnas del antiguo visor, conservando platos y fotos. Después ejecuta `supabase/migrations/20260925175146_client_onboarding.sql` para altas y contactos privados. En una instalación nueva ejecuta las tres migraciones en orden antes del seed.
3. Opcional: ejecuta `supabase/seed.sql` para cargar BRASA y VERDE. Son ejemplos, no cartas listas para clientes reales.
4. En Authentication → Users crea tu usuario con correo y contraseña. Para habilitar tu panel general, ejecuta esto reemplazando el correo:

   ```sql
   insert into public.platform_admins (user_id)
   select id from auth.users where email = 'TU_CORREO'
   on conflict do nothing;
   ```

   Repite con el correo de tu socio si tendrá acceso general. Verifica que cada correo exista y que se haya insertado una fila. Si insertó cero filas, revisa el correo en Authentication.

5. Conserva la **Project URL** y la **publishable key**. La publishable key se usa en el navegador; las políticas RLS restringen los datos que puede leer o cambiar cada cuenta. No desactives RLS.

## 2. Vercel

1. Importa el repositorio `antibata/Mesa` como proyecto Next.js. Usa la raíz del repositorio: allí está `package.json`.
2. Añade estas variables a los entornos donde usarás la plataforma:

   | Variable | Valor |
   | --- | --- |
   | `NEXT_PUBLIC_DEMO_MODE` | `false` para cuentas reales |
   | `NEXT_PUBLIC_SUPABASE_URL` | La Project URL de Supabase: `https://TU_PROYECTO.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | La publishable key, nunca una secret key |
   | `NEXT_PUBLIC_SITE_URL` | El dominio HTTPS definitivo, por ejemplo `https://tu-proyecto.vercel.app` |

3. No incluyas `/r/brasa`, rutas ni parámetros en `NEXT_PUBLIC_SITE_URL`. Si cambias estas variables, crea un nuevo despliegue: son valores incluidos durante la compilación.
4. Abre `/acceso`. Con las dos variables Supabase configuradas debe aparecer el formulario de correo y contraseña, **no** los botones de acceso demo.
5. Abre la carta publicada desde una ventana de incógnito sin sesión de Vercel. Si solicita iniciar sesión en Vercel, el despliegue no sirve todavía como enlace público para clientes: revisa su protección de acceso en tu cuenta.

No imprimas los QR hasta fijar el dominio definitivo y verificarlo desde otro teléfono. Cambiar el dominio después de imprimir requiere conservar el dominio anterior con una redirección o reimprimir los QR.

## 3. Dar acceso a un restaurante

1. Entra en `/acceso` con tu cuenta general y crea el restaurante; su enlace se mantendrá fijo.
2. Crea la cuenta de su encargado en Supabase Authentication. No uses la cuenta del encargado como administrador general.
3. Asigna esa cuenta al restaurante (reemplaza ambos valores):

   ```sql
   insert into public.restaurant_members (restaurant_id, user_id)
   select r.id, u.id
   from public.restaurants r cross join auth.users u
   where r.slug = 'ENLACE_DEL_RESTAURANTE'
     and u.email = 'CORREO_DEL_ENCARGADO'
   on conflict do nothing;
   ```

4. Abre otra ventana de incógnito, entra con la cuenta del encargado y confirma que solo puede administrar su restaurante.

## 4. Lista previa a la primera demostración comercial

- [ ] El panel indica cuentas reales, sin aviso de demo local.
- [ ] Crear un plato y cambiar su precio se refleja en otro dispositivo al volver a abrir la carta.
- [ ] Ocultar el plato lo quita del menú público.
- [ ] Una carta en borrador no se puede consultar públicamente.
- [ ] El encargado de BRASA no puede modificar VERDE usando su URL directa.
- [ ] Suben correctamente fotografías JPG, PNG y WebP de hasta 5 MB a `dish-media`.
- [ ] El QR lleva al dominio definitivo y abre sin cuenta de Vercel.
- [ ] En Android y iPhone se prueban categorías, fotografías y detalle de platos.
- [ ] El restaurante confirma nombres, fotos, precios y alérgenos.

Los archivos de `dish-media` son públicos por diseño, incluso cuando la carta está en borrador. Sube solo material destinado al catálogo, nunca documentos privados. La interfaz no incluye cobros ni alta automática de usuarios: las cuentas se habilitan siguiendo los pasos anteriores.

## Qué hacer si aparece un problema

- **Demo o configuración bloqueada:** usa `NEXT_PUBLIC_DEMO_MODE=false` y ambas variables Supabase para cuentas reales; vuelve a desplegar. Solo para pruebas locales sin Supabase usa `NEXT_PUBLIC_DEMO_MODE=true`.
- **No se pueden verificar permisos/cargar la carta:** confirma que ejecutaste la migración en el mismo proyecto que indica la URL.
- **No hay restaurante asignado:** comprueba `restaurant_members` y el correo/ID de Authentication.
- **El QR no se genera:** revisa que `NEXT_PUBLIC_SITE_URL` sea solo el dominio HTTPS.
- **No se guardan secciones u orden:** aplica la nueva migración y recarga la carta para descartar cambios simultáneos.

## Alta y entrega de clientes desde el panel

1. Crea un restaurante desde `/panel`. Se abrirá automáticamente **Alta y entrega**.
2. Guarda nombre, correo y teléfono del contacto. Son datos privados de la administración general.
3. En **Acceso**, asigna el correo del encargado. Si es una cuenta nueva se crea una invitación y se muestra un enlace personal: cópialo y compártelo de forma privada. No se envían correos automáticamente desde esta pantalla. Si la cuenta ya está activada, se conserva su contraseña y solo se asigna el restaurante.
4. El encargado abre `/activar` mediante el enlace y elige su contraseña. Un enlace vencido para una cuenta pendiente puede regenerarse asignando nuevamente el mismo correo. Una cuenta activada recupera su contraseña desde `/recuperar`.
5. En **Carta**, carga platos y secciones, revisa la vista previa y publica.
6. En **Entrega**, descarga el QR PNG y el cartel SVG, copia el mensaje de entrega y comparte los archivos. **Marcar como entregada** registra tu confirmación; no envía mensajes.
7. Puedes revocar un acceso a ese restaurante sin borrar la cuenta ni afectar otros restaurantes. Los permisos globales de administradores se gestionan separadamente.

### Configuración necesaria para cuentas reales

- Aplica todas las migraciones pendientes, incluida `supabase/migrations/20260925175146_client_onboarding.sql`.
- Añade `SUPABASE_SECRET_KEY` a las variables del **servidor**. Puede ser la secret key de Supabase o una service_role heredada. Nunca uses el prefijo `NEXT_PUBLIC_` ni publiques esta clave.
- Configura `NEXT_PUBLIC_SITE_URL` con el dominio HTTPS definitivo antes de generar invitaciones y códigos QR.
- En Supabase Auth configura Site URL y permite `https://TU_DOMINIO/activar` como Redirect URL para recuperación de contraseña. Usa un servicio SMTP de producción y comprueba la recepción de correos de recuperación.
- Las invitaciones generadas manualmente se comparten como enlaces privados de un solo uso. No se guardan en localStorage ni en contactos y llevan el token en el fragmento para evitar incluirlo en solicitudes al servidor de esta aplicación.
- Prueba con un correo nuevo y otro existente: asignación, activación, inicio de sesión, recuperación y revocación. Las pruebas locales cubren RLS y demo; no reemplazan estas verificaciones sobre Supabase Auth real.

Con demo explícitamente activada, **Alta y entrega** permite recorrer los pasos con contactos y accesos simulados. No se crean cuentas, no se generan enlaces de activación reales y ninguna entrega local debe usarse con un cliente real.

### Seguridad del despliegue

La compilación rechaza demo y Supabase juntos, configuración incompleta y claves privilegiadas en la variable pública. Vercel identifica producción mediante `VERCEL_ENV`; en alojamiento propio configura `MESA_DEPLOYMENT_ENV=production` tanto al compilar como al iniciar. El comando `npm run start` escucha en `127.0.0.1`, adecuado detrás de un proxy local. Si tu plataforma necesita otra interfaz, configúrala explícitamente al iniciar Next y mantén HTTPS en el proxy.

La dirección `/acceso` es pública por diseño. Conocerla no otorga permisos: la API verifica sesión y rol, y la base de datos aplica RLS. Las redirecciones del navegador y `noindex` no sustituyen estos controles. Antes de vender, verifica autenticación, revocación y aislamiento con dos cuentas reales en el proyecto desplegado. Consulta [SEGURIDAD.md](SEGURIDAD.md).

### Compilación local dentro de OneDrive

Si Windows bloquea archivos de la caché `.next`, puedes usar otra carpeta de salida sin borrar archivos. En PowerShell ejecuta `$env:MESA_BUILD_DIR='.next-verified'` antes de `npm run build`, `npm run start` y las pruebas. También puedes guardar `MESA_BUILD_DIR=.next-verified` en `.env.local` para mantener esa elección. Las carpetas `.next-*` están excluidas de Git.
