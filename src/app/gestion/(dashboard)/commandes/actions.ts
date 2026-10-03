"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUS_LABEL, nextOrderNumber } from "@/lib/orders/format";
import { fail, ok, type ActionResult } from "@/lib/gestion/action-result";
import { str } from "@/lib/gestion/format";


const OrderStatusEnum = z.enum(["RECEIVED", "PROCESSING", "COMPLETED", "CANCELLED"]);

function revalidateOrder(id: number) {
  revalidatePath(`/gestion/commandes/${id}`);
  revalidatePath("/gestion/commandes");
  revalidatePath("/gestion");
}

/* ─── Statut et notes ──────────────────────────────────────── */

export async function setOrderStatus(orderId: number, status: z.infer<typeof OrderStatusEnum>): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = OrderStatusEnum.safeParse(status);
  if (!parsed.success) return fail("Statut invalide.");
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order) return fail("Commande introuvable.");
  if (order.status === parsed.data) return ok();

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: parsed.data,
      notes: {
        create: {
          author: admin.email,
          content: `Statut : ${ORDER_STATUS_LABEL[order.status]} → ${ORDER_STATUS_LABEL[parsed.data]}.`,
        },
      },
    },
  });
  revalidateOrder(orderId);
  return ok();
}

const NoteSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  content: z.string().trim().min(1, "La note est vide.").max(2000),
  isCustomerVisible: z.boolean(),
});

export async function addOrderNote(_prev: ActionResult<unknown> | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = NoteSchema.safeParse({
    orderId: formData.get("orderId"),
    content: formData.get("content"),
    isCustomerVisible: formData.get("isCustomerVisible") === "on",
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Note invalide.");

  await prisma.orderNote.create({
    data: { orderId: parsed.data.orderId, author: admin.email, content: parsed.data.content, isCustomerVisible: parsed.data.isCustomerVisible },
  });
  revalidateOrder(parsed.data.orderId);
  return ok();
}

/* ─── Recherche au catalogue (lignes de commande) ──────────── */

export type CatalogHit = {
  productId: number;
  variantId: number | null;
  name: string;
  detail: string | null;
  sku: string | null;
  price: number;
  attributes: Record<string, string> | null;
  imageUrl: string | null;
};

export async function searchCatalog(q: string): Promise<ActionResult<CatalogHit[]>> {
  await requireAdmin();
  const term = q.trim();
  if (term.length < 2) return ok([]);

  const products = await prisma.product.findMany({
    where: {
      status: { not: "TRASH" },
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } },
        { variants: { some: { sku: { contains: term, mode: "insensitive" } } } },
      ],
    },
    take: 15,
    orderBy: { totalSales: "desc" },
    include: {
      variants: { where: { enabled: true }, orderBy: { position: "asc" } },
      attributes: { where: { isVariation: true } },
    },
  });

  const hits: CatalogHit[] = [];
  for (const p of products) {
    if (p.variants.length === 0) {
      hits.push({
        productId: p.id, variantId: null, name: p.name, detail: null, sku: p.sku,
        price: p.price?.toNumber() ?? 0, attributes: null, imageUrl: p.primaryImageUrl,
      });
      continue;
    }
    const names = new Map(p.attributes.map((a) => [a.slug, a.name]));
    for (const v of p.variants) {
      const attrs = (v.attributes ?? {}) as Record<string, string>;
      hits.push({
        productId: p.id,
        variantId: v.id,
        name: p.name,
        detail: Object.entries(attrs).map(([k, val]) => `${names.get(k) ?? k} : ${val}`).join(" · ") || null,
        sku: v.sku ?? p.sku,
        price: (v.price ?? p.price)?.toNumber() ?? 0,
        attributes: attrs,
        imageUrl: v.imageUrl ?? p.primaryImageUrl,
      });
    }
  }
  return ok(hits.slice(0, 40));
}

/* ─── Lignes, client et création ───────────────────────────── */

const LineSchema = z.object({
  productId: z.number().int().positive().nullable(),
  variantId: z.number().int().positive().nullable(),
  name: z.string().trim().min(1).max(300),
  sku: z.string().max(100).nullable(),
  attributes: z.record(z.string()).nullable(),
  quantity: z.number().int().min(1, "Quantité minimale : 1.").max(9999),
  unitPrice: z.number().min(0).max(1_000_000),
});

function parseLines(raw: string): ActionResult<z.infer<typeof LineSchema>[]> {
  let json: unknown;
  try {
    json = JSON.parse(raw || "[]");
  } catch {
    return fail("Articles illisibles.");
  }
  const parsed = z.array(LineSchema).min(1, "Ajoutez au moins un article.").safeParse(json);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Articles invalides.");
  return ok(parsed.data);
}

