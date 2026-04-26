/**
 * Transforme le dump JSON phpMyAdmin en structures normalisées
 * prêtes à être seedées par 02-seed.ts.
 *
 * Sortie: app/data/transformed/{categories,tags,products,media,errors}.json
 *
 * Usage: npm run migrate:transform
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  WpDump,
  asBool,
  asDate,
  asDecimalString,
  asInt,
  asIntStrict,
  decodeHtmlEntities,
} from "./lib/load-json";
import { tryPhpUnserialize } from "./lib/php-unserialize";
import type {
  NormalizedAttribute,
  NormalizedCategory,
  NormalizedMedia,
  NormalizedProduct,
  NormalizedTag,
  NormalizedVariant,
  TransformOutput,
  WpRow,
} from "./lib/types";

const DUMP_PATH = process.env.DUMP_JSON_PATH ?? "../mouldec_wp.json";
const OUT_DIR = resolve(process.cwd(), "data/transformed");

const INT4_MAX = 2_147_483_647;
function clampInt4(n: number | null): number | null {
  if (n === null || !Number.isFinite(n)) return null;
  if (n > INT4_MAX) return INT4_MAX;
  if (n < -2_147_483_648) return -2_147_483_648;
  return Math.trunc(n);
}

// ---------- Helpers ----------

function indexBy<T extends WpRow>(rows: T[], key: keyof T): Map<string, T> {
  const m = new Map<string, T>();
  for (const r of rows) {
    const k = r[key];
    if (k !== null && k !== undefined) m.set(String(k), r);
  }
  return m;
}

function groupBy<T extends WpRow>(rows: T[], key: keyof T): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = r[key];
    if (k === null || k === undefined) continue;
    const ks = String(k);
    const arr = m.get(ks) ?? [];
    arr.push(r);
    m.set(ks, arr);
  }
  return m;
}

function getMeta(metas: WpRow[] | undefined, key: string): string | null {
  if (!metas) return null;
  const m = metas.find((x) => x.meta_key === key);
  return m ? (m.meta_value ?? null) : null;
}

function getMetas(metas: WpRow[] | undefined, prefix: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!metas) return out;
  for (const m of metas) {
    if (m.meta_key && m.meta_key.startsWith(prefix)) {
      out[m.meta_key.slice(prefix.length)] = m.meta_value ?? "";
    }
  }
  return out;
}

// ---------- Main ----------

async function main() {
  console.log(`[transform] Loading dump from ${DUMP_PATH}`);
  const dump = new WpDump(DUMP_PATH);

  const posts = dump.table("posts");
  const postmeta = dump.table("postmeta");
  const terms = dump.table("terms");
  const termTaxonomy = dump.table("term_taxonomy");
  const termRelationships = dump.table("term_relationships");
  const termmeta = dump.table("termmeta");

  console.log(
    `[transform] posts=${posts.length} postmeta=${postmeta.length} terms=${terms.length} term_taxonomy=${termTaxonomy.length} term_relationships=${termRelationships.length}`
  );

  // Index pour accès rapide
  const termsById = indexBy(terms, "term_id");
  const termTaxonomyById = indexBy(termTaxonomy, "term_taxonomy_id");
  const postmetaByPostId = groupBy(postmeta, "post_id");
  const termmetaByTermId = groupBy(termmeta, "term_id");
  const termRelByObjectId = groupBy(termRelationships, "object_id");

  const errors: TransformOutput["errors"] = [];

  // ---------- 1. MEDIA ----------
  console.log("[transform] Building media…");
  const attachments = posts.filter((p) => p.post_type === "attachment");
  const media: NormalizedMedia[] = [];
  const mediaById = new Map<number, NormalizedMedia>();

  for (const a of attachments) {
    const id = asIntStrict(a.ID);
    const metas = postmetaByPostId.get(String(id));
    const filePath = getMeta(metas, "_wp_attached_file") ?? "";
    let originalUrl = a.guid ? decodeHtmlEntities(a.guid) : "";
    // Si le guid contient un permalink (?attachment_id=...) plutôt qu'un fichier, on reconstruit depuis filePath
    if (filePath && (!originalUrl.includes(filePath) || originalUrl.includes("?"))) {
      const baseUrl = process.env.WP_SITE_URL ?? "https://taxidermiedelestrie.com";
      originalUrl = `${baseUrl}/wp-content/uploads/${filePath}`;
    }

    const attMeta = tryPhpUnserialize(getMeta(metas, "_wp_attachment_metadata"), {}) as any;
    const m: NormalizedMedia = {
      wpPostId: id,
      originalUrl,
      filePath,
      altText: getMeta(metas, "_wp_attachment_image_alt"),
      title: a.post_title || null,
      mimeType: a.post_mime_type || null,
      width: typeof attMeta?.width === "number" ? attMeta.width : asInt(String(attMeta?.width ?? "")),
      height: typeof attMeta?.height === "number" ? attMeta.height : asInt(String(attMeta?.height ?? "")),
      fileSize: typeof attMeta?.filesize === "number" ? attMeta.filesize : null,
    };
    media.push(m);
    mediaById.set(id, m);
  }
  console.log(`[transform]   ${media.length} media assets`);

  function urlForAttachment(attId: number | null): string | null {
    if (!attId) return null;
    return mediaById.get(attId)?.originalUrl ?? null;
  }

  // ---------- 2. CATEGORIES + TAGS ----------
  console.log("[transform] Building categories & tags…");
  const categories: NormalizedCategory[] = [];
  const tags: NormalizedTag[] = [];

  for (const tt of termTaxonomy) {
    const term = termsById.get(String(tt.term_id));
    if (!term) continue;
    const wpTermId = asIntStrict(tt.term_id);
    const tmeta = termmetaByTermId.get(String(wpTermId));
    const thumbnailId = asInt(getMeta(tmeta, "thumbnail_id") ?? "");
    const order = asIntStrict(getMeta(tmeta, "order") ?? "0");

    if (tt.taxonomy === "product_cat") {
      categories.push({
        wpTermId,
        slug: term.slug ?? `cat-${wpTermId}`,
        name: term.name ?? `Catégorie ${wpTermId}`,
        description: tt.description || null,
        parentWpTermId: tt.parent && tt.parent !== "0" ? asIntStrict(tt.parent) : null,
        imageUrl: urlForAttachment(thumbnailId),
        position: order,
        productCount: asIntStrict(tt.count),
      });
    } else if (tt.taxonomy === "product_tag") {
      tags.push({
        wpTermId,
        slug: term.slug ?? `tag-${wpTermId}`,
        name: term.name ?? `Tag ${wpTermId}`,
        productCount: asIntStrict(tt.count),
      });
    }
  }
  console.log(`[transform]   ${categories.length} categories, ${tags.length} tags`);

  // ---------- 3. PRODUCT TYPE / VISIBILITY MAP ----------
  // Map term_taxonomy_id → taxonomy slug (pour résoudre les term_relationships)
  const ttIdToTaxAndSlug = new Map<string, { taxonomy: string; slug: string; termId: string }>();
  for (const tt of termTaxonomy) {
    const term = termsById.get(String(tt.term_id));
    if (!term) continue;
    ttIdToTaxAndSlug.set(String(tt.term_taxonomy_id), {
      taxonomy: tt.taxonomy ?? "",
      slug: term.slug ?? "",
      termId: String(tt.term_id),
    });
  }

  // ---------- 4. VARIATIONS (groupées par parent) ----------
  console.log("[transform] Building variations…");
  const variations = posts.filter((p) => p.post_type === "product_variation");
  const variantsByParent = new Map<string, NormalizedVariant[]>();

  for (const v of variations) {
    const id = asIntStrict(v.ID);
    const parentId = String(v.post_parent ?? "0");
    const metas = postmetaByPostId.get(String(id));
    const attrMap = getMetas(metas, "attribute_");
    const thumbnailId = asInt(getMeta(metas, "_thumbnail_id") ?? "");

    const variant: NormalizedVariant = {
      wpPostId: id,
      sku: getMeta(metas, "_sku"),
      price: asDecimalString(getMeta(metas, "_price")),
      regularPrice: asDecimalString(getMeta(metas, "_regular_price")),
      salePrice: asDecimalString(getMeta(metas, "_sale_price")),
      manageStock: asBool(getMeta(metas, "_manage_stock")),
      stockQuantity: asInt(getMeta(metas, "_stock") ?? ""),
      stockStatus: getMeta(metas, "_stock_status") ?? "instock",
      weight: asDecimalString(getMeta(metas, "_weight")),
      length: asDecimalString(getMeta(metas, "_length")),
      width: asDecimalString(getMeta(metas, "_width")),
      height: asDecimalString(getMeta(metas, "_height")),
      imageUrl: urlForAttachment(thumbnailId),
      attributes: attrMap,
      position: asIntStrict(v.menu_order ?? "0"),
      enabled: v.post_status === "publish",
    };

    const arr = variantsByParent.get(parentId) ?? [];
    arr.push(variant);
    variantsByParent.set(parentId, arr);
  }
  console.log(`[transform]   ${variations.length} variations across ${variantsByParent.size} parents`);

  // ---------- 5. PRODUCTS ----------
  console.log("[transform] Building products…");
  const productPosts = posts.filter((p) => p.post_type === "product");
  const products: NormalizedProduct[] = [];

  for (const p of productPosts) {
    const id = asIntStrict(p.ID);
    try {
      const metas = postmetaByPostId.get(String(id));
      const rels = termRelByObjectId.get(String(id)) ?? [];

      // Résoudre catégories, tags, type, visibilité
      const categoryWpTermIds: number[] = [];
      const tagWpTermIds: number[] = [];
      let productType: NormalizedProduct["type"] = "SIMPLE";
      let featured = false;
      let catalogVisibility = "visible";

      for (const rel of rels) {
        const ref = ttIdToTaxAndSlug.get(String(rel.term_taxonomy_id));
        if (!ref) continue;
        if (ref.taxonomy === "product_cat") categoryWpTermIds.push(asIntStrict(ref.termId));
        else if (ref.taxonomy === "product_tag") tagWpTermIds.push(asIntStrict(ref.termId));
        else if (ref.taxonomy === "product_type") {
          const map: Record<string, NormalizedProduct["type"]> = {
            simple: "SIMPLE",
            variable: "VARIABLE",
            grouped: "GROUPED",
            external: "EXTERNAL",
          };
          productType = map[ref.slug] ?? "SIMPLE";
        } else if (ref.taxonomy === "product_visibility") {
          if (ref.slug === "featured") featured = true;
          if (ref.slug === "exclude-from-catalog") catalogVisibility = "hidden";
          if (ref.slug === "exclude-from-search") {
            catalogVisibility = catalogVisibility === "hidden" ? "hidden" : "search";
          }
        }
      }

      // Statut
      const statusMap: Record<string, NormalizedProduct["status"]> = {
        publish: "PUBLISHED",
        draft: "DRAFT",
        private: "PRIVATE",
        pending: "PENDING",
        trash: "TRASH",
      };
      const status = statusMap[p.post_status ?? "publish"] ?? "PUBLISHED";

      // Attributs locaux
      const rawAttrs = tryPhpUnserialize(getMeta(metas, "_product_attributes"), {}) as Record<string, any>;
      const attributes: NormalizedAttribute[] = [];
      for (const [slug, def] of Object.entries(rawAttrs ?? {})) {
        if (!def || typeof def !== "object") continue;
        const value = (def as any).value ?? "";
        const options = String(value)
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        attributes.push({
          name: (def as any).name ?? slug,
          slug,
          position: asIntStrict(String((def as any).position ?? "0")),
          isVisible: Boolean((def as any).is_visible),
          isVariation: Boolean((def as any).is_variation),
          options,
        });
      }
      attributes.sort((a, b) => a.position - b.position);

      // Images
      const thumbnailId = asInt(getMeta(metas, "_thumbnail_id") ?? "");
      const galleryRaw = getMeta(metas, "_product_image_gallery") ?? "";
      const galleryIds = galleryRaw
        .split(",")
        .map((s) => asInt(s.trim()))
        .filter((n): n is number => n !== null && n > 0);
      const galleryUrls = galleryIds
        .map((gid) => urlForAttachment(gid))
        .filter((u): u is string => Boolean(u));

      const variants = variantsByParent.get(String(id)) ?? [];

      const product: NormalizedProduct = {
        wpPostId: id,
        slug: p.post_name || `produit-${id}`,
        name: p.post_title ?? `Produit ${id}`,
        description: p.post_content || null,
        shortDescription: p.post_excerpt || null,
        type: productType,
        status,
        featured,
        catalogVisibility,
        sku: getMeta(metas, "_sku"),

        price: asDecimalString(getMeta(metas, "_price")),
        regularPrice: asDecimalString(getMeta(metas, "_regular_price")),
        salePrice: asDecimalString(getMeta(metas, "_sale_price")),
        saleStart: asDate(getMeta(metas, "_sale_price_dates_from")),
        saleEnd: asDate(getMeta(metas, "_sale_price_dates_to")),

        manageStock: asBool(getMeta(metas, "_manage_stock")),
        stockQuantity: asInt(getMeta(metas, "_stock") ?? ""),
        stockStatus: getMeta(metas, "_stock_status") ?? "instock",
        backorders: getMeta(metas, "_backorders") ?? "no",
        soldIndividually: asBool(getMeta(metas, "_sold_individually")),

        weight: asDecimalString(getMeta(metas, "_weight")),
        length: asDecimalString(getMeta(metas, "_length")),
        width: asDecimalString(getMeta(metas, "_width")),
        height: asDecimalString(getMeta(metas, "_height")),

        taxStatus: getMeta(metas, "_tax_status") || "taxable",
        taxClass: getMeta(metas, "_tax_class"),
        shippingClass: null, // dérivable via term_relationships si besoin

        purchaseNote: getMeta(metas, "_purchase_note"),

        metaTitle: getMeta(metas, "_yoast_wpseo_title"),
        metaDescription: getMeta(metas, "_yoast_wpseo_metadesc"),

        primaryImageUrl: urlForAttachment(thumbnailId),
        galleryImageUrls: galleryUrls,

        categoryWpTermIds,
        tagWpTermIds,
        attributes,
        variants,

        totalSales: clampInt4(asIntStrict(getMeta(metas, "total_sales") ?? "0")) ?? 0,
        averageRating: asDecimalString(getMeta(metas, "_wc_average_rating")),
        ratingCount: clampInt4(asIntStrict(getMeta(metas, "_wc_review_count") ?? "0")) ?? 0,

        wpCreatedAt: asDate(p.post_date_gmt),
        wpModifiedAt: asDate(p.post_modified_gmt),
      };

      products.push(product);
    } catch (e: any) {
      errors.push({ stage: "product", wpId: id, message: e?.message ?? String(e) });
    }
  }
  console.log(`[transform]   ${products.length} products built (${errors.length} errors so far)`);

  // ---------- 6. WRITE OUTPUT ----------
  mkdirSync(OUT_DIR, { recursive: true });
  const writes: Array<[string, unknown]> = [
    ["categories.json", categories],
    ["tags.json", tags],
    ["products.json", products],
    ["media.json", media],
    ["errors.json", errors],
  ];
  for (const [name, payload] of writes) {
    const p = resolve(OUT_DIR, name);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, JSON.stringify(payload, null, 2));
    console.log(`[transform] Wrote ${p}`);
  }

  // Summary
  const variantTotal = products.reduce((acc, p) => acc + p.variants.length, 0);
  console.log("\n[transform] === SUMMARY ===");
  console.log(`  categories:   ${categories.length}`);
  console.log(`  tags:         ${tags.length}`);
  console.log(`  products:     ${products.length}`);
  console.log(`  variants:     ${variantTotal}`);
  console.log(`  media:        ${media.length}`);
  console.log(`  errors:       ${errors.length}`);
  if (errors.length) {
    console.log(`  → see data/transformed/errors.json for details`);
  }
}

main().catch((e) => {
  console.error("[transform] FATAL", e);
  process.exit(1);
});
