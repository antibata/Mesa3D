import { Brand } from "@/components/ui";
import Link from "next/link";
export default function Credits() {
  return (
    <main className="credits">
      <Brand />
      <h1>Créditos de los recursos</h1>
      <p>
        Los restaurantes y sus cartas de demostración son ficticios. Las
        fotografías, los precios y los alérgenos son
        ejemplos y deben ser reemplazados o confirmados por cada restaurante.
      </p>
      <h2>Fotografías</h2>
      <p>
        Fotografías ilustrativas procedentes de Unsplash, usadas conforme a su{" "}
        <a href="https://unsplash.com/license">licencia</a>. Las fuentes exactas
        se conservan en ASSETS.md dentro del proyecto.
      </p>
      <h2>Tecnología</h2>
      <p>
        Interfaz construida con Next.js, React, TypeScript y Tailwind CSS. Integración de datos,
        cuentas y archivos con Supabase.
      </p>
      <Link className="back-link" href="/">
        Volver al inicio
      </Link>
    </main>
  );
}
