"use client";
import Link from "next/link";
import { Workspace } from "./workspace";
import { MenuPage } from "./menu";
import { Notice } from "./ui";
export function MenuPreview({ id }: { id: string }) {
  return (
    <Workspace title="Vista previa">
      <Link className="back-link" href={`/panel/restaurantes/${id}`}>
        Volver a administrar la carta
      </Link>
      <Notice>
        Vista previa privada. Solo se muestran los platos disponibles; puedes
        revisar la carta aunque esté en borrador.
      </Notice>
      <div className="private-preview">
        <MenuPage previewId={id} />
      </div>
    </Workspace>
  );
}
