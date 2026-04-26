import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CaptionProps = HTMLAttributes<HTMLSpanElement> & {
  as?: "span" | "p" | "div";
  tone?: "subtle" | "strong";
  children: ReactNode;
};

export function Caption({
  as: Tag = "span",
  tone = "subtle",
  className,
  children,
  ...rest
}: CaptionProps) {
  return (
    <Tag
      className={cn(
        "font-mono text-[0.7rem] uppercase tracking-museum",
        tone === "subtle" ? "text-ink-subtle" : "text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
