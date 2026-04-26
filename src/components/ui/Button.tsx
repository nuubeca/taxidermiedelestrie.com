import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "filled" | "outline" | "ghost" | "link";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  filled:
    "bg-ink text-bg hover:bg-ink-muted border border-ink hover:border-ink-muted",
  outline:
    "bg-transparent text-ink hover:bg-ink hover:text-bg border border-ink",
  ghost:
    "bg-transparent text-ink hover:bg-bg-alt border border-transparent",
  link:
    "bg-transparent text-ink border-0 px-0 py-0 link-naturalist",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  withArrow?: boolean;
  children: ReactNode;
};

type AsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

export function Button(props: AsButton | AsLink) {
  const {
    variant = "filled",
    size = "md",
    withArrow = false,
    className,
    children,
    ...rest
  } = props;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-sans tracking-wide uppercase text-xs transition-all duration-300 ease-editorial",
    variant !== "link" && SIZE[size],
    VARIANT[variant],
    "rounded-none",
    className,
  );

  const inner = (
    <>
      <span>{children}</span>
      {withArrow ? (
        <ArrowUpRight
          className="h-4 w-4 transition-transform duration-300 ease-editorial group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          strokeWidth={1.5}
        />
      ) : null}
    </>
  );

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <Link href={href as string} className={cn("group", classes)} {...anchorRest}>
        {inner}
      </Link>
    );
  }

  return (
    <button className={cn("group", classes)} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {inner}
    </button>
  );
}
