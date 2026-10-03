"use client";

import { useTransition } from "react";
import { Check, Loader2, Printer } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABEL } from "@/lib/orders/format";
import { ActionForm, SubmitButton, Feedback } from "@/components/gestion/forms";
import { buttonClass, inputClass } from "@/components/gestion/ui";
import { cn } from "@/lib/utils";
import { addOrderNote, setOrderStatus } from "../actions";

const FLOW: OrderStatus[] = ["RECEIVED", "PROCESSING", "COMPLETED"];

/** Étapes de la commande : un clic fait avancer (ou revenir) le statut. */
export function StatusStepper({ orderId, status }: { orderId: number; status: OrderStatus }) {
  const [pending, start] = useTransition();
  const current = FLOW.indexOf(status);
  const cancelled = status === "CANCELLED";
  const set = (s: OrderStatus) => start(async () => void (await setOrderStatus(orderId, s)));

  return (
    <div className="flex flex-col gap-3">
      <ol className="grid grid-cols-3 gap-2">
        {FLOW.map((s, i) => {
          const done = !cancelled && i <= current;
          return (
            <li key={s}>
              <button
                type="button"
                disabled={pending || s === status}
                onClick={() => set(s)}
                aria-current={s === status ? "step" : undefined}
                className={cn(
                  "flex w-full cursor-pointer flex-col items-start gap-1.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-default",
                  s === status ? "border-ink bg-bg-alt" : "border-rule hover:border-ink-subtle",
                )}
              >
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium", done ? "bg-ink text-bg" : "bg-bg-alt text-ink-muted ring-1 ring-rule")}>
                  {done ? <Check className="h-3 w-3" aria-hidden /> : i + 1}
                </span>
                <span className={cn(done ? "font-medium text-ink" : "text-ink-muted")}>{ORDER_STATUS_LABEL[s]}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        {cancelled ? (
          <button type="button" disabled={pending} onClick={() => set("RECEIVED")} className={buttonClass.secondary}>
            Réactiver la commande
          </button>
        ) : (
          <button type="button" disabled={pending} onClick={() => set("CANCELLED")} className={cn(buttonClass.ghost, "hover:text-ochre")}>
            Annuler la commande
          </button>
        )}
        <button type="button" onClick={() => window.print()} className={buttonClass.ghost}>
          <Printer className="h-4 w-4" aria-hidden /> Imprimer
        </button>
        {pending ? <Loader2 className="h-4 w-4 animate-spin text-ink-muted" aria-label="Mise à jour" /> : null}
      </div>
    </div>
  );
}

export function NoteForm({ orderId }: { orderId: number }) {
  return (
    <ActionForm
      action={addOrderNote}
      resetOnSuccess
      className="flex flex-col gap-3"
      footer={(state) => (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" name="isCustomerVisible" className="h-4 w-4 accent-[rgb(var(--ochre))]" /> Visible par le client
          </label>
          <SubmitButton variant="secondary" pendingLabel="Ajout…" className="ml-auto">Ajouter la note</SubmitButton>
          <Feedback state={state} successMessage="Note ajoutée." />
        </div>
      )}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <textarea name="content" rows={3} required placeholder="Ex. : client contacté, pièces mises de côté…" aria-label="Nouvelle note" className={inputClass} />
    </ActionForm>
  );
}
