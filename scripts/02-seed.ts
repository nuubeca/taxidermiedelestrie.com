/**
 * Seed Prisma idempotent depuis data/transformed/*.json.
 *
 * Ordre d'insertion (dépendances FK):
 *   1. MediaAsset
 *   2. Category (deux passes: racines puis enfants)
 *   3. Tag
 *   4. Product (avec relations vers Category/Tag)
 *   5. ProductAttribute
 *   6. Variant
 *
 * Idempotent: tous les inserts sont des `upsert` par wpPostId / wpTermId.
 * Relancer le script reprend l'état sans dupliquer.
 *
 * Usage: npm run migrate:seed
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import type {
  NormalizedCategory,
  NormalizedMedia,
  NormalizedProduct,
  NormalizedTag,
} from "./lib/types";

const prisma = new PrismaClient();

const DATA_DIR = resolve(process.cwd(), "data/transformed");

const INT4_MAX = 2_147_483_647;
const INT4_MIN = -2_147_483_648;

/** Clamp un nombre dans la plage Int4 Postgres. Renvoie null si l'entrée est null/undefined. */
function clampInt4(n: number | null | undefined): number | null {
  if (n === null || n === undefined) return null;
  if (!Number.isFinite(n)) return null;
  if (n > INT4_MAX) {
    console.warn(`[seed]   value ${n} clamped to INT4_MAX`);
    return INT4_MAX;
  }
  if (n < INT4_MIN) return INT4_MIN;
  return Math.trunc(n);
}

function load<T>(name: string): T {
  const p = resolve(DATA_DIR, name);
  return JSON.parse(readFileSync(p, "utf-8")) as T;
}

async function seedMedia(media: NormalizedMedia[]) {
  console.log(`[seed] Media: ${media.length} items`);
  let ok = 0;
  for (const m of media) {
    await prisma.mediaAsset.upsert({
      where: { wpPostId: m.wpPostId },
      create: {
        wpPostId: m.wpPostId,
        originalUrl: m.originalUrl,
        filePath: m.filePath,
        altText: m.altText,
        title: m.title,
        mimeType: m.mimeType,
        width: clampInt4(m.width),
        height: clampInt4(m.height),
        fileSize: clampInt4(m.fileSize),
      },
      update: {
        originalUrl: m.originalUrl,
        filePath: m.filePath,
        altText: m.altText,
        title: m.title,
        mimeType: m.mimeType,
        width: clampInt4(m.width),
        height: clampInt4(m.height),
        fileSize: clampInt4(m.fileSize),
      },
    });
    ok++;
  }
  console.log(`[seed]   ${ok}/${media.length} media upserted`);
}

async function seedCategories(categories: NormalizedCategory[]) {
  console.log(`[seed] Categories: ${categories.length} items`);
  // Pass 1: insert sans parent
  for (const c of categories) {
    await prisma.category.upsert({
      where: { wpTermId: c.wpTermId },
      create: {
        wpTermId: c.wpTermId,
        slug: c.slug,
        name: c.name,
        description: c.description,
        imageUrl: c.imageUrl,
        position: c.position,
        productCount: c.productCount,
      },
      update: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        imageUrl: c.imageUrl,
        position: c.position,
        productCount: c.productCount,
      },
    });
  }

  // Pass 2: lier les parents (maintenant qu'ils existent tous)
  let linked = 0;
  for (const c of categories) {
    if (!c.parentWpTermId) continue;
    const parent = await prisma.category.findUnique({ where: { wpTermId: c.parentWpTermId } });
    if (!parent) continue;
    await prisma.category.update({
      where: { wpTermId: c.wpTermId },
      data: { parentId: parent.id },
    });
    linked++;
  }
  console.log(`[seed]   ${categories.length} categories upserted, ${linked} parent links set`);
}

async function seedTags(tags: NormalizedTag[]) {
  console.log(`[seed] Tags: ${tags.length} items`);
  for (const t of tags) {
    await prisma.tag.upsert({
      where: { wpTermId: t.wpTermId },
      create: {
        wpTermId: t.wpTermId,
        slug: t.slug,
        name: t.name,
        productCount: t.productCount,
      },
      update: {
        slug: t.slug,
        name: t.name,
        productCount: t.productCount,
      },
    });
  }
  console.log(`[seed]   ${tags.length} tags upserted`);
}

