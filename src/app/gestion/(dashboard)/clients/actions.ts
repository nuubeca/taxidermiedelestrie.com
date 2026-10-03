"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fail, ok, type ActionResult } from "@/lib/gestion/action-result";
import { str } from "@/lib/gestion/format";

const ClientSchema = z.object({
  firstName: z.string().trim().max(80),
  lastName: z.string().trim().max(80),
  company: z.string().trim().max(120),
  phone: z.string().trim().max(30),
  address1: z.string().trim().max(160),
  address2: z.string().trim().max(160),
  city: z.string().trim().max(80),
  state: z.string().trim().max(40),
  postcode: z.string().trim().max(12),
});

function read(fd: FormData) {
  return ClientSchema.safeParse({
    firstName: str(fd, "firstName"),
    lastName: str(fd, "lastName"),
    company: str(fd, "company"),
    phone: str(fd, "phone"),
    address1: str(fd, "address1"),
    address2: str(fd, "address2"),
    city: str(fd, "city"),
    state: str(fd, "state"),
    postcode: str(fd, "postcode"),
  });
}

function profileData(d: z.infer<typeof ClientSchema>) {
  const hasAddress = Boolean(d.address1 || d.city || d.postcode);
  return {
    firstName: d.firstName || null,
    lastName: d.lastName || null,
    company: d.company || null,
    phone: d.phone || null,
    shipping: hasAddress
      ? { firstName: d.firstName, lastName: d.lastName, company: d.company, address1: d.address1, address2: d.address2, city: d.city, state: d.state || "QC", postcode: d.postcode, country: "CA", phone: d.phone }
      : Prisma.JsonNull,
  };
}

/** Crée le compte (connexion par code courriel) et sa fiche. */
export async function createClientAccount(_prev: ActionResult<unknown> | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const email = z.string().trim().toLowerCase().email("Courriel invalide.").safeParse(str(fd, "email"));
  if (!email.success) return fail(email.error.issues[0]?.message ?? "Courriel invalide.");
  const parsed = read(fd);
  if (!parsed.success) return fail("Champs invalides.");

  if (await prisma.profile.findUnique({ where: { email: email.data }, select: { id: true } })) {
    return fail("Un client existe déjà avec ce courriel.");
  }
  const { data, error } = await createSupabaseAdminClient().auth.admin.createUser({ email: email.data, email_confirm: true });
  if (error || !data.user) return fail(`Création du compte impossible : ${error?.message ?? "réponse vide"}.`);

  await prisma.profile.create({ data: { id: data.user.id, email: email.data, ...profileData(parsed.data) } });
  revalidatePath("/gestion/clients");
  redirect(`/gestion/clients/${data.user.id}`);
}

export async function updateClient(_prev: ActionResult<unknown> | null, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const parsed = read(fd);
  if (!id || !parsed.success) return fail("Champs invalides.");
  const role = z.enum(["ADMIN", "CUSTOMER"]).safeParse(str(fd, "role") || "CUSTOMER");
  if (!role.success) return fail("Rôle invalide.");
  if (id === admin.id && role.data !== "ADMIN") return fail("Vous ne pouvez pas retirer votre propre accès à la gestion.");

  await prisma.profile.update({ where: { id }, data: { ...profileData(parsed.data), role: role.data } });
  revalidatePath("/gestion/clients");
  revalidatePath(`/gestion/clients/${id}`);
  return ok();
}

/** Bloque ou rétablit la connexion du client (les commandes restent). */
export async function setClientAccess(id: string, blocked: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (id === admin.id) return fail("Vous ne pouvez pas bloquer votre propre compte.");
  const { error } = await createSupabaseAdminClient().auth.admin.updateUserById(id, { ban_duration: blocked ? "876000h" : "none" });
  if (error) return fail(`Modification impossible : ${error.message}.`);
  revalidatePath(`/gestion/clients/${id}`);
  return ok();
}
