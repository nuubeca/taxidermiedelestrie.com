export type CartLine = {
  /** Clé unique : `${productId}:${variantId ?? 0}` */
  key: string;
  productId: number;
  variantId: number | null;
  slug: string;
  categorySlug: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  attributes: Record<string, string>;
  /** Prix unitaire affiché au moment de l'ajout (avant taxes). Revalidé côté serveur à la commande. */
  unitPrice: number | null;
  quantity: number;
};

export const CART_STORAGE_KEY = "tde-cart-v1";

export function lineKey(productId: number, variantId: number | null): string {
  return `${productId}:${variantId ?? 0}`;
}