function buildItems(lines: z.infer<typeof LineSchema>[]) {
  let subtotal = new Prisma.Decimal(0);
  const items = lines.map((l) => {
    const unitPrice = new Prisma.Decimal(l.unitPrice.toFixed(2));
    const lineTotal = unitPrice.mul(l.quantity);
    subtotal = subtotal.plus(lineTotal);
    return {
      productId: l.productId,
      variantId: l.variantId,
      name: l.name,
      sku: l.sku,
      attributes: l.attributes ?? Prisma.JsonNull,
      quantity: l.quantity,
      unitPrice,
      lineTotal,
    };
  });
  return { items, subtotal };
}

const CustomerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Courriel invalide."),
  firstName: z.string().trim().max(80),
  lastName: z.string().trim().max(80),
  company: z.string().trim().max(120),
  phone: z.string().trim().max(30),
  fulfillment: z.enum(["PICKUP", "DELIVERY"]),
  address1: z.string().trim().max(160),
  address2: z.string().trim().max(160),
  city: z.string().trim().max(80),
  state: z.string().trim().max(40),
  postcode: z.string().trim().max(12),
  customerNote: z.string().trim().max(2000),
});

function readCustomer(fd: FormData) {
  return CustomerSchema.safeParse({
    email: str(fd, "email"),
    firstName: str(fd, "firstName"),
    lastName: str(fd, "lastName"),
    company: str(fd, "company"),
    phone: str(fd, "phone"),
    fulfillment: str(fd, "fulfillment") || "PICKUP",
    address1: str(fd, "address1"),
    address2: str(fd, "address2"),
    city: str(fd, "city"),
    state: str(fd, "state"),
    postcode: str(fd, "postcode"),
    customerNote: str(fd, "customerNote"),
  });
}

function customerData(c: z.infer<typeof CustomerSchema>) {
  const shipping =
    c.fulfillment === "DELIVERY"
      ? { firstName: c.firstName, lastName: c.lastName, company: c.company, address1: c.address1, address2: c.address2, city: c.city, state: c.state, postcode: c.postcode, country: "CA", phone: c.phone }
      : null;
  return {
    email: c.email,
    firstName: c.firstName || null,
    lastName: c.lastName || null,
    company: c.company || null,
    phone: c.phone || null,
    fulfillment: c.fulfillment,
    shippingLabel: c.fulfillment === "PICKUP" ? "Cueillette en boutique" : "Livraison",
    shipping: shipping ?? Prisma.JsonNull,
    customerNote: c.customerNote || null,
  };
}

export async function createOrder(_prev: ActionResult<unknown> | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const customer = readCustomer(formData);
  if (!customer.success) return fail(customer.error.issues[0]?.message ?? "Client invalide.");
  const lines = parseLines(str(formData, "lines"));
  if (!lines.success) return lines;
  const status = OrderStatusEnum.safeParse(str(formData, "status") || "RECEIVED");
  if (!status.success) return fail("Statut invalide.");

  const { items, subtotal } = buildItems(lines.data);
  const profile = await prisma.profile.findUnique({ where: { email: customer.data.email }, select: { id: true } });

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        number: `pending-${Date.now()}`,
        profileId: profile?.id ?? null,
        status: status.data,
        ...customerData(customer.data),
        subtotal,
        items: { create: items },
        notes: { create: { author: admin.email, content: "Commande créée dans la gestion." } },
      },
    });
    return tx.order.update({ where: { id: created.id }, data: { number: nextOrderNumber(created.id) } });
  });

  revalidateOrder(order.id);
  redirect(`/gestion/commandes/${order.id}`);
}

export async function updateOrder(_prev: ActionResult<unknown> | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const orderId = Number(formData.get("orderId"));
  if (!Number.isInteger(orderId)) return fail("Commande invalide.");
  const customer = readCustomer(formData);
  if (!customer.success) return fail(customer.error.issues[0]?.message ?? "Client invalide.");
  const lines = parseLines(str(formData, "lines"));
  if (!lines.success) return lines;

  const { items, subtotal } = buildItems(lines.data);
  const profile = await prisma.profile.findUnique({ where: { email: customer.data.email }, select: { id: true } });

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId } }),
    prisma.order.update({
      where: { id: orderId },
      data: {
        ...customerData(customer.data),
        profileId: profile?.id ?? null,
        subtotal,
        items: { create: items },
        notes: { create: { author: admin.email, content: "Commande modifiée (client ou articles)." } },
      },
    }),
  ]);
  revalidateOrder(orderId);
  redirect(`/gestion/commandes/${orderId}`);
}

export async function deleteOrder(orderId: number): Promise<ActionResult> {
  await requireAdmin();
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order) return fail("Commande introuvable.");
  if (order.status !== "CANCELLED") return fail("Annulez la commande avant de la supprimer.");
  await prisma.order.delete({ where: { id: orderId } });
  revalidatePath("/gestion/commandes");
  revalidatePath("/gestion");
  redirect("/gestion/commandes");
}
