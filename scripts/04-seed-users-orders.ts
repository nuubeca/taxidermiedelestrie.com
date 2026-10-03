/**
 * Migration des comptes et de l'historique de commandes WooCommerce.
 *
 * Source : ../wp-users-orders.json (export direct de la DB WordPress live).
 * Cible  : Supabase Auth (auth.users) + Prisma (Profile, Order, OrderItem, OrderNote).
 *
 * - Chaque courriel WordPress devient un utilisateur Supabase (sans mot de passe : connexion par OTP).
 * - L'admin WordPress (ID 1) et max@pelti.co deviennent ADMIN ; les autres CUSTOMER.
 * - Les commandes sont rattachées au profil par courriel de facturation, sinon laissées orphelines (profileId null).
 * - Idempotent : upsert par courriel / wpUserId / wpOrderId.
 *
 * Usage : yarn migrate:accounts
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Prisma, PrismaClient, type UserRole } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const EXTRA_ADMINS = ["max@pelti.co"];
const SOURCE = resolve(process.cwd(), process.env.WP_ACCOUNTS_JSON ?? "../wp-users-orders.json");

type Meta = Record<string, string>;
type WpUser = { id: number; login: string; email: string; registered: string; displayName: string; meta: Meta };
type WpOrder = { id: number; date: string; status: string; excerpt: string; meta: Meta };
type WpItem = { id: number; orderId: number; name: string; type: string; meta: Meta };
type WpNote = { orderId: number; date: string; author: string; content: string };
type Dump = { users: WpUser[]; orders: WpOrder[]; items: WpItem[]; notes: WpNote[] };

const STATUS: Record<string, "RECEIVED" | "PROCESSING" | "COMPLETED" | "CANCELLED"> = {
  "wc-pending": "RECEIVED",
  "wc-on-hold": "RECEIVED",
  "wc-processing": "PROCESSING",
  "wc-completed": "COMPLETED",
  "wc-cancelled": "CANCELLED",
  "wc-refunded": "CANCELLED",
  "wc-failed": "CANCELLED",
};

function address(meta: Meta, prefix: string, sep = "_") {
  const g = (k: string) => meta[`${prefix}${sep}${k}`]?.trim() || undefined;
  const a = {
    firstName: g("first_name"), lastName: g("last_name"), company: g("company"),
    address1: g("address_1"), address2: g("address_2"), city: g("city"),
    state: g("state"), postcode: g("postcode"), country: g("country"), phone: g("phone"),
  };
  return Object.values(a).some(Boolean) ? a : undefined;
}

function dec(v: string | undefined): Prisma.Decimal {
  const n = Number(v ?? 0);
  return new Prisma.Decimal(Number.isFinite(n) ? n : 0);
}

function wpDate(s: string): Date {
  // Les dates WP sont en heure locale du site (America/Toronto).
  return new Date(`${s.replace(" ", "T")}-04:00`);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY requis.");
  const supabase = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });

  const dump = JSON.parse(readFileSync(SOURCE, "utf8")) as Dump;
  console.log(`[accounts] ${dump.users.length} users, ${dump.orders.length} orders, ${dump.items.length} items`);

  // ---- 1. Index des utilisateurs Supabase existants (pagination) ----
  const existing = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) if (u.email) existing.set(u.email.toLowerCase(), u.id);
    if (data.users.length < 1000) break;
  }

  async function ensureAuthUser(email: string, meta: Record<string, string | undefined>): Promise<string> {
    const known = existing.get(email);
    if (known) return known;
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: meta,
    });
    if (error || !data.user) throw new Error(`createUser ${email}: ${error?.message}`);
    existing.set(email, data.user.id);
    return data.user.id;
  }

  // ---- 2. Profils ----
  const byEmail = new Map<string, string>(); // email -> profile id
  let created = 0;
  for (const u of dump.users) {
    const email = u.email.trim().toLowerCase();
    if (!email.includes("@")) { console.warn(`[accounts]   skip user ${u.id} (${u.login}) : courriel invalide`); continue; }
    const isWpAdmin = u.meta.KVmXd_capabilities?.includes('"administrator"') ?? false;
    const role: UserRole = isWpAdmin || EXTRA_ADMINS.includes(email) ? "ADMIN" : "CUSTOMER";
    const firstName = u.meta.first_name?.trim() || u.meta.billing_first_name?.trim() || undefined;
    const lastName = u.meta.last_name?.trim() || u.meta.billing_last_name?.trim() || undefined;

    const id = await ensureAuthUser(email, { first_name: firstName, last_name: lastName, wp_login: u.login });
    const data = {
      email, role, firstName, lastName,
      company: u.meta.billing_company?.trim() || undefined,
      phone: u.meta.billing_phone?.trim() || undefined,
      billing: address(u.meta, "billing") ?? Prisma.JsonNull,
      shipping: address(u.meta, "shipping") ?? Prisma.JsonNull,
      wpUserId: u.id, wpLogin: u.login,
    };
    await prisma.profile.upsert({ where: { id }, update: data, create: { id, ...data, createdAt: wpDate(u.registered) } });
    byEmail.set(email, id);
    created++;
  }

  for (const email of EXTRA_ADMINS) {
    if (byEmail.has(email)) continue;
    const id = await ensureAuthUser(email, {});
    await prisma.profile.upsert({ where: { id }, update: { role: "ADMIN" }, create: { id, email, role: "ADMIN" } });
    byEmail.set(email, id);
  }
  console.log(`[accounts] ${created} profils synchronisés`);

  // ---- 3. Commandes ----
  const itemsByOrder = new Map<number, WpItem[]>();
  for (const it of dump.items) itemsByOrder.set(it.orderId, [...(itemsByOrder.get(it.orderId) ?? []), it]);
  const notesByOrder = new Map<number, WpNote[]>();
  for (const n of dump.notes) notesByOrder.set(n.orderId, [...(notesByOrder.get(n.orderId) ?? []), n]);

  let orders = 0;
  for (const o of dump.orders) {
    const m = o.meta;
    const email = (m._billing_email ?? "").trim().toLowerCase();
    const customerId = Number(m._customer_user ?? 0);
    const profileId =
      byEmail.get(email) ??
      (customerId > 0 ? (await prisma.profile.findUnique({ where: { wpUserId: customerId } }))?.id : undefined) ??
      null;

    const items = itemsByOrder.get(o.id) ?? [];
    const lines = items.filter((i) => i.type === "line_item");
    const shipping = items.find((i) => i.type === "shipping");
    const subtotal = lines.reduce((s, i) => s.plus(dec(i.meta._line_subtotal)), new Prisma.Decimal(0));

    const order = await prisma.order.upsert({
      where: { wpOrderId: o.id },
      update: {},
      create: {
        number: String(o.id),
        wpOrderId: o.id,
        profileId,
        status: STATUS[o.status] ?? "PROCESSING",
        fulfillment: shipping?.meta.method_id === "local_pickup" ? "PICKUP" : "DELIVERY",
        shippingLabel: shipping?.name,
        email,
        firstName: m._billing_first_name?.trim(), lastName: m._billing_last_name?.trim(),
        company: m._billing_company?.trim(), phone: m._billing_phone?.trim(),
        billing: address(m, "_billing") ?? Prisma.JsonNull,
        shipping: address(m, "_shipping") ?? Prisma.JsonNull,
        customerNote: o.excerpt?.trim() || undefined,
        subtotal,
        currency: m._order_currency ?? "CAD",
        placedAt: wpDate(o.date),
        items: {
          create: lines.map((i) => {
            const qty = Math.max(1, Number(i.meta._qty ?? 1));
            const lineTotal = dec(i.meta._line_subtotal);
            return {
              productId: Number(i.meta._product_id) || null,
              variantId: Number(i.meta._variation_id) || null,
              name: i.name,
              quantity: qty,
              unitPrice: lineTotal.div(qty).toDecimalPlaces(2),
              lineTotal,
            };
          }),
        },
        notes: {
          create: (notesByOrder.get(o.id) ?? []).map((n) => ({
            author: n.author || "woocommerce",
            content: n.content,
            isCustomerVisible: false,
            createdAt: wpDate(n.date),
          })),
        },
      },
    });
    if (order) orders++;
  }
  console.log(`[accounts] ${orders} commandes importées`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
