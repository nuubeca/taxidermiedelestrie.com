"use client";

import { useMemo, useState } from "react";
import { Caption } from "@/components/ui/Caption";
import { cn, formatPrice } from "@/lib/utils";

type Variant = {
  id: number;
  sku: string | null;
  price: number | null;
  stockStatus: string;
  attributes: Record<string, string>;
  enabled: boolean;
};

type Attribute = {
  slug: string;
  name: string;
  options: string[];
  isVariation: boolean;
};

type Props = {
  attributes: Attribute[];
  variants: Variant[];
  basePrice: number | null;
  baseStockStatus: string;
};

export function VariantSelector({
  attributes,
  variants,
  basePrice,
  baseStockStatus,
}: Props) {
  const variationAttrs = attributes.filter((a) => a.isVariation && a.options.length > 0);

  const [selection, setSelection] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const attr of variationAttrs) {
      if (attr.options[0]) initial[attr.slug] = attr.options[0];
    }
    return initial;
  });

  const matched = useMemo(() => {
    if (variants.length === 0) return null;
    return (
      variants.find((v) => {
        if (!v.enabled) return false;
        return Object.entries(selection).every(
          ([slug, value]) => v.attributes?.[slug] === value,
        );
      }) ?? null
    );
  }, [variants, selection]);

  const displayPrice = matched?.price ?? basePrice;
  const displayStock = matched?.stockStatus ?? baseStockStatus;
  const displaySku = matched?.sku ?? null;
  const inStock = displayStock === "instock";

  return (
    <div className="flex flex-col gap-8">
      {/* Price block */}
      <div className="border-y border-rule py-6">
        <Caption className="block mb-2">Prix</Caption>
        <div className="flex items-baseline gap-4">
          <span className="font-serif text-4xl text-ink">
            {displayPrice !== null ? formatPrice(displayPrice) : "Sur demande"}
          </span>
          <span
            className={cn(
              "font-mono text-[0.7rem] uppercase tracking-museum px-2 py-1",
              inStock ? "bg-moss/15 text-moss" : "bg-terracotta/15 text-terracotta",
            )}
          >
            {inStock ? "En stock" : "Rupture"}
          </span>
        </div>
        {displaySku && (
          <div className="mt-3 font-mono text-xs text-ink-subtle">SKU · {displaySku}</div>
        )}
      </div>

      {/* Variation pickers */}
      {variationAttrs.length > 0 && (
        <div className="flex flex-col gap-6">
          {variationAttrs.map((attr) => (
            <div key={attr.slug}>
              <div className="flex items-baseline justify-between mb-3">
                <Caption tone="strong">{attr.name}</Caption>
                <Caption>{selection[attr.slug] ?? "—"}</Caption>
              </div>
              <ul className="flex flex-wrap gap-2">
                {attr.options.map((opt) => {
                  const active = selection[attr.slug] === opt;
                  return (
                    <li key={opt}>
                      <button
                        type="button"
                        onClick={() =>
                          setSelection((s) => ({ ...s, [attr.slug]: opt }))
                        }
                        className={cn(
                          "px-4 py-2 border font-mono text-xs uppercase tracking-wider transition-colors",
                          active
                            ? "bg-ink text-bg border-ink"
                            : "border-rule text-ink hover:border-ink",
                        )}
                      >
                        {opt}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={!inStock}
          className={cn(
            "h-14 w-full font-mono text-xs uppercase tracking-museum transition-colors",
            inStock
              ? "bg-ink text-bg hover:bg-ink-muted"
              : "bg-bg-alt text-ink-subtle cursor-not-allowed",
          )}
        >
          {inStock ? "Demander un devis" : "Indisponible"}
        </button>
        <p className="text-xs text-ink-subtle text-center">
          Disponible en magasin ou par livraison · Paiement à la commande
        </p>
      </div>
    </div>
  );
}
