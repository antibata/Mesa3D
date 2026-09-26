import { ClientOnboarding } from "@/components/client-onboarding";
export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  return <ClientOnboarding id={id}/>;
}
