"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const EmailSchema = z.string().trim().toLowerCase().email("Adresse courriel invalide.");
const CodeSchema = z.string().trim().regex(/^\d{6}$/, "Le code doit contenir 6 chiffres.");

function safeNext(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

/** Étape 1 : envoie un code à 6 chiffres. Crée le compte s'il n'existe pas encore. */
export async function requestLoginCode(
  _prev: ActionResult<{ email: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ email: string }>> {
  const parsed = EmailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Courriel invalide." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: true },
  });

  if (error) {
    if (error.status === 429) return { success: false, error: "Trop de tentatives. Réessayez dans quelques minutes." };
    return { success: false, error: "Impossible d'envoyer le code. Vérifiez l'adresse et réessayez." };
  }

  return { success: true, data: { email: parsed.data } };
}

/** Étape 2 : vérifie le code puis redirige. */
export async function verifyLoginCode(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = EmailSchema.safeParse(formData.get("email"));
  const code = CodeSchema.safeParse(formData.get("code"));
  if (!email.success) return { success: false, error: "Courriel invalide." };
  if (!code.success) return { success: false, error: code.error.issues[0]?.message ?? "Code invalide." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ email: email.data, token: code.data, type: "email" });

  if (error) return { success: false, error: "Code invalide ou expiré. Demandez un nouveau code." };

  redirect(safeNext(formData.get("next")) ?? "/mon-compte");
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
