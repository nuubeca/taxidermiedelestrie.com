"use client";

import { useState } from "react";
import { ActionForm, Feedback, SubmitButton } from "@/components/gestion/forms";
import { ImageInput } from "@/components/gestion/media-input";
import { Field, Panel, inputClass } from "@/components/gestion/ui";
import { slugify } from "@/lib/gestion/format";
import type { ActionResult } from "@/lib/gestion/action-result";
import { cn } from "@/lib/utils";

export type CategoryFormValues = {
  id?: number;
  name: string;
  slug: string;
  description: string;
  parentId: number | null;
  imageUrl: string | null;
  position: number;
};

export function CategoryForm({
  action,
  initial,
  parents,
  submitLabel,
}: {
  action: (prev: ActionResult<unknown> | null, fd: FormData) => Promise<ActionResult<unknown>>;
  initial: CategoryFormValues;
  parents: { id: number; name: string; depth: number }[];
  submitLabel: string;
}) {
  const [slug, setSlug] = useState(initial.slug);
  const [touched, setTouched] = useState(Boolean(initial.slug));
  return (
    <ActionForm
      action={action}
      className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      footer={(state) => (
        <div className="flex flex-wrap items-center gap-3 lg:col-span-3">
          <SubmitButton>{submitLabel}</SubmitButton>
          <Feedback state={state} successMessage="Catégorie enregistrée." />
        </div>
      )}
    >
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <Panel title="Informations" className="lg:col-span-2">
        <div className="flex flex-col gap-4">
          <Field label="Nom" htmlFor="name">
            <input id="name" name="name" required defaultValue={initial.name} onChange={(e) => !touched && setSlug(slugify(e.target.value))} className={inputClass} />
          </Field>
          <Field label="Adresse de la page" htmlFor="slug" hint={`/catalogue/${slug || "nom-de-la-categorie"}`}>
            <input id="slug" name="slug" value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setTouched(true); }} className={cn(inputClass, "font-mono")} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Catégorie parente" htmlFor="parentId" className="sm:col-span-2">
              <select id="parentId" name="parentId" defaultValue={initial.parentId ?? ""} className={inputClass}>
                <option value="">Aucune (premier niveau)</option>
                {parents.map((p) => <option key={p.id} value={p.id}>{"   ".repeat(p.depth)}{p.name}</option>)}
              </select>
            </Field>
            <Field label="Ordre" htmlFor="position" hint="Plus petit = en premier.">
              <input id="position" name="position" type="number" min={0} defaultValue={initial.position} className={cn(inputClass, "font-mono")} />
            </Field>
          </div>
          <Field label="Description" htmlFor="description">
            <textarea id="description" name="description" rows={5} defaultValue={initial.description} className={inputClass} />
          </Field>
        </div>
      </Panel>
      <Panel title="Image">
        <ImageInput name="imageUrl" defaultValue={initial.imageUrl} label="Image de la catégorie" />
      </Panel>
    </ActionForm>
  );
}
