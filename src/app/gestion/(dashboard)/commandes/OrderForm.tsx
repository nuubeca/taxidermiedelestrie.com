"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Loader2, Minus, Package, Plus, Search, Trash2 } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { ActionForm, SubmitButton, Feedback } from "@/components/gestion/forms";
import { Field, Panel, buttonClass, inputClass } from "@/components/gestion/ui";
import { ORDER_STATUS_LABEL } from "@/lib/orders/format";
import { cn } from "@/lib/utils";
import { searchCatalog, type CatalogHit } from "./actions";
import type { ActionResult } from "@/lib/gestion/action-result";

export type OrderLine = {
  key: string;
  productId: number | null;
  variantId: number | null;
  name: string;
  detail: string | null;
  sku: string | null;
  attributes: Record<string, string> | null;
  quantity: number;
  unitPrice: number;
};

export type OrderFormValues = {
  orderId?: number;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  fulfillment: "PICKUP" | "DELIVERY";
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  customerNote: string;
  lines: OrderLine[];
};

const money = (n: number) => new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n);

function CatalogSearch({ onAdd }: { onAdd: (hit: CatalogHit) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<CatalogHit[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(() => {
      start(async () => {
        const res = await searchCatalog(q);
        if (res.success) {
          setHits(res.data);
          setOpen(true);
        }
      });
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={box} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => hits.length && setOpen(true)}
        placeholder="Ajouter un produit : nom ou SKU" onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        aria-label="Chercher un produit à ajouter"
        className={cn(inputClass, "pl-9")}
      />
      {pending ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-subtle" aria-hidden /> : null}
      {open && hits.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-rule bg-surface py-1 shadow-lg" role="listbox">
          {hits.map((h) => (
            <li key={`${h.productId}-${h.variantId ?? 0}`}>
              <button
                type="button"
                onClick={() => {
                  onAdd(h);
                  setQ("");
                  setOpen(false);
                }}
                className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-bg-alt"
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-bg-alt">
                  {h.imageUrl ? <Image src={h.imageUrl} alt="" fill sizes="40px" className="object-cover" /> : <Package className="m-3 h-4 w-4 text-ink-subtle" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">{h.name}</span>
                  <span className="block truncate text-xs text-ink-muted">{[h.detail, h.sku].filter(Boolean).join(" · ") || "—"}</span>
                </span>
                <span className="font-mono text-sm tabular-nums text-ink">{money(h.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && !pending && q.trim().length >= 2 && hits.length === 0 ? (
        <p className="absolute z-20 mt-1 w-full rounded-xl border border-rule bg-surface px-3 py-3 text-sm text-ink-muted shadow-lg">Aucun produit trouvé.</p>
      ) : null}
    </div>
  );
}

export function OrderForm({
  action,
  initial,
  submitLabel,
  showStatus = false,
}: {
  action: (prev: ActionResult<unknown> | null, fd: FormData) => Promise<ActionResult<unknown>>;
  initial: OrderFormValues;
  submitLabel: string;
  showStatus?: boolean;
}) {
  const [lines, setLines] = useState<OrderLine[]>(initial.lines);
  const [fulfillment, setFulfillment] = useState(initial.fulfillment);
  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0), [lines]);

  const update = (key: string, patch: Partial<OrderLine>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const addHit = (h: CatalogHit) =>
    setLines((ls) => {
      const existing = ls.find((l) => l.productId === h.productId && l.variantId === h.variantId);
      if (existing) return ls.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));
      return [
        ...ls,
        {
          key: `${h.productId}-${h.variantId ?? 0}-${Date.now()}`,
          productId: h.productId,
          variantId: h.variantId,
          name: h.name,
          detail: h.detail,
          sku: h.sku,
          attributes: h.attributes,
          quantity: 1,
          unitPrice: h.price,
        },
      ];
    });

  const payload = JSON.stringify(
    lines.map(({ productId, variantId, name, sku, attributes, quantity, unitPrice }) => ({ productId, variantId, name, sku, attributes, quantity, unitPrice })),
  );

  return (
    <ActionForm
      action={action}
      className="grid grid-cols-1 gap-6 xl:grid-cols-3"
      footer={(state) => (
        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-rule bg-bg/95 px-4 py-3 backdrop-blur xl:col-span-3 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <SubmitButton>{submitLabel}</SubmitButton>
          <Feedback state={state} />
        </div>
      )}
    >
      {initial.orderId ? <input type="hidden" name="orderId" value={initial.orderId} /> : null}
      <input type="hidden" name="lines" value={payload} />

      <div className="flex flex-col gap-6 xl:col-span-2">
        <Panel title="Articles" description="Les prix sont modifiables (rabais, prix convenu au téléphone).">
          <CatalogSearch onAdd={addHit} />
          {lines.length === 0 ? (
            <p className="mt-6 rounded-lg border border-dashed border-rule py-8 text-center text-sm text-ink-muted">Aucun article. Cherchez un produit ci-dessus.</p>
          ) : (
            <ul className="mt-4 divide-y divide-rule">
              {lines.map((l) => (
                <li key={l.key} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{l.name}</p>
                    <p className="truncate text-xs text-ink-muted">{[l.detail, l.sku].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-lg border border-rule">
                      <button type="button" onClick={() => update(l.key, { quantity: Math.max(1, l.quantity - 1) })} className="flex h-9 w-9 cursor-pointer items-center justify-center text-ink-muted hover:text-ink" aria-label="Diminuer la quantité">
                        <Minus className="h-4 w-4" aria-hidden />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={l.quantity}
                        onChange={(e) => update(l.key, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                        aria-label={`Quantité de ${l.name}`}
                        className="h-9 w-14 border-x border-rule bg-transparent text-center font-mono text-sm tabular-nums text-ink focus:outline-none"
                      />
                      <button type="button" onClick={() => update(l.key, { quantity: l.quantity + 1 })} className="flex h-9 w-9 cursor-pointer items-center justify-center text-ink-muted hover:text-ink" aria-label="Augmenter la quantité">
                        <Plus className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={l.unitPrice}
                        onChange={(e) => update(l.key, { unitPrice: Math.max(0, Number(e.target.value) || 0) })}
                        aria-label={`Prix unitaire de ${l.name}`}
                        className={cn(inputClass, "w-28 pr-6 text-right font-mono tabular-nums")}
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-subtle">$</span>
                    </div>
                    <span className="w-24 text-right font-mono text-sm tabular-nums text-ink">{money(l.quantity * l.unitPrice)}</span>
                    <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className={cn(buttonClass.ghost, "hover:text-ochre")} aria-label={`Retirer ${l.name}`}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex justify-end border-t border-rule pt-4 text-sm">
            <span className="mr-6 text-ink-muted">Sous-total avant taxes</span>
            <span className="font-mono font-medium tabular-nums text-ink">{money(subtotal)}</span>
          </div>
        </Panel>

        <Panel title="Note du client">
          <textarea name="customerNote" rows={3} defaultValue={initial.customerNote} aria-label="Note du client" className={inputClass} />
        </Panel>
      </div>

      <div className="flex flex-col gap-6">
        <Panel title="Client" description="Si le courriel correspond à un compte, la commande y est rattachée.">
          <div className="grid grid-cols-1 gap-4">
            <Field label="Courriel" htmlFor="email">
              <input id="email" name="email" type="email" required defaultValue={initial.email} className={inputClass} autoComplete="off" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom" htmlFor="firstName">
                <input id="firstName" name="firstName" defaultValue={initial.firstName} className={inputClass} />
              </Field>
              <Field label="Nom" htmlFor="lastName">
                <input id="lastName" name="lastName" defaultValue={initial.lastName} className={inputClass} />
              </Field>
            </div>
            <Field label="Téléphone" htmlFor="phone">
              <input id="phone" name="phone" type="tel" defaultValue={initial.phone} className={inputClass} />
            </Field>
            <Field label="Entreprise" htmlFor="company">
              <input id="company" name="company" defaultValue={initial.company} className={inputClass} />
            </Field>
          </div>
        </Panel>

        <Panel title="Réception">
          <fieldset className="flex flex-col gap-4">
            <legend className="sr-only">Mode de réception</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["PICKUP", "DELIVERY"] as const).map((f) => (
                <label
                  key={f}
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors",
                    fulfillment === f ? "border-ink bg-bg-alt font-medium text-ink" : "border-rule text-ink-muted hover:text-ink",
                  )}
                >
                  <input type="radio" name="fulfillment" value={f} checked={fulfillment === f} onChange={() => setFulfillment(f)} className="sr-only" />
                  {f === "PICKUP" ? "Cueillette" : "Livraison"}
                </label>
              ))}
            </div>
            <div className={cn("grid grid-cols-1 gap-3", fulfillment === "PICKUP" && "hidden")}>
              <Field label="Adresse" htmlFor="address1">
                <input id="address1" name="address1" defaultValue={initial.address1} className={inputClass} />
              </Field>
              <Field label="Appartement, bureau" htmlFor="address2">
                <input id="address2" name="address2" defaultValue={initial.address2} className={inputClass} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Ville" htmlFor="city" className="col-span-2">
                  <input id="city" name="city" defaultValue={initial.city} className={inputClass} />
                </Field>
                <Field label="Prov." htmlFor="state">
                  <input id="state" name="state" defaultValue={initial.state || "QC"} className={inputClass} />
                </Field>
              </div>
              <Field label="Code postal" htmlFor="postcode">
                <input id="postcode" name="postcode" defaultValue={initial.postcode} className={inputClass} />
              </Field>
            </div>
          </fieldset>
        </Panel>

        {showStatus ? (
          <Panel title="Statut initial">
            <select name="status" defaultValue="RECEIVED" aria-label="Statut initial" className={inputClass}>
              {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
                <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </Panel>
        ) : null}
      </div>
    </ActionForm>
  );
}
