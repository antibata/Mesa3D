import { MenuPreview } from "@/components/menu-preview";
export default async function Page({ params }: { params: Promise<{id:string}> }) {
  const {id} = await params;
  return <MenuPreview id={id}/>;
}
