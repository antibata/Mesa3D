import { z } from "zod";
export const contactSchema = z.object({
  contact_name: z
    .string()
    .trim()
    .min(2, "Indica el nombre del contacto.")
    .max(100),
  email: z
    .email("Indica un correo válido.")
    .max(254)
    .transform((v) => v.toLowerCase()),
  phone: z.string().trim().max(40),
});
export type ClientContact = z.infer<typeof contactSchema> & {
  delivered_at: string | null;
};
export type ClientMember = {
  user_id: string;
  email: string;
  confirmed: boolean;
};
export type OnboardingData = {
  client: ClientContact | null;
  members: ClientMember[];
};
export const onboardingDataSchema = z.object({
  client: contactSchema.extend({ delivered_at: z.iso.datetime().nullable() }).nullable(),
  members: z.array(z.object({ user_id: z.uuid(), email: z.email(), confirmed: z.boolean() })),
});
export const onboardingActionSchema = z.discriminatedUnion("action", [
  contactSchema.extend({ action: z.literal("contact") }),
  z.object({
    action: z.literal("assign"),
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
  }),
  z.object({ action: z.literal("revoke"), user_id: z.uuid() }),
  z.object({ action: z.literal("delivered") }),
]);
export function deliveryMessage(name: string, menu: string, access: string) {
  return `¡Hola! La carta digital de ${name} está lista.\n\nCarta para tus clientes: ${menu}\nPanel de administración: ${access}\n\nDesde el panel podés cambiar precios, fotos, secciones y disponibilidad. El QR mantiene siempre el mismo enlace.\n\nTe entrego el QR y el cartel para imprimir. Revisá los platos, precios y alérgenos antes de colocarlo en las mesas. El enlace de activación de tu cuenta se comparte por separado y es personal.`;
}
