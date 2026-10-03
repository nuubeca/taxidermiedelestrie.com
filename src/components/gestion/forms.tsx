"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";
import type { ActionResult } from "@/lib/gestion/action-result";
import { buttonClass } from "./ui";
import { cn } from "@/lib/utils";

type FormAction = (prev: ActionResult<unknown> | null, formData: FormData) => Promise<ActionResult<unknown>>;

export function SubmitButton({
  children,
  variant = "primary",
  pendingLabel = "Enregistrement…",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof buttonClass;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={cn(buttonClass[variant], className)}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}

export function Feedback({ state, successMessage }: { state: ActionResult<unknown> | null; successMessage?: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    if (state?.success) {
      const t = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(t);
    }
  }, [state]);
  if (!state || !visible) return null;
  if (state.success && !successMessage) return null;
  return (
    <p
      role={state.success ? "status" : "alert"}
      className={cn("inline-flex items-center gap-1.5 text-sm", state.success ? "text-moss" : "text-ochre")}
    >
      {state.success ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <AlertCircle className="h-4 w-4" aria-hidden />}
      {state.success ? successMessage : state.error}
    </p>
  );
}

/**
 * Formulaire branché sur une Server Action (useActionState) avec retour d'état.
 * `resetOnSuccess` remonte le formulaire pour vider les champs (ex. ajout de note).
 */
export function ActionForm({
  action,
  children,
  successMessage = "Enregistré.",
  resetOnSuccess = false,
  className,
  footer,
  submitLabel,
  pendingLabel,
  submitVariant = "primary",
  footerClassName = "flex flex-wrap items-center gap-3",
}: {
  action: FormAction;
  children: React.ReactNode;
  successMessage?: string;
  resetOnSuccess?: boolean;
  className?: string;
  /** Pied personnalisé — seulement depuis un composant client (une fonction ne traverse pas la frontière serveur). */
  footer?: (state: ActionResult<unknown> | null) => React.ReactNode;
  /** Pied standard (bouton + retour), utilisable depuis un Server Component. */
  submitLabel?: string;
  pendingLabel?: string;
  submitVariant?: keyof typeof buttonClass;
  footerClassName?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (resetOnSuccess && state?.success) setKey((k) => k + 1);
  }, [state, resetOnSuccess]);

  return (
    <form key={key} action={formAction} className={className}>
      {children}
      {footer ? (
        footer(state)
      ) : submitLabel ? (
        <div className={footerClassName}>
          <SubmitButton variant={submitVariant} pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
          <Feedback state={state} successMessage={successMessage} />
        </div>
      ) : (
        <Feedback state={state} successMessage={successMessage} />
      )}
    </form>
  );
}

/**
 * Bouton de suppression en deux temps (pas de boîte de dialogue du navigateur) :
 * premier clic = demande de confirmation, second = exécution.
 */
export function ConfirmButton({
  onConfirm,
  label = "Supprimer",
  confirmLabel = "Confirmer la suppression",
  description,
  variant = "danger",
  icon = true,
}: {
  onConfirm: () => Promise<ActionResult<unknown>>;
  label?: string;
  confirmLabel?: string;
  description?: string;
  variant?: keyof typeof buttonClass;
  icon?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 6000);
    return () => clearTimeout(t);
  }, [armed]);

  if (!armed) {
    return (
      <span className="inline-flex flex-col gap-1">
        <button type="button" onClick={() => setArmed(true)} className={buttonClass[variant]}>
          {icon ? <Trash2 className="h-4 w-4" aria-hidden /> : null}
          {label}
        </button>
        {error ? <span className="text-xs text-ochre" role="alert">{error}</span> : null}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {description ? <span className="text-xs text-ink-muted">{description}</span> : null}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await onConfirm();
            setArmed(false);
            setError(res.success ? null : res.error);
          })
        }
        className={cn(buttonClass.danger, "bg-ochre text-white hover:bg-ochre/90")}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {confirmLabel}
      </button>
      <button type="button" onClick={() => setArmed(false)} className={buttonClass.ghost}>
        Annuler
      </button>
    </span>
  );
}

/** Bouton qui déclenche une Server Action sans formulaire (dupliquer, restaurer…). */
export function ActionButton({
  action,
  icon,
  children,
  variant = "secondary",
}: {
  action: () => Promise<ActionResult<unknown>>;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: keyof typeof buttonClass;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await action();
            setError(r.success ? null : r.error);
          })
        }
        className={buttonClass[variant]}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
        {children}
      </button>
      {error ? <span className="text-xs text-ochre" role="alert">{error}</span> : null}
    </span>
  );
}
