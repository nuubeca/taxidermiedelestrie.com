"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { Caption } from "@/components/ui/Caption";
import { sendContactMessage, type ActionResult } from "./actions";

export function ContactForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    sendContactMessage,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-8">
      {/* Honeypot */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label>
          Société (laisser vide)
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field id="name" label="Votre nom" required>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="bg-transparent border-b border-rule px-0 py-3 text-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink transition-colors"
          placeholder="Jean Dupont"
        />
      </Field>

      <Field id="email" label="Courriel" required>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="bg-transparent border-b border-rule px-0 py-3 text-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink transition-colors"
          placeholder="vous@exemple.com"
        />
      </Field>

      <Field id="subject" label="Sujet">
        <input
          id="subject"
          name="subject"
          type="text"
          className="bg-transparent border-b border-rule px-0 py-3 text-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink transition-colors"
          placeholder="Demande de devis, naturalisation, etc."
        />
      </Field>

      <Field id="message" label="Message" required>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className="bg-transparent border-b border-rule px-0 py-3 text-base text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink transition-colors resize-none"
          placeholder="Décrivez votre demande, projet ou question…"
        />
      </Field>

      <div className="flex items-center justify-between gap-6 pt-4">
        <p className="text-xs text-ink-subtle max-w-xs">
          Nous répondons généralement sous 1 ou 2 jours ouvrables.
        </p>
        <SubmitButton />
      </div>

      {/* Feedback */}
      <AnimatePresence mode="wait">
        {state && (
          <motion.div
            key={state.success ? "ok" : "ko"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={
              state.success
                ? "border border-moss bg-moss/10 p-4 flex items-center gap-3"
                : "border border-terracotta bg-terracotta/10 p-4 flex items-center gap-3"
            }
            role="status"
          >
            {state.success ? (
              <>
                <Check className="h-4 w-4 text-moss" strokeWidth={2} />
                <Caption tone="strong" className="text-moss">
                  Message envoyé — merci, nous reviendrons vers vous rapidement.
                </Caption>
              </>
            ) : (
              <Caption tone="strong" className="text-terracotta">
                {state.error}
              </Caption>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex h-14 items-center justify-center gap-2 px-8 bg-ink text-bg font-mono text-xs uppercase tracking-museum hover:bg-ink-muted transition-colors disabled:opacity-60 disabled:cursor-wait"
    >
      <span>{pending ? "Envoi…" : "Envoyer le message"}</span>
      <ArrowUpRight
        className="h-4 w-4 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        strokeWidth={1.5}
      />
    </button>
  );
}
