# Revisión de seguridad · 25 de septiembre de 2026

## ¿Puede alguien entrar al administrador?

La demo local permite entrar sin contraseña y modificar datos simulados de su navegador. No debe utilizarse con clientes reales. El servidor local escucha ahora solo en 127.0.0.1; esto no impide el acceso de otras personas con acceso a ese equipo.

En modo real, cualquiera puede visitar la dirección de acceso. Administrar requiere una sesión válida y permisos registrados en la base de datos. La protección de datos reside en la autorización de la API y las políticas RLS, no en ocultar la URL ni en la redirección del navegador.

## Cambios aplicados

- La demo requiere activación explícita; una configuración ausente o incompleta bloquea el arranque. Se rechaza demo en producción identificada por Vercel o MESA_DEPLOYMENT_ENV.
- Se rechazan claves secretas y JWT service_role en la configuración pública.
- La API de altas verifica el usuario con Supabase y su rol en platform_admins. Los metadatos editables del usuario no otorgan permisos. Los errores de comprobación deniegan acceso.
- Las escrituras de altas rechazan orígenes ajenos y cuerpos JSON mayores de 8 KB, incluso sin Content-Length.
- Las cuentas sin restaurantes asignados no acceden al espacio de administración.
- Cabeceras contra incrustación en otras páginas, restricciones de recursos mediante CSP y exclusión de indexación/referencias en rutas de acceso y administración.

## Evidencia y límites

Compilación correcta; 15 pruebas unitarias, 41 comprobaciones locales de RLS y 16 pruebas de navegador en escritorio/móvil aprobadas. Incluyen aislamiento de restaurantes, denegación de escalada de permisos, revocación, sesiones inválidas y solicitudes de origen ajeno. npm audit no reportó vulnerabilidades conocidas durante la revisión; esto no demuestra ausencia de vulnerabilidades.

Las pruebas de RLS usan PGlite y las pruebas de navegador usan demo. No se ha verificado un despliegue de producción ni Supabase Auth real: sigue pendiente conectar el backend y comprobar inicio de sesión, activación, recuperación, revocación y permisos con cuentas reales.

La CSP mantiene scripts inline para la hidratación de Next.js; no garantiza bloquear todo XSS. No se ha implementado MFA ni un limitador propio de intentos. Antes de publicar, revisa los límites de Auth y la configuración de correo en Supabase. Los archivos del catálogo en dish-media son públicos: no subir documentos privados. Esta revisión no es una certificación ni una auditoría de penetración completa.

Referencias: [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), [límites de Supabase Auth](https://supabase.com/docs/guides/auth/rate-limits).
