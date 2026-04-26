// Types représentant les structures du dump phpMyAdmin (tous les champs sont des strings).

export type WpRow = Record<string, string | null>;

export interface PhpMyAdminTable {
  type: "table";
  name: string;
  database?: string;
  data: WpRow[];
}

export interface PhpMyAdminHeader {
  type: "header" | "database";
  version?: string;
  comment?: string;
  name?: string;
}

export type PhpMyAdminEntry = PhpMyAdminTable | PhpMyAdminHeader;

// ---------- Modèles normalisés produits par 01-transform.ts ----------

export interface NormalizedCategory {
  wpTermId: number;
  slug: string;
  name: string;
  description: string | null;
  parentWpTermId: number | null;
  imageUrl: string | null;
  position: number;
  productCount: number;
}

export interface NormalizedTag {
  wpTermId: number;
  slug: string;
  name: string;
  productCount: number;
}

export interface NormalizedAttribute {
  name: string;
  slug: string;
  position: number;
  isVisible: boolean;
  isVariation: boolean;
  options: string[];
}

export interface NormalizedVariant {
  wpPostId: number;
  sku: string | null;
  price: string | null;
  regularPrice: string | null;
  salePrice: string | null;
  manageStock: boolean;
  stockQuantity: number | null;
  stockStatus: string;
  weight: string | null;
  length: string | null;
  width: string | null;
  height: string | null;
  imageUrl: string | null;
  attributes: Record<string, string>;
  position: number;
  enabled: boolean;
}

export interface NormalizedProduct {
  wpPostId: number;
  slug: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  type: "SIMPLE" | "VARIABLE" | "GROUPED" | "EXTERNAL";
  status: "PUBLISHED" | "DRAFT" | "PRIVATE" | "PENDING" | "TRASH";
  featured: boolean;
  catalogVisibility: string;
  sku: string | null;

  price: string | null;
  regularPrice: string | null;
  salePrice: string | null;
  saleStart: string | null;
  saleEnd: string | null;

  manageStock: boolean;
  stockQuantity: number | null;
  stockStatus: string;
  backorders: string;
  soldIndividually: boolean;

  weight: string | null;
  length: string | null;
  width: string | null;
  height: string | null;

  taxStatus: string;
  taxClass: string | null;
  shippingClass: string | null;

  purchaseNote: string | null;

  metaTitle: string | null;
  metaDescription: string | null;

  primaryImageUrl: string | null;
  galleryImageUrls: string[];

  categoryWpTermIds: number[];
  tagWpTermIds: number[];
  attributes: NormalizedAttribute[];
  variants: NormalizedVariant[];

  totalSales: number;
  averageRating: string | null;
  ratingCount: number;

  wpCreatedAt: string | null;
  wpModifiedAt: string | null;
}

export interface NormalizedMedia {
  wpPostId: number;
  originalUrl: string;
  filePath: string;
  altText: string | null;
  title: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
}

export interface TransformOutput {
  categories: NormalizedCategory[];
  tags: NormalizedTag[];
  products: NormalizedProduct[];
  media: NormalizedMedia[];
  errors: Array<{ stage: string; wpId?: number; message: string }>;
}
