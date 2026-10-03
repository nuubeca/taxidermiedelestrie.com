"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowUpRight } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { Caption } from "@/components/ui/Caption";
import { formatPrice } from "@/lib/utils";

export function CartView() {
  const { lines, subtotal, hydrated, setQuantity, remove } = useCart();

  if (!hydrated) return <p className="text-ink-subtle">Chargement…</p>;

  if (lines.length === 0) {
    return (
      <p className="text-ink-muted">
        Votre panier est vide.{" "}
        <Link href="/catalogue" className="link-naturalist text-ink">Parcourir le catalogue</Link>
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
      <ul className="lg:col-span-8 divide-y divide-rule border-y border-rule">
        {lines.map((l) => (
          <li key={l.key} className="flex gap-6 py-6">
            <Link href={`/catalogue/${l.categorySlug}/${l.slug}`} className="relative h-24 w-24 shrink-0 bg-bg-alt overflow-hidden">
              {l.imageUrl ? <Image src={l.imageUrl} alt="" fill sizes="96px" className="object-cover" /> : null}
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/catalogue/${l.categorySlug}/${l.slug}`} className="font-serif text-lg text-ink hover:underline">{l.name}</Link>
              {Object.keys(l.attributes).length > 0 ? (
                <p className="mt-1 font-mono text-xs text-ink-muted">{Object.values(l.attributes).join(" · ")}</p>
              ) : null}
              {l.sku ? <p className="mt-1 font-mono text-xs text-ink-subtle">SKU · {l.sku}</p> : null}
              <div className="mt-4 flex items-center gap-4">
                <div className="inline-flex items-center border border-rule">
                  <button type="button" aria-label="Diminuer" onClick={() => setQuantity(l.key, l.quantity - 1)} className="h-9 w-9 inline-flex items-center justify-center hover:bg-bg-alt"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-10 text-center font-mono text-sm">{l.quantity}</span>
                  <button type="button" aria-label="Augmenter" onClick={() => setQuantity(l.key, l.quantity + 1)} className="h-9 w-9 inline-flex items-center justify-center hover:bg-bg-alt"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <button type="button" onClick={() => remove(l.key)} className="inline-flex items-center gap-1 font-mono text-[0.7rem] uppercase tracking-museum text-ink-muted hover:text-terracotta">
                  <Trash2 className="h-3.5 w-3.5" /> Retirer
                </button>
              </div>
            </div>
            <div className="text-right font-mono text-sm whitespace-nowrap">
              {l.unitPrice !== null ? formatPrice(l.unitPrice * l.quantity) : "Sur demande"}
            </div>
          </li>
        ))}
      </ul>

      <aside className="lg:col-span-4">
        <div className="border border-rule p-6 sticky top-32">
          <Caption className="block mb-4">Résumé</Caption>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-ink-muted">Sous-total</span>
            <span className="font-serif text-2xl">{formatPrice(subtotal)}</span>
          </div>
          <p className="text-xs text-ink-subtle mb-6">Prix avant taxes. Transport et taxes confirmés par le commis.</p>
          <Link href="/commande" className="group inline-flex h-14 w-full items-center justify-center gap-2 bg-ink text-bg font-mono text-xs uppercase tracking-museum hover:bg-ink-muted transition-colors">
            Passer la commande
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} />
          </Link>
          <p className="mt-4 text-xs text-ink-subtle text-center">Aucun paiement en ligne. Nous vous contactons pour finaliser.</p>
        </div>
      </aside>
    </div>
  );
}
