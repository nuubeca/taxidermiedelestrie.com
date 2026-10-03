"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { ActionForm, ConfirmButton, Feedback, SubmitButton } from "@/components/gestion/forms";
import { buttonClass, inputClass } from "@/components/gestion/ui";
import { cn } from "@/lib/utils";
import { deleteTag, renameTag } from "./actions";

export function TagRow({ id, name, slug, count }: { id: number; name: string; slug: string; count: number }) {
  const [editing, setEditing] = useState(false);
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
      {editing ? (
        <ActionForm
          action={async (prev, fd) => {
            const r = await renameTag(prev, fd);
            if (r.success) setEditing(false);
            return r;
          }}
          className="flex flex-1 flex-wrap items-center gap-2"
          footer={(state) => <Feedback state={state} />}
        >
          <input type="hidden" name="id" value={id} />
          <input name="name" defaultValue={name} autoFocus aria-label="Nouveau nom" className={cn(inputClass, "max-w-xs")} />
          <SubmitButton variant="secondary" pendingLabel="…"><Check className="h-4 w-4" aria-hidden /> Enregistrer</SubmitButton>
          <button type="button" onClick={() => setEditing(false)} className={buttonClass.ghost} aria-label="Annuler"><X className="h-4 w-4" aria-hidden /></button>
        </ActionForm>
      ) : (
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink">{name}</p>
          <p className="font-mono text-xs text-ink-muted">{slug} · {count} produit{count > 1 ? "s" : ""}</p>
        </div>
      )}
      {!editing ? (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setEditing(true)} className={buttonClass.ghost}><Pencil className="h-4 w-4" aria-hidden /> Renommer</button>
          <ConfirmButton onConfirm={deleteTag.bind(null, id)} variant="ghost" label="Supprimer" confirmLabel="Supprimer" />
        </div>
      ) : null}
    </li>
  );
}
