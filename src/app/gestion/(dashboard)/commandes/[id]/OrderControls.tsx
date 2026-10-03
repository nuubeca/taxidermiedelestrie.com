"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABEL } from "@/lib/orders/format";
import { addOrderNote, updateOrderStatus, type ActionResult } from "../actions";

const STATUSES: OrderStatus[] = ["RECEIVED", "PROCESSING", "COMPLETED", "CANCELLED"];

export function OrderControls({ orderId, status }: { orderId: number; status: OrderStatus }) {
  const [statusState, statusAction] = useActionState<ActionResult | null, FormData>(updateOrderStatus, null);
  const [noteState, noteAction] = useActionState<ActionResult | null, FormData>(addOrderNote, null);

  return (
    <div className="flex flex-col gap-6">
      <form action={statusAction} className="flex items-end gap-3">
        <input type="hidden" name="orderId" value={orderId} />
        <label className="flex flex-col gap-1 text-xs text-neutral-500">
          Statut
          <select name="status" defaultValue={status} className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200">
            {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
          </select>
        </label>
        <Submit label="Mettre à jour" />
        <Feedback state={statusState} ok="Statut mis à jour." />
      </form>

      <form action={noteAction} key={noteState?.success ? Date.now() : "note"} className="flex flex-col gap-3">
        <input type="hidden" name="orderId" value={orderId} />
        <textarea name="content" rows={3} required placeholder="Ajouter une note…" className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm" />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-neutral-400">
            <input type="checkbox" name="isCustomerVisible" /> Visible par le client
          </label>
          <Submit label="Ajouter la note" />
          <Feedback state={noteState} ok="Note ajoutée." />
        </div>
      </form>
    </div>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="bg-neutral-200 text-neutral-900 rounded px-4 py-2 text-sm disabled:opacity-60">{pending ? "…" : label}</button>;
}

function Feedback({ state, ok }: { state: ActionResult | null; ok: string }) {
  if (!state) return null;
  return <span className={state.success ? "text-xs text-green-400" : "text-xs text-red-400"}>{state.success ? ok : state.error}</span>;
}
