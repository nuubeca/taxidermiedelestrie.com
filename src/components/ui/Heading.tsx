import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Level = "display" | "h1" | "h2" | "h3" | "h4";

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  as?: ElementType;
  level?: Level;
  italic?: boolean;
  balance?: boolean;
  children: ReactNode;
};

const LEVEL_TAG: Record<Level, ElementType> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
};

const LEVEL_CLASS: Record<Level, string> = {
  display: "text-display font-serif font-light",
  h1: "text-h1 font-serif font-light",
  h2: "text-h2 font-serif font-normal",
  h3: "text-h3 font-serif font-normal",
  h4: "text-h4 font-serif font-medium",
};

export function Heading({
  as,
  level = "h2",
  italic = false,
  balance = true,
  className,
  children,
  ...rest
}: HeadingProps) {
  const Tag = as ?? LEVEL_TAG[level];
  return (
    <Tag
      className={cn(
        LEVEL_CLASS[level],
        italic && "italic",
        balance && "text-balance",
        "text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
