"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import { Caption } from "@/components/ui/Caption";
import { requestLoginCode, verifyLoginCode, type ActionResult } from "./actions";

const INPUT =
  "bg-transparent border-b border-rule px-0 py-3 text-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink transition-colors";

export function LoginForm({ next, initialEmail }: { next?: string; initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [requestState, requestAction] = useActionState<ActionResult<{ email: string }> | null, FormData>(
    requestLoginCode,
    null,
  );
  const [verifyState, verifyAction] = useActionState<ActionResult | null, FormData>(verifyLoginCode, null);
  const [editing, setEditing] = useState(false);

  const sentTo = requestState?.success && !editing ? requestState.data.email : null;

  if (sentTo) {
    return (
      <form action={verifyAction} className="flex flex-col gap-8">
        <input type="hidden" name="email" value={sentTo} />
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <p className="text-base text-ink-muted">
          Un code à 6 chiffres a été envoyé à <span className="text-ink">{sentTo}</span>.
        </p>

        <Field id="code" label="Code de connexion" required>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            className={`${INPUT} font-mono tracking-[0.5em] text-2xl`}
            placeholder="000000"
          />
        </Field>

        <Feedback state={verifyState} />

        <div className="flex items-center justify-between gap-6 pt-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-museum text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Changer de courriel
          </button>
          <SubmitButton idle="Se connecter" pending="Vérification…" />
        </div>
      </form>
    );
  }

  return (
    <form action={requestAction} className="flex flex-col gap-8">
      <Field id="email" label="Courriel" required>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT}
          placeholder="vous@exemple.com"
        />
      </Field>

      <Feedback state={requestState && !requestState.success ? requestState : null} />

      <div className="flex items-center justify-between gap-6 pt-2">
        <p className="text-xs text-ink-subtle max-w-xs">
          Pas de mot de passe. Nous vous envoyons un code par courriel à chaque connexion.
        </p>
        <SubmitButton idle="Recevoir mon code" pending="Envoi…" />
      </div>
    </form>
  );
}

function Feedback({ state }: { state: ActionResult<unknown> | null }) {
  if (!state || state.success) return null;
  return (
    <div role="alert" className="border border-terracotta bg-terracotta/10 p-4">
      <Caption tone="strong" className="text-terracotta">
        {state.error}
      </Caption>
    </div>
  );
}

function Field({ id, label, required, children }: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-mono text-[0.7rem] uppercase tracking-museum text-ink-muted">
        {label}
        {required ? <span className="text-terracotta ml-1">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function SubmitButton({ idle, pending }: { idle: string; pending: string }) {
  const { pending: isPending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={isPending}
      className="group inline-flex h-14 items-center justify-center gap-2 px-8 bg-ink text-bg font-mono text-xs uppercase tracking-museum hover:bg-ink-muted transition-colors disabled:opacity-60 disabled:cursor-wait"
    >
      <span>{isPending ? pending : idle}</span>
      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} />
    </button>
  );
}
