"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { Caption } from "@/components/ui/Caption";
import { formatPrice, cn } from "@/lib/utils";
import type { AddressSnapshot } from "@/lib/orders/format";
import { placeOrder, type ActionResult } from "./actions";

const INPUT =
  "bg-transparent border-b border-rule px-0 py-3 text-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink transition-colors w-full";

type Defaults = { firstName: string; lastName: string; company: string; phone: string; shipping: AddressSnapshot | null };

export function CheckoutForm({ email, defaults }: { email: string; defaults: Defaults }) {
  const { lines, subtotal, hydrated, clear } = useCart();
  const [state, formAction] = useActionState<ActionResult | null, FormData>(placeOrder, null);
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">(defaults.shipping?.address1 ? "DELIVERY" : "PICKUP");

  // L'action redirige en cas de succès : si on revient ici avec success, on vide par sécurité.
  useEffect(() => {
    if (state?.success) clear();
  }, [state, clear]);

  if (!hydrated) return <p className="text-ink-subtle">Chargement…</p>;
  if (lines.length === 0) {
    return (
      <p className="text-ink-muted">
        Votre panier est vide. <Link href="/catalogue" className="link-naturalist text-ink">Parcourir le catalogue</Link>
      </p>
    );
  }

  const payload = JSON.stringify(lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })));

  return (
    <form action={formAction} className="grid grid-cols-1 gap-12 lg:grid-cols-12">
      <input type="hidden" name="lines" value={payload} />

      <div className="lg:col-span-7 flex flex-col gap-10">
        <fieldset className="flex flex-col gap-6">
          <Caption tone="strong">Vos coordonnées</Caption>
          <p className="text-sm text-ink-muted">Connecté avec <span className="text-ink">{email}</span></p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field id="firstName" label="Prénom" required><input id="firstName" name="firstName" required defaultValue={defaults.firstName} autoComplete="given-name" className={INPUT} /></Field>
            <Field id="lastName" label="Nom" required><input id="lastName" name="lastName" required defaultValue={defaults.lastName} autoComplete="family-name" className={INPUT} /></Field>
            <Field id="phone" label="Téléphone" required><input id="phone" name="phone" type="tel" required defaultValue={defaults.phone} autoComplete="tel" className={INPUT} placeholder="819-000-0000" /></Field>
            <Field id="company" label="Entreprise"><input id="company" name="company" defaultValue={defaults.company} autoComplete="organization" className={INPUT} /></Field>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-6">
          <Caption tone="strong">Réception</Caption>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {(["PICKUP", "DELIVERY"] as const).map((v) => (
              <label key={v} className={cn("cursor-pointer border p-4 transition-colors", fulfillment === v ? "border-ink bg-bg-alt" : "border-rule hover:border-ink")}>
                <input type="radio" name="fulfillment" value={v} checked={fulfillment === v} onChange={() => setFulfillment(v)} className="sr-only" />
                <span className="block font-serif text-lg">{v === "PICKUP" ? "Cueillette en boutique" : "Livraison"}</span>
                <span className="block mt-1 text-xs text-ink-muted">{v === "PICKUP" ? "3331 rue King Est, Sherbrooke" : "Frais de transport confirmés par le commis"}</span>
              </label>
            ))}
          </div>

          {fulfillment === "DELIVERY" ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2"><Field id="address1" label="Adresse" required><input id="address1" name="address1" required defaultValue={defaults.shipping?.address1 ?? ""} autoComplete="address-line1" className={INPUT} /></Field></div>
              <div className="md:col-span-2"><Field id="address2" label="Appartement, suite"><input id="address2" name="address2" defaultValue={defaults.shipping?.address2 ?? ""} autoComplete="address-line2" className={INPUT} /></Field></div>
              <Field id="city" label="Ville" required><input id="city" name="city" required defaultValue={defaults.shipping?.city ?? ""} autoComplete="address-level2" className={INPUT} /></Field>
              <Field id="state" label="Province" required><input id="state" name="state" required defaultValue={defaults.shipping?.state ?? "QC"} autoComplete="address-level1" className={INPUT} /></Field>
              <Field id="postcode" label="Code postal" required><input id="postcode" name="postcode" required defaultValue={defaults.shipping?.postcode ?? ""} autoComplete="postal-code" className={INPUT} /></Field>
              <label className="flex items-center gap-3 self-end pb-3 text-sm text-ink-muted">
                <input type="checkbox" name="saveAddress" defaultChecked className="h-4 w-4 accent-ink" />
                Retenir cette adresse
              </label>
            </div>
          ) : null}
        </fieldset>

        <Field id="customerNote" label="Note pour le commis">
          <textarea id="customerNote" name="customerNote" rows={4} className={`${INPUT} text-base resize-none`} placeholder="Précisions, urgence, questions…" />
        </Field>

        {state && !state.success ? (
          <div role="alert" className="border border-terracotta bg-terracotta/10 p-4">
            <Caption tone="strong" className="text-terracotta">{state.error}</Caption>
          </div>
        ) : null}
      </div>

      <aside className="lg:col-span-5">
        <div className="border border-rule p-6 sticky top-32">
          <Caption className="block mb-4">Votre commande</Caption>
          <ul className="divide-y divide-rule mb-4">
            {lines.map((l) => (
              <li key={l.key} className="flex justify-between gap-4 py-3 text-sm">
                <span>
                  {l.name}
                  {Object.keys(l.attributes).length ? <span className="block font-mono text-xs text-ink-muted">{Object.values(l.attributes).join(" · ")}</span> : null}
                  <span className="block font-mono text-xs text-ink-subtle">× {l.quantity}</span>
                </span>
                <span className="font-mono whitespace-nowrap">{l.unitPrice !== null ? formatPrice(l.unitPrice * l.quantity) : "Sur demande"}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t border-rule pt-4">
            <span className="text-ink-muted">Sous-total</span>
            <span className="font-serif text-2xl">{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-2 mb-6 text-xs text-ink-subtle">Avant taxes et transport. Aucun paiement en ligne.</p>
          <SubmitButton />
          <Link href="/panier" className="mt-4 block text-center font-mono text-[0.7rem] uppercase tracking-museum text-ink-muted hover:text-ink">Modifier le panier</Link>
        </div>
      </aside>
    </form>
  );
}

function Field({ id, label, required, children }: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-mono text-[0.7rem] uppercase tracking-museum text-ink-muted">
        {label}{required ? <span className="text-terracotta ml-1">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="group inline-flex h-14 w-full items-center justify-center gap-2 bg-ink text-bg font-mono text-xs uppercase tracking-museum hover:bg-ink-muted transition-colors disabled:opacity-60 disabled:cursor-wait">
      <span>{pending ? "Envoi…" : "Envoyer ma commande"}</span>
      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} />
    </button>
  );
}
