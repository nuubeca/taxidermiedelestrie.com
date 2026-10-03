"use server";

import { z } from "zod";
import { layout, sendEmail, ORDERS_NOTIFY_EMAIL } from "@/lib/email";

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

  // Honeypot rempli : on répond succès sans rien envoyer.
  if (parsed.data.company) return { success: true, data: undefined };

  const esc = (v: string) => v.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
  const sent = await sendEmail({
    to: ORDERS_NOTIFY_EMAIL,
    replyTo: parsed.data.email,
    subject: `Message du site — ${parsed.data.subject || parsed.data.name}`,
    html: layout(
      "Nouveau message du site",
      `<p style="font-size:15px"><strong>${esc(parsed.data.name)}</strong><br>${esc(parsed.data.email)}</p>
       <p style="font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(parsed.data.message)}</p>`,
    ),
  });

  if (!sent) {
    return { success: false, error: "L'envoi a échoué. Écrivez-nous directement ou téléphonez-nous." };
  }

  return { success: true, data: undefined };
}
