import { prisma } from "@/lib/prisma";
import { stripHtml } from "@/lib/utils";

export type SerializedProduct = {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  sku: string | null;
  price: number | null;
  regularPrice: number | null;
  salePrice: number | null;
  stockStatus: string;
  stockQuantity: number | null;
  primaryImageUrl: string | null;
  galleryImageUrls: string[];
  featured: boolean;
  type: string;
  categories: { slug: string; name: string }[];
};

function decimal(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (typeof value === "object" && value && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  return null;
}

type RawProduct = Awaited<ReturnType<typeof prisma.product.findMany>>[number] & {
  categories?: { slug: string; name: string }[];
};

export function serializeProduct(p: RawProduct): SerializedProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: stripHtml(p.shortDescription) || null,
    description: p.description,
    sku: p.sku,
    price: decimal(p.price),
    regularPrice: decimal(p.regularPrice),
    salePrice: decimal(p.salePrice),
    stockStatus: p.stockStatus,
    stockQuantity: p.stockQuantity,
    primaryImageUrl: p.primaryImageUrl,
    galleryImageUrls: p.galleryImageUrls,
    featured: p.featured,
    type: p.type,
    categories: p.categories ?? [],
  };
}

export async function getTopLevelCategories() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      imageUrl: true,
      productCount: true,
    },
  });
  return categories.map((c) => ({ ...c, description: stripHtml(c.description) || null }));
}

export async function getFeaturedProducts(limit = 8): Promise<SerializedProduct[]> {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED", featured: true },
    take: limit,
    orderBy: { wpModifiedAt: "desc" },
    include: {
      categories: { select: { slug: true, name: true } },
    },
  });
  return products.map(serializeProduct);
}

export async function getRecentProducts(limit = 8): Promise<SerializedProduct[]> {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    take: limit,
    orderBy: [{ featured: "desc" }, { wpModifiedAt: "desc" }],
    include: {
      categories: { select: { slug: true, name: true } },
    },
  });
  return products.map(serializeProduct);
}

export async function getCategoryBySlug(slug: string) {
  const cat = await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      imageUrl: true,
      productCount: true,
    },
  });
  if (!cat) return null;
  return { ...cat, description: stripHtml(cat.description) || null };
}

export type ProductFilters = {
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
};

export async function getProductsByFilters(
  filters: ProductFilters,
  page = 1,
  pageSize = 24,
): Promise<{ products: SerializedProduct[]; total: number; pageCount: number }> {
  const { categorySlug, minPrice, maxPrice, inStock } = filters;

  const where = {
    status: "PUBLISHED" as const,
    ...(categorySlug
      ? { categories: { some: { slug: categorySlug } } }
      : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
    ...(inStock ? { stockStatus: "instock" } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      include: {
        categories: { select: { slug: true, name: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: items.map(serializeProduct),
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      categories: { select: { id: true, slug: true, name: true } },
      tags: { select: { slug: true, name: true } },
      attributes: true,
      variants: { orderBy: { position: "asc" } },
    },
  });

  if (!product) return null;

  return {
    ...serializeProduct(product),
    weight: decimal(product.weight),
    length: decimal(product.length),
    width: decimal(product.width),
    height: decimal(product.height),
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    purchaseNote: product.purchaseNote,
    attributes: product.attributes.map((a) => ({
      slug: a.slug,
      name: a.name,
      options: a.options,
      isVariation: a.isVariation,
      isVisible: a.isVisible,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: decimal(v.price),
      regularPrice: decimal(v.regularPrice),
      salePrice: decimal(v.salePrice),
      stockStatus: v.stockStatus,
      stockQuantity: v.stockQuantity,
      imageUrl: v.imageUrl,
      attributes: v.attributes as Record<string, string>,
      enabled: v.enabled,
    })),
    tags: product.tags,
    fullCategories: product.categories,
  };
}

export async function getPriceRange() {
  const result = await prisma.product.aggregate({
    where: { status: "PUBLISHED", price: { not: null } },
    _min: { price: true },
    _max: { price: true },
  });
  return {
    min: Math.floor(decimal(result._min.price) ?? 0),
    max: Math.ceil(decimal(result._max.price) ?? 1000),
  };
}
