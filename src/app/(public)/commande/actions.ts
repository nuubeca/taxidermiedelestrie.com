"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { customerOrderEmail, staffOrderEmail, sendEmail, ORDERS_NOTIFY_EMAIL, type OrderEmailLine } from "@/lib/email";
import { nextOrderNumber } from "@/lib/orders/format";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const LineSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().nullable(),
  quantity: z.number().int().min(1).max(999),
});

const OrderSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis.").max(80),
  lastName: z.string().trim().min(1, "Nom requis.").max(80),
  company: z.string().trim().max(120).optional(),
  phone: z.string().trim().min(7, "Téléphone requis.").max(30),
  fulfillment: z.enum(["PICKUP", "DELIVERY"]),
  address1: z.string().trim().max(160).optional(),
  address2: z.string().trim().max(160).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(40).optional(),
  postcode: z.string().trim().max(12).optional(),
  customerNote: z.string().trim().max(2000).optional(),
  saveAddress: z.boolean(),
  lines: z.array(LineSchema).min(1, "Votre panier est vide."),
});

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

export async function placeOrder(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Veuillez vous connecter pour envoyer votre commande." };

  let rawLines: unknown = [];
  try {
    rawLines = JSON.parse(str(formData.get("lines")) || "[]");
  } catch {
    return { success: false, error: "Panier illisible. Rechargez la page." };
  }

  const parsed = OrderSchema.safeParse({
    firstName: str(formData.get("firstName")),
    lastName: str(formData.get("lastName")),
    company: str(formData.get("company")),
    phone: str(formData.get("phone")),
    fulfillment: str(formData.get("fulfillment")) || "PICKUP",
    address1: str(formData.get("address1")),
    address2: str(formData.get("address2")),
    city: str(formData.get("city")),
    state: str(formData.get("state")) || "QC",
    postcode: str(formData.get("postcode")),
    customerNote: str(formData.get("customerNote")),
    saveAddress: formData.get("saveAddress") === "on",
    lines: rawLines,
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const d = parsed.data;

  if (d.fulfillment === "DELIVERY" && (!d.address1 || !d.city || !d.postcode)) {
    return { success: false, error: "Adresse de livraison incomplète." };
  }

  // Revalidation des lignes côté serveur : noms, prix et disponibilité viennent de la base.
  const products = await prisma.product.findMany({
    where: { id: { in: d.lines.map((l) => l.productId) }, status: "PUBLISHED" },
    include: { variants: true, attributes: { where: { isVariation: true } } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const items: Prisma.OrderItemCreateWithoutOrderInput[] = [];
  const emailLines: OrderEmailLine[] = [];
  let subtotal = new Prisma.Decimal(0);

  for (const line of d.lines) {
    const product = byId.get(line.productId);
    if (!product) return { success: false, error: "Un produit de votre panier n'est plus disponible." };
    const variant = line.variantId ? product.variants.find((v) => v.id === line.variantId && v.enabled) : null;
    if (line.variantId && !variant) return { success: false, error: `Variante introuvable pour « ${product.name} ».` };

    const price = variant?.price ?? product.price ?? new Prisma.Decimal(0);
    const lineTotal = price.mul(line.quantity);
    subtotal = subtotal.plus(lineTotal);
    const attributes = variant ? (variant.attributes as Record<string, string>) : undefined;

    items.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      sku: variant?.sku ?? product.sku,
      attributes: attributes ?? Prisma.JsonNull,
      quantity: line.quantity,
      unitPrice: price,
      lineTotal,
    });
    emailLines.push({ name: product.name, attributes, quantity: line.quantity, unitPrice: price.toNumber(), lineTotal: lineTotal.toNumber() });
  }

  const shipping =
    d.fulfillment === "DELIVERY"
      ? { firstName: d.firstName, lastName: d.lastName, company: d.company, address1: d.address1, address2: d.address2, city: d.city, state: d.state, postcode: d.postcode, country: "CA", phone: d.phone }
      : null;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        number: "pending",
        profileId: user.id,
        email: user.email,
        firstName: d.firstName,
        lastName: d.lastName,
        company: d.company || null,
        phone: d.phone,
        fulfillment: d.fulfillment,
        shippingLabel: d.fulfillment === "PICKUP" ? "Cueillette en boutique" : "Livraison (frais confirmés par le commis)",
        shipping: shipping ?? Prisma.JsonNull,
        customerNote: d.customerNote || null,
        subtotal,
        items: { create: items },
        notes: { create: { author: "system", content: "Commande envoyée depuis le site.", isCustomerVisible: false } },
      },
    });
    const updated = await tx.order.update({ where: { id: created.id }, data: { number: nextOrderNumber(created.id) } });

    await tx.profile.update({
      where: { id: user.id },
      data: {
        firstName: d.firstName,
        lastName: d.lastName,
        company: d.company || undefined,
        phone: d.phone,
        ...(d.saveAddress && shipping ? { shipping } : {}),
      },
    });
    return updated;
  });

  const host = (await headers()).get("host") ?? "taxidermiedelestrie.com";
  const base = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  const emailData = {
    number: order.number,
    customerName: `${d.firstName} ${d.lastName}`,
    email: user.email,
    phone: d.phone,
    fulfillment: d.fulfillment,
    shipping,
    customerNote: d.customerNote,
    lines: emailLines,
    subtotal: subtotal.toNumber(),
  };

  await Promise.all([
    sendEmail({ to: user.email, ...customerOrderEmail({ ...emailData, url: `${base}/mon-compte/commandes/${order.number}` }) }),
    sendEmail({ to: ORDERS_NOTIFY_EMAIL, replyTo: user.email, ...staffOrderEmail({ ...emailData, url: `${base}/gestion/commandes/${order.id}` }) }),
  ]);

  redirect(`/mon-compte/commandes/${order.number}?merci=1`);
}
