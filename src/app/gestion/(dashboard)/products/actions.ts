"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/gestion/action-result";
import { slugify, str } from "@/lib/gestion/format";
import { recountTaxonomies } from "@/lib/gestion/taxonomy";

const money = z.union([z.number().min(0).max(1_000_000), z.null()]);

const AttributeSchema = z.object({
  id: z.number().int().positive().nullable(),
  name: z.string().trim().min(1, "Un attribut n'a pas de nom.").max(120),
  slug: z.string().trim().min(1).max(120),
  options: z.array(z.string().trim().min(1).max(120)).max(200),
  isVariation: z.boolean(),
  isVisible: z.boolean(),
});

const VariantSchema = z.object({
  id: z.number().int().positive().nullable(),
  attributes: z.record(z.string()),
  sku: z.string().trim().max(100),
  regularPrice: money,
  salePrice: money,
  manageStock: z.boolean(),
  stockQuantity: z.number().int().min(-99999).max(999999).nullable(),
  stockStatus: z.enum(["instock", "outofstock", "onbackorder"]),
  enabled: z.boolean(),
  imageUrl: z.string().url().nullable(),
});

const ProductSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(300),
  slug: z.string().trim().max(120),
  shortDescription: z.string().max(20_000),
  description: z.string().max(200_000),
  status: z.enum(["PUBLISHED", "DRAFT", "PRIVATE", "PENDING"]),
  featured: z.boolean(),
  sku: z.string().trim().max(100),
  regularPrice: money,
  salePrice: money,
  manageStock: z.boolean(),
  stockQuantity: z.number().int().min(-99999).max(999999).nullable(),
  stockStatus: z.enum(["instock", "outofstock", "onbackorder"]),
  weight: z.number().min(0).max(100_000).nullable(),
  metaTitle: z.string().trim().max(200),
  metaDescription: z.string().trim().max(400),
  primaryImageUrl: z.string().url().nullable(),
  galleryImageUrls: z.array(z.string().url()).max(60),
  categoryIds: z.array(z.number().int().positive()),
  tagIds: z.array(z.number().int().positive()),
  attributes: z.array(AttributeSchema).max(30),
  variants: z.array(VariantSchema).max(500),
});

type ProductInput = z.infer<typeof ProductSchema>;

function num(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function json<T>(raw: string, fallback: T): unknown {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function read(fd: FormData) {
  return ProductSchema.safeParse({
    name: str(fd, "name"),
    slug: str(fd, "slug"),
    shortDescription: str(fd, "shortDescription"),
    description: str(fd, "description"),
    status: str(fd, "status") || "DRAFT",
    featured: fd.get("featured") === "on",
    sku: str(fd, "sku"),
    regularPrice: num(str(fd, "regularPrice")),
    salePrice: num(str(fd, "salePrice")),
    manageStock: fd.get("manageStock") === "on",
    stockQuantity: num(str(fd, "stockQuantity")),
    stockStatus: str(fd, "stockStatus") || "instock",
    weight: num(str(fd, "weight")),
    metaTitle: str(fd, "metaTitle"),
    metaDescription: str(fd, "metaDescription"),
    primaryImageUrl: str(fd, "primaryImageUrl") || null,
    galleryImageUrls: json(str(fd, "galleryImageUrls"), []),
    categoryIds: fd.getAll("categoryIds").map(Number).filter(Number.isInteger),
    tagIds: fd.getAll("tagIds").map(Number).filter(Number.isInteger),
    attributes: json(str(fd, "attributes"), []),
    variants: json(str(fd, "variants"), []),
  });
}

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  const root = slugify(base) || "produit";
  let candidate = root;
  for (let i = 2; ; i++) {
    const hit = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!hit || hit.id === excludeId) return candidate;
    candidate = `${root}-${i}`;
  }
}

const dec = (n: number | null) => (n === null ? null : new Prisma.Decimal(n.toFixed(2)));
const effective = (regular: number | null, sale: number | null) => (sale !== null && (regular === null || sale < regular) ? sale : regular);

function validateVariants(d: ProductInput): string | null {
  const varAttrs = d.attributes.filter((a) => a.isVariation);
  const seen = new Set<string>();
  for (const v of d.variants) {
    for (const a of varAttrs) {
      const val = v.attributes[a.slug];
      if (val && !a.options.includes(val)) return `La valeur « ${val} » n'existe pas dans l'attribut « ${a.name} ».`;
    }
    const key = varAttrs.map((a) => v.attributes[a.slug] ?? "*").join("|");
    if (seen.has(key)) return "Deux variantes ont la même combinaison d'attributs.";
    seen.add(key);
  }
  const slugs = d.attributes.map((a) => a.slug);
  if (new Set(slugs).size !== slugs.length) return "Deux attributs portent le même nom.";
  return null;
}

