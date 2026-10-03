"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Layers, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { ActionForm, Feedback, SubmitButton } from "@/components/gestion/forms";
import { GalleryInput } from "@/components/gestion/media-input";
import { Checkbox, Field, Panel, buttonClass, inputClass } from "@/components/gestion/ui";
import { PRODUCT_STATUS_LABEL, STOCK_STATUS_LABEL, slugify } from "@/lib/gestion/format";
import type { ActionResult } from "@/lib/gestion/action-result";
import { cn } from "@/lib/utils";

export type AttributeValue = { key: string; id: number | null; name: string; options: string[]; isVariation: boolean; isVisible: boolean };
export type VariantValue = {
  key: string;
  id: number | null;
  attributes: Record<string, string>; // clé = attribut.key (côté formulaire)
  sku: string;
  regularPrice: string;
  salePrice: string;
  manageStock: boolean;
  stockQuantity: string;
  stockStatus: string;
  enabled: boolean;
  imageUrl: string | null;
};

export type ProductFormValues = {
  id?: number;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  status: "PUBLISHED" | "DRAFT" | "PRIVATE" | "PENDING";
  featured: boolean;
  sku: string;
  regularPrice: string;
  salePrice: string;
  manageStock: boolean;
  stockQuantity: string;
  stockStatus: string;
  weight: string;
  metaTitle: string;
  metaDescription: string;
  primaryImageUrl: string | null;
  galleryImageUrls: string[];
  categoryIds: number[];
  tagIds: number[];
  attributes: AttributeValue[];
  variants: VariantValue[];
};

type CategoryOption = { id: number; name: string; depth: number };
type TagOption = { id: number; name: string };

const STOCK_OPTIONS = ["instock", "outofstock", "onbackorder"] as const;
const uid = () => Math.random().toString(36).slice(2, 10);

function PriceInput({ id, name, value, onChange, defaultValue, label }: { id: string; name?: string; value?: string; onChange?: (v: string) => void; defaultValue?: string; label: string }) {
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        inputMode="decimal"
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        aria-label={label}
        placeholder="0,00"
        className={cn(inputClass, "pr-7 text-right font-mono tabular-nums")}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-subtle">$</span>
    </div>
  );
}

/* ─── Description HTML avec aperçu ─────────────────────────── */

function HtmlField({ name, label, defaultValue, rows }: { name: string; label: string; defaultValue: string; rows: number }) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-sm font-medium text-ink">{label}</label>
        <button type="button" onClick={() => setPreview((p) => !p)} className={cn(buttonClass.ghost, "h-8")} aria-pressed={preview}>
          <Eye className="h-4 w-4" aria-hidden /> {preview ? "Modifier" : "Aperçu"}
        </button>
      </div>
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={cn(inputClass, "font-mono text-[13px] leading-relaxed", preview && "hidden")}
      />
      {preview ? (
        <div className="prose-naturalist min-h-24 rounded-lg border border-rule bg-bg p-4 text-sm" dangerouslySetInnerHTML={{ __html: value || "<p><em>Vide</em></p>" }} />
      ) : null}
      <p className="text-xs text-ink-muted">Texte simple ou HTML (paragraphes &lt;p&gt;, listes &lt;ul&gt;, gras &lt;strong&gt;).</p>
    </div>
  );
}

/* ─── Sélecteurs de catégories et d'étiquettes ─────────────── */

