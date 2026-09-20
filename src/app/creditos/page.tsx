import { Brand } from "@/components/ui";
import Link from "next/link";
export default function Credits() {
  return (
    <main className="credits">
      <Brand />
      <h1>Créditos de los recursos</h1>
      <p>
        Los restaurantes y sus cartas de demostración son ficticios. Las
        fotografías, los precios, los alérgenos y los tamaños de los modelos son
        ejemplos y deben ser reemplazados o confirmados por cada restaurante.
      </p>
      <h2>Modelos 3D de demostración</h2>
      <p>
        Avocado de Microsoft, distribuido por{" "}
        <a href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Avocado">
          Khronos glTF Sample Assets
        </a>{" "}
        bajo{" "}
        <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0 1.0</a>
        . Burger, pizza y torta del{" "}
        <a href="https://kenney.nl/assets/food-kit">Food Kit de Kenney</a>,
        también CC0. Son modelos de ejemplo; no representan las porciones del
        restaurante.
      </p>
      <h2>Fotografías</h2>
      <p>
        Fotografías ilustrativas procedentes de Unsplash, usadas conforme a su{" "}
        <a href="https://unsplash.com/license">licencia</a>. Las fuentes exactas
        se conservan en ASSETS.md dentro del proyecto.
      </p>
      <h2>Tecnología</h2>
      <p>
        Visor interactivo con{" "}
        <a href="https://modelviewer.dev/">model-viewer</a>. Interfaz construida
        con Next.js, React, TypeScript y Tailwind CSS. Integración de datos,
        cuentas y archivos con Supabase.
      </p>
      <Link className="back-link" href="/">
        Volver al inicio
      </Link>
    </main>
  );
}
