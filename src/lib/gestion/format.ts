import type { ProductStatus } from "@prisma/client";

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  PUBLISHED: "Publié",
  DRAFT: "Brouillon",
  PRIVATE: "Privé",
  PENDING: "En attente",
  TRASH: "Corbeille",
};

export const STOCK_STATUS_LABEL: Record<string, string> = {
  instock: "En stock",
  outofstock: "Rupture",
  onbackorder: "Sur commande",
};

export function money(value: { toNumber: () => number } | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "number" ? value : value.toNumber();
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n);
}

export function fileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} Mo`;
  return `${Math.round(bytes / 1024)} Ko`;
}

export function shortDate(d: Date): string {
  return d.toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" });
}

export function dateTime(d: Date): string {
  return d.toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
}

/** Lit une chaîne d'un FormData ; "" si absente. */
export const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};
