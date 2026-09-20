# Activar Mesa3D con tus cuentas

La página puede recorrerse sin cuentas en modo demo. Para compartir cambios reales entre los restaurantes y sus clientes, conecta Supabase y Vercel. No envíes contraseñas, secret keys ni claves `service_role` por mensajes ni las guardes en GitHub.

## 1. Supabase

1. Crea un proyecto dedicado a Mesa3D. Guarda su contraseña de base de datos en un gestor de contraseñas; la página no necesita esa contraseña.
2. En SQL Editor, ejecuta **una sola vez** el contenido completo de `supabase/migrations/20260918180438_initial_restaurant_platform.sql`. Si ya lo ejecutaste correctamente, no lo repitas. Esta revisión no cambia ese esquema.
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

1. Importa el repositorio `antibata/Mesa3D` como proyecto Next.js. Usa la raíz del repositorio: allí está `package.json`.
2. Añade estas variables a los entornos donde usarás la plataforma:

   | Variable | Valor |
   | --- | --- |
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
- [ ] Suben correctamente una foto, un GLB y, si se usa, un USDZ a `dish-media`.
- [ ] El QR lleva al dominio definitivo y abre sin cuenta de Vercel.
- [ ] En Android y iPhone se prueban giro, zoom y cámara con navegadores compatibles.
- [ ] El restaurante confirma nombres, fotos, precios, alérgenos y tamaños reales.

Los archivos de `dish-media` son públicos por diseño, incluso cuando la carta está en borrador. Sube solo material destinado al catálogo, nunca documentos privados. La interfaz no incluye cobros ni alta automática de usuarios: las cuentas se habilitan siguiendo los pasos anteriores.

## Qué hacer si aparece un problema

- **Sigue en modo demo:** revisa que ambas variables Supabase estén configuradas y vuelve a desplegar.
- **No se pueden verificar permisos/cargar la carta:** confirma que ejecutaste la migración en el mismo proyecto que indica la URL.
- **No hay restaurante asignado:** comprueba `restaurant_members` y el correo/ID de Authentication.
- **El QR no se genera:** revisa que `NEXT_PUBLIC_SITE_URL` sea solo el dominio HTTPS.
- **El modelo externo no carga:** debe ser accesible mediante HTTPS y permitir su lectura desde tu dominio (CORS). Empaqueta sus texturas dentro del GLB o conserva todas sus rutas relativas.
- **La cámara está deshabilitada:** no todos los equipos/navegadores admiten AR. Prueba el enlace HTTPS en un teléfono compatible; el visor 3D sigue siendo independiente de la cámara.
