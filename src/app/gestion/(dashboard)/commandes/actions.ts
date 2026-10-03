"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const StatusSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  status: z.enum(["RECEIVED", "PROCESSING", "COMPLETED", "CANCELLED"]),
});

export async function updateOrderStatus(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = StatusSchema.safeParse({ orderId: formData.get("orderId"), status: formData.get("status") });
  if (!parsed.success) return { success: false, error: "Statut invalide." };

  await prisma.order.update({
    where: { id: parsed.data.orderId },
    data: {
      status: parsed.data.status,
      notes: { create: { author: admin.email, content: `Statut changé pour ${parsed.data.status}.` } },
    },
  });
  revalidatePath(`/gestion/commandes/${parsed.data.orderId}`);
  revalidatePath("/gestion/commandes");
  return { success: true, data: undefined };
}

const NoteSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  content: z.string().trim().min(1, "Note vide.").max(2000),
  isCustomerVisible: z.boolean(),
});

export async function addOrderNote(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = NoteSchema.safeParse({
    orderId: formData.get("orderId"),
    content: formData.get("content"),
    isCustomerVisible: formData.get("isCustomerVisible") === "on",
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Note invalide." };

  await prisma.orderNote.create({
    data: { orderId: parsed.data.orderId, author: admin.email, content: parsed.data.content, isCustomerVisible: parsed.data.isCustomerVisible },
  });
  revalidatePath(`/gestion/commandes/${parsed.data.orderId}`);
  return { success: true, data: undefined };
}
