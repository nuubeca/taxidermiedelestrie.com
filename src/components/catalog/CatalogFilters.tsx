"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Caption } from "@/components/ui/Caption";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string; productCount: number };

type Props = {
  categories: Category[];
  activeCategory?: string;
  priceRange: { min: number; max: number };
};

export function CatalogFilters({ categories, activeCategory, priceRange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");
  const inStockOnly = params.get("inStock") === "1";

  useEffect(() => {
    setMinPrice(params.get("minPrice") ?? "");
    setMaxPrice(params.get("maxPrice") ?? "");
  }, [params]);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    startTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    });
  }

  function applyPrices(e: React.FormEvent) {
    e.preventDefault();
    update({ minPrice: minPrice || null, maxPrice: maxPrice || null });
  }

  function reset() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasFilters =
    minPrice !== "" || maxPrice !== "" || inStockOnly || Boolean(activeCategory);

  return (
    <aside
      className={cn(
        "flex flex-col gap-10",
        isPending && "opacity-60 transition-opacity",
      )}
    >
      {/* Categories */}
      <div>
        <Caption className="block mb-4">Catégories</Caption>
        <ul className="flex flex-col gap-1">
          <li>
            <CategoryFilterLink
              href="/catalogue"
              label="Toutes les pièces"
              count={categories.reduce((acc, c) => acc + c.productCount, 0)}
              active={!activeCategory}
            />
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <CategoryFilterLink
                href={`/catalogue/${c.slug}`}
                label={c.name}
                count={c.productCount}
                active={activeCategory === c.slug}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div>
        <Caption className="block mb-4">Prix (CAD)</Caption>
        <form onSubmit={applyPrices} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={priceRange.min}
              max={priceRange.max}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder={`${priceRange.min}`}
              className="w-full bg-transparent border border-rule px-3 py-2 text-sm font-mono focus:outline-none focus:border-ink"
              aria-label="Prix minimum"
            />
            <span className="text-ink-subtle">—</span>
            <input
              type="number"
              inputMode="decimal"
              min={priceRange.min}
              max={priceRange.max}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={`${priceRange.max}`}
              className="w-full bg-transparent border border-rule px-3 py-2 text-sm font-mono focus:outline-none focus:border-ink"
              aria-label="Prix maximum"
            />
          </div>
          <button
            type="submit"
            className="self-start font-mono text-[0.7rem] uppercase tracking-museum text-ink-muted hover:text-ink link-naturalist"
          >
            Appliquer
          </button>
        </form>
      </div>

      {/* Stock */}
      <div>
        <Caption className="block mb-4">Disponibilité</Caption>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => update({ inStock: e.target.checked ? "1" : null })}
            className="h-4 w-4 accent-ink"
          />
          <span className="text-sm text-ink-muted">En stock uniquement</span>
        </label>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={reset}
          className="self-start font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle hover:text-ink link-naturalist"
        >
          ↺ Réinitialiser
        </button>
      )}
    </aside>
  );
}

function CategoryFilterLink({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        "group flex items-baseline justify-between gap-4 py-2 border-b border-rule transition-colors",
        active ? "text-ink" : "text-ink-muted hover:text-ink",
      )}
    >
      <span className={cn("font-serif text-base", active && "italic")}>
        {label}
      </span>
      <span className="font-mono text-[0.7rem] tracking-museum text-ink-subtle">
        {String(count).padStart(2, "0")}
      </span>
    </a>
  );
}