function CategoryPicker({ options, selected }: { options: CategoryOption[]; selected: number[] }) {
  const [q, setQ] = useState("");
  const [checked, setChecked] = useState<number[]>(selected);
  const term = q.trim().toLowerCase();
  const visible = term ? options.filter((o) => o.name.toLowerCase().includes(term)) : options;
  return (
    <div className="flex flex-col gap-3">
      {checked.map((id) => <input key={id} type="hidden" name="categoryIds" value={id} />)}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer les catégories" onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} aria-label="Filtrer les catégories" className={cn(inputClass, "pl-9")} />
      </div>
      <ul className="max-h-72 overflow-y-auto rounded-lg border border-rule bg-bg p-1">
        {visible.map((o) => {
          const on = checked.includes(o.id);
          return (
            <li key={o.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bg-alt" style={{ paddingLeft: term ? 8 : 8 + o.depth * 16 }}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => setChecked((c) => (on ? c.filter((x) => x !== o.id) : [...c, o.id]))}
                  className="h-4 w-4 accent-[rgb(var(--ochre))]"
                />
                <span className={cn(on ? "text-ink" : "text-ink-muted")}>{o.name}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-ink-muted">{checked.length} sélectionnée{checked.length > 1 ? "s" : ""}</p>
    </div>
  );
}

function TagPicker({ options, selected }: { options: TagOption[]; selected: number[] }) {
  const [q, setQ] = useState("");
  const [ids, setIds] = useState<number[]>(selected);
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const term = q.trim().toLowerCase();
  const matches = term ? options.filter((o) => !ids.includes(o.id) && o.name.toLowerCase().includes(term)).slice(0, 8) : [];
  return (
    <div className="flex flex-col gap-3">
      {ids.map((id) => <input key={id} type="hidden" name="tagIds" value={id} />)}
      {ids.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {ids.map((id) => (
            <li key={id} className="inline-flex items-center gap-1 rounded-md bg-bg-alt py-0.5 pl-2 pr-1 text-xs text-ink">
              {byId.get(id)?.name ?? id}
              <button type="button" onClick={() => setIds((x) => x.filter((y) => y !== id))} className="cursor-pointer rounded p-0.5 text-ink-muted hover:text-ochre" aria-label={`Retirer ${byId.get(id)?.name ?? ""}`}>
                <X className="h-3 w-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="relative">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ajouter une étiquette" onKeyDown={(e) => e.key === "Enter" && e.preventDefault()} aria-label="Ajouter une étiquette" className={inputClass} />
        {matches.length ? (
          <ul className="absolute z-20 mt-1 w-full rounded-lg border border-rule bg-surface py-1 shadow-lg">
            {matches.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => { setIds((x) => [...x, m.id]); setQ(""); }} className="w-full cursor-pointer px-3 py-1.5 text-left text-sm hover:bg-bg-alt">
                  {m.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Attributs et variantes ───────────────────────────────── */

function OptionsInput({ options, onChange, label }: { options: string[]; onChange: (o: string[]) => void; label: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...options, ...parts.filter((p) => !options.includes(p))]);
    setDraft("");
  };
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <li key={o} className="inline-flex items-center gap-1 rounded-md border border-rule bg-bg py-0.5 pl-2 pr-1 text-xs text-ink">
            {o}
            <button type="button" onClick={() => onChange(options.filter((x) => x !== o))} className="cursor-pointer rounded p-0.5 text-ink-muted hover:text-ochre" aria-label={`Retirer la valeur ${o}`}>
              <X className="h-3 w-3" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder="Ajouter des valeurs (Entrée ou virgule)"
        aria-label={label}
        className={inputClass}
      />
    </div>
  );
}

function VariationsEditor({
  attributes,
  setAttributes,
  variants,
  setVariants,
}: {
  attributes: AttributeValue[];
  setAttributes: React.Dispatch<React.SetStateAction<AttributeValue[]>>;
  variants: VariantValue[];
  setVariants: React.Dispatch<React.SetStateAction<VariantValue[]>>;
}) {
  const varAttrs = attributes.filter((a) => a.isVariation && a.options.length > 0);
  const updAttr = (key: string, patch: Partial<AttributeValue>) => setAttributes((as) => as.map((a) => (a.key === key ? { ...a, ...patch } : a)));
  const updVar = (key: string, patch: Partial<VariantValue>) => setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  const generate = () => {
    if (!varAttrs.length) return;
    const combos = varAttrs.reduce<Record<string, string>[]>(
      (acc, a) => acc.flatMap((c) => a.options.map((o) => ({ ...c, [a.key]: o }))),
      [{}],
    );
    setVariants((vs) => {
      const sig = (attrs: Record<string, string>) => varAttrs.map((a) => attrs[a.key] ?? "").join("|");
      const existing = new Set(vs.map((v) => sig(v.attributes)));
      const added = combos
        .filter((c) => !existing.has(sig(c)))
        .map((c) => ({ key: uid(), id: null, attributes: c, sku: "", regularPrice: "", salePrice: "", manageStock: false, stockQuantity: "", stockStatus: "instock", enabled: true, imageUrl: null }));
      return [...vs, ...added];
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {attributes.map((a) => (
          <div key={a.key} className="rounded-lg border border-rule bg-bg p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Nom de l'attribut" htmlFor={`attr-${a.key}`} className="flex-1">
                <input id={`attr-${a.key}`} value={a.name} onChange={(e) => updAttr(a.key, { name: e.target.value })} placeholder="Ex. : Grandeur (mm)" className={inputClass} />
              </Field>
              <button
                type="button"
                onClick={() => {
                  setAttributes((as) => as.filter((x) => x.key !== a.key));
                  setVariants((vs) => vs.map((v) => { const { [a.key]: _removed, ...rest } = v.attributes; return { ...v, attributes: rest }; }));
                }}
                className={cn(buttonClass.ghost, "hover:text-ochre")}
              >
                <Trash2 className="h-4 w-4" aria-hidden /> Retirer
              </button>
            </div>
            <OptionsInput options={a.options} onChange={(options) => updAttr(a.key, { options })} label={`Valeurs de ${a.name || "l'attribut"}`} />
            <div className="mt-3 flex flex-wrap gap-6 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-ink">
                <input type="checkbox" checked={a.isVariation} onChange={(e) => updAttr(a.key, { isVariation: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--ochre))]" />
                Sert à créer des variantes
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-ink">
                <input type="checkbox" checked={a.isVisible} onChange={(e) => updAttr(a.key, { isVisible: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--ochre))]" />
                Visible sur la fiche
              </label>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setAttributes((as) => [...as, { key: uid(), id: null, name: "", options: [], isVariation: true, isVisible: true }])} className={buttonClass.secondary}>
            <Plus className="h-4 w-4" aria-hidden /> Ajouter un attribut
          </button>
          {varAttrs.length ? (
            <button type="button" onClick={generate} className={buttonClass.secondary}>
              <Sparkles className="h-4 w-4" aria-hidden /> Créer les combinaisons manquantes
            </button>
          ) : null}
        </div>
      </div>

      {variants.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-rule">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-bg-alt/60 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Variante</th>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">Prix</th>
                <th className="px-3 py-2 font-medium">Solde</th>
                <th className="px-3 py-2 font-medium">Stock</th>
                <th className="px-3 py-2 font-medium">Active</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {variants.map((v) => (
                <tr key={v.key} className={cn(!v.enabled && "opacity-60")}>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      {varAttrs.map((a) => (
                        <select
                          key={a.key}
                          value={v.attributes[a.key] ?? ""}
                          onChange={(e) => updVar(v.key, { attributes: { ...v.attributes, [a.key]: e.target.value } })}
                          aria-label={`${a.name} de la variante`}
                          className={cn(inputClass, "h-8 py-0")}
                        >
                          <option value="">{a.name} : toutes</option>
                          {a.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2"><input value={v.sku} onChange={(e) => updVar(v.key, { sku: e.target.value })} aria-label="SKU de la variante" className={cn(inputClass, "w-28 font-mono")} /></td>
                  <td className="px-3 py-2 w-28"><PriceInput id={`vr-${v.key}`} value={v.regularPrice} onChange={(x) => updVar(v.key, { regularPrice: x })} label="Prix de la variante" /></td>
                  <td className="px-3 py-2 w-28"><PriceInput id={`vs-${v.key}`} value={v.salePrice} onChange={(x) => updVar(v.key, { salePrice: x })} label="Prix soldé de la variante" /></td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <label className="flex items-center gap-1.5 text-xs text-ink-muted">
                        <input type="checkbox" checked={v.manageStock} onChange={(e) => updVar(v.key, { manageStock: e.target.checked })} className="h-3.5 w-3.5 accent-[rgb(var(--ochre))]" />
                        Quantité
                      </label>
                      {v.manageStock ? (
                        <input inputMode="numeric" value={v.stockQuantity} onChange={(e) => updVar(v.key, { stockQuantity: e.target.value })} aria-label="Quantité en stock" className={cn(inputClass, "h-8 w-20 py-0 font-mono")} />
                      ) : (
                        <select value={v.stockStatus} onChange={(e) => updVar(v.key, { stockStatus: e.target.value })} aria-label="État du stock" className={cn(inputClass, "h-8 py-0")}>
                          {STOCK_OPTIONS.map((s) => <option key={s} value={s}>{STOCK_STATUS_LABEL[s]}</option>)}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={v.enabled} onChange={(e) => updVar(v.key, { enabled: e.target.checked })} aria-label="Variante active" className="h-4 w-4 accent-[rgb(var(--ochre))]" />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => setVariants((vs) => vs.filter((x) => x.key !== v.key))} className={cn(buttonClass.ghost, "hover:text-ochre")} aria-label="Supprimer la variante">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {varAttrs.length ? (
        <button
          type="button"
          onClick={() => setVariants((vs) => [...vs, { key: uid(), id: null, attributes: {}, sku: "", regularPrice: "", salePrice: "", manageStock: false, stockQuantity: "", stockStatus: "instock", enabled: true, imageUrl: null }])}
          className={cn(buttonClass.ghost, "self-start")}
        >
          <Plus className="h-4 w-4" aria-hidden /> Ajouter une variante
        </button>
      ) : null}
    </div>
  );
}

/* ─── Formulaire ───────────────────────────────────────────── */

export function ProductForm({
  action,
  initial,
  categories,
  tags,
  submitLabel,
  version,
}: {
  action: (prev: ActionResult<unknown> | null, fd: FormData) => Promise<ActionResult<unknown>>;
  initial: ProductFormValues;
  categories: CategoryOption[];
  tags: TagOption[];
  submitLabel: string;
  /** Change à chaque enregistrement : resynchronise attributs et variantes (nouveaux id). */
  version?: string;
}) {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [manageStock, setManageStock] = useState(initial.manageStock);
  const [attributes, setAttributes] = useState<AttributeValue[]>(initial.attributes);
  const [variants, setVariants] = useState<VariantValue[]>(initial.variants);
  const hasVariants = variants.length > 0;

  useEffect(() => {
    if (!version) return;
    setAttributes(initial.attributes);
    setVariants(initial.variants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  // Les clés internes des attributs deviennent les slugs attendus en base.
  const slugOf = useMemo(() => new Map(attributes.map((a) => [a.key, slugify(a.name) || a.key])), [attributes]);
  const toNum = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
  const attributesJson = JSON.stringify(
    attributes.filter((a) => a.name.trim()).map((a) => ({ id: a.id, name: a.name.trim(), slug: slugOf.get(a.key), options: a.options, isVariation: a.isVariation, isVisible: a.isVisible })),
  );
  const variantsJson = JSON.stringify(
    variants.map((v) => ({
      id: v.id,
      attributes: Object.fromEntries(Object.entries(v.attributes).filter(([, val]) => val).map(([k, val]) => [slugOf.get(k) ?? k, val])),
      sku: v.sku,
      regularPrice: toNum(v.regularPrice),
      salePrice: toNum(v.salePrice),
      manageStock: v.manageStock,
      stockQuantity: v.manageStock ? toNum(v.stockQuantity) : null,
      stockStatus: v.stockStatus,
      enabled: v.enabled,
      imageUrl: v.imageUrl,
    })),
  );

  return (
    <ActionForm
      action={action}
      successMessage="Produit enregistré."
      className="grid grid-cols-1 gap-6 xl:grid-cols-3"
      footer={(state) => (
        <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-rule bg-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 xl:col-span-3">
          <SubmitButton>{submitLabel}</SubmitButton>
          <Feedback state={state} successMessage="Produit enregistré." />
        </div>
      )}
    >
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="attributes" value={attributesJson} />
      <input type="hidden" name="variants" value={variantsJson} />

      <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">
        <Panel title="Informations">
          <div className="flex flex-col gap-4">
            <Field label="Nom du produit" htmlFor="name">
              <input
                id="name"
                name="name"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                className={cn(inputClass, "text-base")}
              />
            </Field>
            <Field label="Adresse de la page" htmlFor="slug" hint={`/catalogue/…/${slug || "nom-du-produit"}`}>
              <input id="slug" name="slug" value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} className={cn(inputClass, "font-mono")} />
            </Field>
            <HtmlField name="shortDescription" label="Résumé" defaultValue={initial.shortDescription} rows={3} />
            <HtmlField name="description" label="Description complète" defaultValue={initial.description} rows={10} />
          </div>
        </Panel>

        <Panel title="Images" description="La première image est l'image principale. Glissez des photos ou choisissez-les dans la médiathèque.">
          <GalleryInput primary={initial.primaryImageUrl} gallery={initial.galleryImageUrls} />
        </Panel>

        <Panel title="Prix et inventaire" description={hasVariants ? "Ce produit a des variantes : prix et stock se gèrent par variante, plus bas." : undefined}>
          <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", hasVariants && "hidden")}>
            <Field label="Prix régulier" htmlFor="regularPrice">
              <PriceInput id="regularPrice" name="regularPrice" defaultValue={initial.regularPrice} label="Prix régulier" />
            </Field>
            <Field label="Prix soldé" htmlFor="salePrice" hint="Laissez vide s'il n'y a pas de solde.">
              <PriceInput id="salePrice" name="salePrice" defaultValue={initial.salePrice} label="Prix soldé" />
            </Field>
            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
                <input type="checkbox" name="manageStock" checked={manageStock} onChange={(e) => setManageStock(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--ochre))]" />
                Suivre la quantité en stock
              </label>
            </div>
            {manageStock ? (
              <Field label="Quantité en stock" htmlFor="stockQuantity">
                <input id="stockQuantity" name="stockQuantity" inputMode="numeric" defaultValue={initial.stockQuantity} className={cn(inputClass, "font-mono")} />
              </Field>
            ) : (
              <Field label="État du stock" htmlFor="stockStatus">
                <select id="stockStatus" name="stockStatus" defaultValue={initial.stockStatus} className={inputClass}>
                  {STOCK_OPTIONS.map((s) => <option key={s} value={s}>{STOCK_STATUS_LABEL[s]}</option>)}
                </select>
              </Field>
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="SKU" htmlFor="sku" hint="Code interne du produit.">
              <input id="sku" name="sku" defaultValue={initial.sku} className={cn(inputClass, "font-mono")} />
            </Field>
            <Field label="Poids (kg)" htmlFor="weight">
              <input id="weight" name="weight" inputMode="decimal" defaultValue={initial.weight} className={cn(inputClass, "font-mono")} />
            </Field>
          </div>
        </Panel>

        <Panel
          title={<span className="inline-flex items-center gap-2"><Layers className="h-4 w-4" aria-hidden />Attributs et variantes</span>}
          description="Ex. : Grandeur (mm) avec 12, 14, 16. Chaque combinaison devient une variante avec son prix et son stock."
        >
          <VariationsEditor attributes={attributes} setAttributes={setAttributes} variants={variants} setVariants={setVariants} />
        </Panel>

        <Panel title="Référencement Google" description="Optionnel. Par défaut, le nom et le résumé sont utilisés.">
          <div className="flex flex-col gap-4">
            <Field label="Titre" htmlFor="metaTitle">
              <input id="metaTitle" name="metaTitle" defaultValue={initial.metaTitle} maxLength={200} className={inputClass} />
            </Field>
            <Field label="Description" htmlFor="metaDescription">
              <textarea id="metaDescription" name="metaDescription" rows={2} defaultValue={initial.metaDescription} maxLength={400} className={inputClass} />
            </Field>
          </div>
        </Panel>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <Panel title="Publication">
          <div className="flex flex-col gap-4">
            <Field label="Statut" htmlFor="status">
              <select id="status" name="status" defaultValue={initial.status} className={inputClass}>
                {(["PUBLISHED", "DRAFT", "PRIVATE", "PENDING"] as const).map((s) => <option key={s} value={s}>{PRODUCT_STATUS_LABEL[s]}</option>)}
              </select>
            </Field>
            <Checkbox name="featured" label="Produit vedette" hint="Mis en avant sur l'accueil." defaultChecked={initial.featured} />
          </div>
        </Panel>
        <Panel title="Catégories">
          <CategoryPicker options={categories} selected={initial.categoryIds} />
        </Panel>
        <Panel title="Étiquettes">
          <TagPicker options={tags} selected={initial.tagIds} />
        </Panel>
      </div>
    </ActionForm>
  );
}
