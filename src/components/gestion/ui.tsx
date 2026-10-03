import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Mise en page ─────────────────────────────────────────── */

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {back.label}
          </Link>
        ) : null}
        <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-rule bg-surface", className)}>
      {title ? (
        <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-ink-muted">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  href?: string;
  tone?: "default" | "attention";
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            tone === "attention" ? "bg-ochre/10 text-ochre" : "bg-bg-alt text-ink-muted",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <div className="mt-3 font-mono text-3xl font-medium tabular-nums text-ink">{value}</div>
      {hint ? <div className="mt-1 text-xs text-ink-muted">{hint}</div> : null}
    </>
  );
  const cls = "block rounded-xl border border-rule bg-surface p-5";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors duration-200 hover:border-ink-subtle")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ─── Badges ───────────────────────────────────────────────── */

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE: Record<Tone, string> = {
  neutral: "bg-bg-alt text-ink-muted ring-rule",
  success: "bg-moss/10 text-moss ring-moss/25",
  warning: "bg-terracotta/10 text-terracotta ring-terracotta/25",
  danger: "bg-ochre/10 text-ochre ring-ochre/25",
  info: "bg-ink/5 text-ink ring-ink/15",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", TONE[tone])}>
      {children}
    </span>
  );
}

/* ─── Tableaux ─────────────────────────────────────────────── */

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-rule bg-surface">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn("whitespace-nowrap border-b border-rule bg-bg-alt/60 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-muted", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-rule px-4 py-3 align-middle", className)}>{children}</td>;
}

/**
 * Ligne entièrement cliquable : le lien couvre la ligne (pseudo-élément), les liens
 * internes restent cliquables grâce à `relative z-10`.
 */
export function RowLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none" aria-label={label}>
      {children}
    </Link>
  );
}

export const rowClass =
  "relative cursor-pointer transition-colors duration-150 hover:bg-bg-alt/70 focus-within:bg-bg-alt/70 [&:last-child>td]:border-b-0";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-rule bg-surface px-6 py-14 text-center">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-bg-alt text-ink-muted">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-medium text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* ─── Navigation de liste ──────────────────────────────────── */

export function Pagination({
  page,
  pages,
  hrefFor,
}: {
  page: number;
  pages: number;
  hrefFor: (page: number) => string;
}) {
  if (pages <= 1) return null;
  const btn = "inline-flex h-9 items-center gap-1 rounded-lg border border-rule bg-surface px-3 text-sm text-ink transition-colors hover:bg-bg-alt";
  return (
    <nav className="mt-4 flex items-center justify-between gap-2" aria-label="Pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={btn}>
          <ChevronLeft className="h-4 w-4" aria-hidden /> Précédent
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-ink-muted">
        Page {page} sur {pages}
      </span>
      {page < pages ? (
        <Link href={hrefFor(page + 1)} className={btn}>
          Suivant <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function FilterTabs({
  items,
}: {
  items: { href: string; label: string; count?: number; current: boolean }[];
}) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-rule">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.current ? "page" : undefined}
          className={cn(
            "-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors",
            t.current ? "border-ochre font-medium text-ink" : "border-transparent text-ink-muted hover:text-ink",
          )}
        >
          {t.label}
          {t.count !== undefined ? (
            <span className="rounded-full bg-bg-alt px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-ink-muted">{t.count}</span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

/* ─── Boutons et champs (rendu serveur) ────────────────────── */

export const buttonClass = {
  primary:
    "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-medium text-bg transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ochre",
  secondary:
    "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-rule bg-surface px-4 text-sm font-medium text-ink transition-colors duration-200 hover:bg-bg-alt disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ochre",
  danger:
    "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-ochre/40 bg-surface px-4 text-sm font-medium text-ochre transition-colors duration-200 hover:bg-ochre/10 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ochre",
  ghost:
    "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm text-ink-muted transition-colors duration-200 hover:bg-bg-alt hover:text-ink disabled:cursor-not-allowed disabled:opacity-50",
} as const;

export function ButtonLink({
  href,
  variant = "primary",
  icon: Icon,
  children,
}: {
  href: string;
  variant?: keyof typeof buttonClass;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass[variant]}>
      {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
      {children}
    </Link>
  );
}

export const inputClass =
  "block w-full rounded-lg border border-rule bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-subtle transition-colors focus:border-ink-subtle focus:outline-none focus:ring-2 focus:ring-ochre/20 disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function Checkbox({
  name,
  label,
  defaultChecked,
  hint,
  value,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  hint?: string;
  value?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-rule accent-[rgb(var(--ochre))]"
      />
      <span>
        {label}
        {hint ? <span className="block text-xs text-ink-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

export function SearchBar({
  action,
  placeholder,
  defaultValue,
  children,
}: {
  action: string;
  placeholder: string;
  defaultValue?: string;
  children?: React.ReactNode;
}) {
  return (
    <form action={action} className="mb-4 flex flex-col gap-2 sm:flex-row" role="search">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(inputClass, "sm:max-w-sm")}
      />
      {children}
      <button type="submit" className={buttonClass.secondary}>
        Rechercher
      </button>
    </form>
  );
}
