import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SectionProps = HTMLAttributes<HTMLElement> & {
  spacing?: "sm" | "md" | "lg" | "xl";
  divide?: "top" | "bottom" | "both" | "none";
};

const SPACING: Record<NonNullable<SectionProps["spacing"]>, string> = {
  sm: "py-6 md:py-8",
  md: "py-8 md:py-12",
  lg: "py-10 md:py-16",
  xl: "py-14 md:py-[5.5rem]",
};

const DIVIDE: Record<NonNullable<SectionProps["divide"]>, string> = {
  top: "border-t",
  bottom: "border-b",
  both: "border-y",
  none: "",
};

export function Section({
  spacing = "lg",
  divide = "none",
  className,
  children,
  ...rest
}: SectionProps) {
  return (
    <section className={cn(SPACING[spacing], DIVIDE[divide], className)} {...rest}>
      {children}
    </section>
  );
}