/** Écrit attributs et variantes d'un produit (création, mise à jour, suppression des retirés). */
async function syncAttributesAndVariants(tx: Prisma.TransactionClient, productId: number, d: ProductInput) {
  const keepAttr = d.attributes.map((a) => a.id).filter((x): x is number => x !== null);
  await tx.productAttribute.deleteMany({ where: { productId, id: { notIn: keepAttr } } });
  for (const [position, a] of d.attributes.entries()) {
    const data = { name: a.name, slug: a.slug, options: a.options, isVariation: a.isVariation, isVisible: a.isVisible, position };
    if (a.id) await tx.productAttribute.update({ where: { id: a.id, productId }, data });
    else await tx.productAttribute.create({ data: { ...data, productId } });
  }

  const keepVar = d.variants.map((v) => v.id).filter((x): x is number => x !== null);
  await tx.variant.deleteMany({ where: { productId, id: { notIn: keepVar } } });
  for (const [position, v] of d.variants.entries()) {
    const data = {
      attributes: v.attributes,
      sku: v.sku || null,
      regularPrice: dec(v.regularPrice),
      salePrice: dec(v.salePrice),
      price: dec(effective(v.regularPrice, v.salePrice)),
      manageStock: v.manageStock,
      stockQuantity: v.manageStock ? v.stockQuantity : null,
      stockStatus: v.manageStock ? ((v.stockQuantity ?? 0) > 0 ? "instock" : "outofstock") : v.stockStatus,
      enabled: v.enabled,
      imageUrl: v.imageUrl,
      position,
    };
    if (v.id) await tx.variant.update({ where: { id: v.id, productId }, data });
    else await tx.variant.create({ data: { ...data, productId } });
  }
}

function productData(d: ProductInput, slug: string) {
  const hasVariants = d.variants.length > 0;
  const variantPrices = d.variants.filter((v) => v.enabled).map((v) => effective(v.regularPrice, v.salePrice)).filter((p): p is number => p !== null);
  const price = hasVariants ? (variantPrices.length ? Math.min(...variantPrices) : null) : effective(d.regularPrice, d.salePrice);
  const variantStock = d.variants.some((v) => v.enabled && (v.manageStock ? (v.stockQuantity ?? 0) > 0 : v.stockStatus !== "outofstock"));
  const stockStatus = hasVariants ? (variantStock ? "instock" : "outofstock") : d.manageStock ? ((d.stockQuantity ?? 0) > 0 ? "instock" : "outofstock") : d.stockStatus;

  return {
    name: d.name,
    slug,
    shortDescription: d.shortDescription || null,
    description: d.description || null,
    type: hasVariants ? ("VARIABLE" as const) : ("SIMPLE" as const),
    status: d.status,
    featured: d.featured,
    sku: d.sku || null,
    regularPrice: hasVariants ? null : dec(d.regularPrice),
    salePrice: hasVariants ? null : dec(d.salePrice),
    price: dec(price),
    manageStock: hasVariants ? false : d.manageStock,
    stockQuantity: !hasVariants && d.manageStock ? d.stockQuantity : null,
    stockStatus,
    weight: d.weight === null ? null : new Prisma.Decimal(d.weight),
    metaTitle: d.metaTitle || null,
    metaDescription: d.metaDescription || null,
    primaryImageUrl: d.primaryImageUrl,
    galleryImageUrls: d.galleryImageUrls,
    categories: { set: d.categoryIds.map((id) => ({ id })) },
    tags: { set: d.tagIds.map((id) => ({ id })) },
  };
}

function revalidateProduct(id?: number) {
  revalidatePath("/gestion/products");
  if (id) revalidatePath(`/gestion/products/${id}`);
  revalidatePath("/gestion");
  revalidatePath("/catalogue", "layout");
}

