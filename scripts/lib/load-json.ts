import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PhpMyAdminEntry, PhpMyAdminTable, WpRow } from "./types";

/**
 * Charge le dump JSON phpMyAdmin et expose une API par nom de table.
 * Le préfixe (ex: "KVmXd_") est retiré pour faciliter les accès.
 */
export class WpDump {
  private tables = new Map<string, WpRow[]>();
  public readonly prefix: string;

  constructor(jsonPath: string, prefix = "KVmXd_") {
    const absPath = resolve(process.cwd(), jsonPath);
    const raw = readFileSync(absPath, "utf-8");
    const entries = JSON.parse(raw) as PhpMyAdminEntry[];
    this.prefix = prefix;

    for (const entry of entries) {
      if (entry.type === "table") {
        const t = entry as PhpMyAdminTable;
        const shortName = t.name.startsWith(prefix) ? t.name.slice(prefix.length) : t.name;
        this.tables.set(shortName, t.data ?? []);
      }
    }
  }

  table(name: string): WpRow[] {
    const t = this.tables.get(name);
    if (!t) throw new Error(`Table ${this.prefix}${name} not found in dump`);
    return t;
  }

  has(name: string): boolean {
    return this.tables.has(name);
  }

  tableNames(): string[] {
    return [...this.tables.keys()];
  }
}

// ---------- Helpers de cast ----------

export function asInt(v: string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

export function asIntStrict(v: string | null | undefined, fallback = 0): number {
  return asInt(v) ?? fallback;
}

export function asDecimalString(v: string | null | undefined): string | null {
  if (v === null || v === undefined || v === "") return null;
  // Garde la string telle quelle pour Prisma Decimal — il accepte les strings.
  // On nettoie juste les espaces et virgules françaises éventuelles.
  const cleaned = v.trim().replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  return cleaned;
}

export function asBool(v: string | null | undefined): boolean {
  if (v === null || v === undefined) return false;
  const s = v.toLowerCase().trim();
  return s === "yes" || s === "true" || s === "1";
}

export function asDate(v: string | null | undefined): string | null {
  if (!v || v === "0000-00-00 00:00:00") return null;
  // MySQL datetime → ISO 8601 (assumed UTC for *_gmt fields, or local otherwise — caller decides)
  const iso = v.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// Décode les entités HTML simples qui apparaissent dans les guid WordPress
export function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "-");
}
