"use server";

import { z } from "zod";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const ContactSchema = z.object({
  name: z.string().min(2, "Veuillez indiquer votre nom.").max(120),
  email: z.string().email("Adresse courriel invalide."),
  subject: z.string().max(160).optional(),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères.").max(4000),
  // Honeypot — must remain empty
  company: z.string().max(0).optional(),
});

export async function sendContactMessage(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject") ?? "",
    message: formData.get("message"),
    company: formData.get("company") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  // TODO: brancher l'envoi réel (SMTP / Resend / etc.) — log pour l'instant
  console.log("[contact] new message", {
    from: parsed.data.email,
    name: parsed.data.name,
    subject: parsed.data.subject,
    messagePreview: parsed.data.message.slice(0, 80),
  });

  return { success: true, data: undefined };
}