export async function createProduct(_prev: ActionResult<unknown> | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = read(fd);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const d = parsed.data;
  const err = validateVariants(d);
  if (err) return fail(err);

  const slug = await uniqueSlug(d.slug || d.name);
  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: { ...productData(d, slug), categories: { connect: d.categoryIds.map((id) => ({ id })) }, tags: { connect: d.tagIds.map((id) => ({ id })) } },
    });
    await syncAttributesAndVariants(tx, created.id, d);
    return created;
  });
  await recountTaxonomies(d.categoryIds, d.tagIds);
  revalidateProduct(product.id);
  redirect(`/gestion/products/${product.id}?cree=1`);
}

export async function updateProduct(_prev: ActionResult<unknown> | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id)) return fail("Produit invalide.");
  const parsed = read(fd);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const d = parsed.data;
  const err = validateVariants(d);
  if (err) return fail(err);

  const before = await prisma.product.findUnique({
    where: { id },
    select: { categories: { select: { id: true } }, tags: { select: { id: true } } },
  });
  if (!before) return fail("Produit introuvable.");

  const slug = await uniqueSlug(d.slug || d.name, id);
  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: productData(d, slug) });
    await syncAttributesAndVariants(tx, id, d);
  });
  await recountTaxonomies(
    [...d.categoryIds, ...before.categories.map((c) => c.id)],
    [...d.tagIds, ...before.tags.map((t) => t.id)],
  );
  revalidateProduct(id);
  return ok();
}

async function taxonomyIds(id: number) {
  const p = await prisma.product.findUnique({ where: { id }, select: { categories: { select: { id: true } }, tags: { select: { id: true } } } });
  return { cats: p?.categories.map((c) => c.id) ?? [], tags: p?.tags.map((t) => t.id) ?? [] };
}

export async function trashProduct(id: number): Promise<ActionResult> {
  await requireAdmin();
  await prisma.product.update({ where: { id }, data: { status: "TRASH" } });
  const t = await taxonomyIds(id);
  await recountTaxonomies(t.cats, t.tags);
  revalidateProduct(id);
  return ok();
}

export async function restoreProduct(id: number): Promise<ActionResult> {
  await requireAdmin();
  await prisma.product.update({ where: { id }, data: { status: "DRAFT" } });
  revalidateProduct(id);
  return ok();
}

export async function deleteProduct(id: number): Promise<ActionResult> {
  await requireAdmin();
  const p = await prisma.product.findUnique({ where: { id }, select: { status: true } });
  if (!p) return fail("Produit introuvable.");
  if (p.status !== "TRASH") return fail("Mettez le produit à la corbeille avant de le supprimer.");
  const t = await taxonomyIds(id);
  await prisma.product.delete({ where: { id } });
  await recountTaxonomies(t.cats, t.tags);
  revalidateProduct();
  redirect("/gestion/products?status=TRASH");
}

export async function duplicateProduct(id: number): Promise<ActionResult> {
  await requireAdmin();
  const p = await prisma.product.findUnique({
    where: { id },
    include: { categories: { select: { id: true } }, tags: { select: { id: true } }, attributes: true, variants: true },
  });
  if (!p) return fail("Produit introuvable.");

  const slug = await uniqueSlug(`${p.slug}-copie`);
  const copy = await prisma.product.create({
    data: {
      name: `${p.name} (copie)`,
      slug,
      description: p.description,
      shortDescription: p.shortDescription,
      type: p.type,
      status: "DRAFT",
      sku: null,
      price: p.price,
      regularPrice: p.regularPrice,
      salePrice: p.salePrice,
      manageStock: p.manageStock,
      stockQuantity: p.stockQuantity,
      stockStatus: p.stockStatus,
      weight: p.weight,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      primaryImageUrl: p.primaryImageUrl,
      galleryImageUrls: p.galleryImageUrls,
      categories: { connect: p.categories },
      tags: { connect: p.tags },
      attributes: {
        create: p.attributes.map((a) => ({ name: a.name, slug: a.slug, position: a.position, isVisible: a.isVisible, isVariation: a.isVariation, options: a.options })),
      },
      variants: {
        create: p.variants.map((v) => ({
          sku: null, price: v.price, regularPrice: v.regularPrice, salePrice: v.salePrice, manageStock: v.manageStock,
          stockQuantity: v.stockQuantity, stockStatus: v.stockStatus, weight: v.weight, imageUrl: v.imageUrl,
          attributes: (v.attributes ?? {}) as Prisma.InputJsonValue, position: v.position, enabled: v.enabled,
        })),
      },
    },
  });
  revalidateProduct(copy.id);
  redirect(`/gestion/products/${copy.id}`);
}
