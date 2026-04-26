import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  size?: "narrow" | "default" | "wide" | "full";
};

const SIZES: Record<NonNullable<ContainerProps["size"]>, string> = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-editorial",
  full: "max-w-none",
};

export function Container({
  as: Tag = "div",
  size = "default",
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full px-6 md:px-10", SIZES[size], className)} {...rest}>
      {children}
    </Tag>
  );
}