async function seedProducts(products: NormalizedProduct[]) {
  console.log(`[seed] Products: ${products.length} items`);

  // Précharge les maps wpTermId → id pour categories/tags
  const cats = await prisma.category.findMany({ select: { id: true, wpTermId: true } });
  const catMap = new Map(cats.map((c) => [c.wpTermId, c.id]));
  const tagsAll = await prisma.tag.findMany({ select: { id: true, wpTermId: true } });
  const tagMap = new Map(tagsAll.map((t) => [t.wpTermId, t.id]));

  let ok = 0;
  for (const p of products) {
    const categoryConnects = p.categoryWpTermIds
      .map((wpId) => catMap.get(wpId))
      .filter((id): id is number => id !== undefined)
      .map((id) => ({ id }));

    const tagConnects = p.tagWpTermIds
      .map((wpId) => tagMap.get(wpId))
      .filter((id): id is number => id !== undefined)
      .map((id) => ({ id }));

    const data = {
      wpPostId: p.wpPostId,
      slug: p.slug,
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription,
      type: p.type,
      status: p.status,
      featured: p.featured,
      catalogVisibility: p.catalogVisibility,
      sku: p.sku,
      price: p.price ? new Prisma.Decimal(p.price) : null,
      regularPrice: p.regularPrice ? new Prisma.Decimal(p.regularPrice) : null,
      salePrice: p.salePrice ? new Prisma.Decimal(p.salePrice) : null,
      saleStart: p.saleStart ? new Date(p.saleStart) : null,
      saleEnd: p.saleEnd ? new Date(p.saleEnd) : null,
      manageStock: p.manageStock,
      stockQuantity: clampInt4(p.stockQuantity),
      stockStatus: p.stockStatus,
      backorders: p.backorders,
      soldIndividually: p.soldIndividually,
      weight: p.weight ? new Prisma.Decimal(p.weight) : null,
      length: p.length ? new Prisma.Decimal(p.length) : null,
      width: p.width ? new Prisma.Decimal(p.width) : null,
      height: p.height ? new Prisma.Decimal(p.height) : null,
      taxStatus: p.taxStatus,
      taxClass: p.taxClass,
      shippingClass: p.shippingClass,
      purchaseNote: p.purchaseNote,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      primaryImageUrl: p.primaryImageUrl,
      galleryImageUrls: p.galleryImageUrls,
      totalSales: clampInt4(p.totalSales) ?? 0,
      averageRating: p.averageRating ? new Prisma.Decimal(p.averageRating) : null,
      ratingCount: clampInt4(p.ratingCount) ?? 0,
      wpCreatedAt: p.wpCreatedAt ? new Date(p.wpCreatedAt) : null,
      wpModifiedAt: p.wpModifiedAt ? new Date(p.wpModifiedAt) : null,
    };

    const product = await prisma.product.upsert({
      where: { wpPostId: p.wpPostId },
      create: {
        ...data,
        categories: { connect: categoryConnects },
        tags: { connect: tagConnects },
      },
      update: {
        ...data,
        categories: { set: categoryConnects },
        tags: { set: tagConnects },
      },
    });

    // Attributs: delete + recreate (plus simple que diff)
    await prisma.productAttribute.deleteMany({ where: { productId: product.id } });
    if (p.attributes.length) {
      await prisma.productAttribute.createMany({
        data: p.attributes.map((a) => ({
          productId: product.id,
          name: a.name,
          slug: a.slug,
          position: a.position,
          isVisible: a.isVisible,
          isVariation: a.isVariation,
          options: a.options,
        })),
      });
    }

    // Variants
    for (const v of p.variants) {
      await prisma.variant.upsert({
        where: { wpPostId: v.wpPostId },
        create: {
          wpPostId: v.wpPostId,
          productId: product.id,
          sku: v.sku,
          price: v.price ? new Prisma.Decimal(v.price) : null,
          regularPrice: v.regularPrice ? new Prisma.Decimal(v.regularPrice) : null,
          salePrice: v.salePrice ? new Prisma.Decimal(v.salePrice) : null,
          manageStock: v.manageStock,
          stockQuantity: clampInt4(v.stockQuantity),
          stockStatus: v.stockStatus,
          weight: v.weight ? new Prisma.Decimal(v.weight) : null,
          length: v.length ? new Prisma.Decimal(v.length) : null,
          width: v.width ? new Prisma.Decimal(v.width) : null,
          height: v.height ? new Prisma.Decimal(v.height) : null,
          imageUrl: v.imageUrl,
          attributes: v.attributes,
          position: v.position,
          enabled: v.enabled,
        },
        update: {
          productId: product.id,
          sku: v.sku,
          price: v.price ? new Prisma.Decimal(v.price) : null,
          regularPrice: v.regularPrice ? new Prisma.Decimal(v.regularPrice) : null,
          salePrice: v.salePrice ? new Prisma.Decimal(v.salePrice) : null,
          manageStock: v.manageStock,
          stockQuantity: clampInt4(v.stockQuantity),
          stockStatus: v.stockStatus,
          weight: v.weight ? new Prisma.Decimal(v.weight) : null,
          length: v.length ? new Prisma.Decimal(v.length) : null,
          width: v.width ? new Prisma.Decimal(v.width) : null,
          height: v.height ? new Prisma.Decimal(v.height) : null,
          imageUrl: v.imageUrl,
          attributes: v.attributes,
          position: v.position,
          enabled: v.enabled,
        },
      });
    }

    ok++;
    if (ok % 50 === 0) console.log(`[seed]   ${ok}/${products.length} products…`);
  }
  console.log(`[seed]   ${ok}/${products.length} products upserted`);
}

async function main() {
  console.log("[seed] Loading transformed data…");
  const media = load<NormalizedMedia[]>("media.json");
  const categories = load<NormalizedCategory[]>("categories.json");
  const tags = load<NormalizedTag[]>("tags.json");
  const products = load<NormalizedProduct[]>("products.json");

  const run = await prisma.migrationRun.create({
    data: { step: "seed", itemsTotal: products.length },
  });

  try {
    await seedMedia(media);
    await seedCategories(categories);
    await seedTags(tags);
    await seedProducts(products);

    await prisma.migrationRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), itemsOk: products.length, notes: "ok" },
    });

    console.log("\n[seed] === DONE ===");
    const counts = {
      Product: await prisma.product.count(),
      Variant: await prisma.variant.count(),
      Category: await prisma.category.count(),
      Tag: await prisma.tag.count(),
      ProductAttribute: await prisma.productAttribute.count(),
      MediaAsset: await prisma.mediaAsset.count(),
    };
    console.table(counts);
  } catch (e: any) {
    await prisma.migrationRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), notes: `FAILED: ${e?.message ?? String(e)}` },
    });
    throw e;
  }
}

main()
  .catch((e) => {
    console.error("[seed] FATAL", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
