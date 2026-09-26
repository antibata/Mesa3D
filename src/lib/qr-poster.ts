const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export function qrPoster(
  name: string,
  accent: string,
  url: string,
  qrSvg: string,
) {
  const color = /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : "#c84924";
  const lines = name.match(/.{1,32}(?:\s|$)|.{1,32}/gu) ?? [name];
  const title = lines
    .slice(0, 3)
    .map(
      (line, i) =>
        `<text x="600" y="${155 + i * 60}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="48" fill="#20241f">${escape(line.trim())}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600"><rect width="1200" height="1600" fill="white"/><rect width="1200" height="28" fill="${color}"/>${title}<text x="600" y="350" text-anchor="middle" font-family="Arial,sans-serif" font-size="36" fill="${color}">Nuestra carta, en tu celular</text>${qrSvg.replace("<svg ", '<svg x="190" y="410" width="820" height="820" ')}<text x="600" y="1320" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" fill="#20241f">Escanea el QR con la cámara</text><text x="600" y="1380" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="#596151">Fotos, platos y precios siempre actualizados.</text><text x="600" y="1460" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#596151">${escape(url)}</text><text x="600" y="1530" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#596151">¿Necesitas ayuda? Consulta con nuestro equipo.</text></svg>`;
}
