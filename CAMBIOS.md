# Revisión de Mesa3D — 19 de septiembre de 2026

## Correcciones

- Incorporada la textura original CC0 faltante de los modelos de hamburguesa, pizza y torta.
- Conservado el menú público sin acceso visible de administración, como en el último paquete de cambios.
- Precios con hasta dos decimales, sin redondeos engañosos.
- Validación de enlaces HTTPS, rutas locales, categorías repetidas y precisión de precios.
- Fotografías con alternativa visual si el archivo no carga.
- Visor 3D con tiempo de espera, fotografía alternativa y botón de reintento. El botón de cámara se habilita solo cuando el visor informa compatibilidad.
- Al cambiar un GLB se descarta el antiguo USDZ para evitar mostrar otro plato en iPhone.
- Ventanas centradas, cierre por teclado y fondo, controles táctiles y ajuste de textos largos.
- En móvil, el modelo aparece primero en el detalle y el cierre de sesión permanece visible.
- Protección ante respuestas de carga atrasadas, actualizaciones simultáneas y cambios de pestaña.
- Sincronización de la demo entre pestañas del mismo navegador y recuperación explícita de datos locales corruptos.
- QR con dominio validado, aviso de modo demo y enlace de comprobación.
- Formularios bloqueados durante el guardado y la subida de archivos, y navegación de pestañas con teclado.
- Código fuente formateado para mantenimiento, pruebas de flujo y guía de configuración.

## Alcance

La carta, paneles y modo demo están implementados. Esta revisión no aplica cambios a una base de datos remota ni publica un nuevo despliegue en Vercel. La comprobación final de Auth, Storage y realidad aumentada física requiere las cuentas y dispositivos del proyecto.
