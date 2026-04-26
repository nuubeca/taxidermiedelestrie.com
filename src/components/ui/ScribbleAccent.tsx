import { cn } from "@/lib/utils";

type Variant = "underline" | "circle" | "arrow" | "asterisk" | "swirl";

type Props = {
  variant?: Variant;
  className?: string;
  strokeWidth?: number;
};

export function ScribbleAccent({ variant = "underline", className, strokeWidth = 2 }: Props) {
  const baseClass = cn("pointer-events-none text-ink", className);

  switch (variant) {
    case "underline":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 200 18"
          fill="none"
          className={baseClass}
          preserveAspectRatio="none"
        >
          <path
            d="M2 11 C 35 4, 70 16, 105 8 S 175 13, 198 6"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case "circle":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 220 100"
          fill="none"
          className={baseClass}
          preserveAspectRatio="none"
        >
          <path
            d="M 110 8 C 30 8, 8 30, 12 55 C 16 82, 70 96, 130 92 C 195 87, 215 60, 208 35 C 200 12, 145 4, 90 10"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case "arrow":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 80 60"
          fill="none"
          className={baseClass}
        >
          <path
            d="M 6 12 C 25 4, 50 18, 60 38"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 50 30 L 62 40 L 52 50"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );
    case "asterisk":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 40 40"
          fill="none"
          className={baseClass}
        >
          <path d="M 20 4 L 20 36" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
          <path d="M 4 20 L 36 20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
          <path d="M 8 8 L 32 32" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
          <path d="M 32 8 L 8 32" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      );
    case "swirl":
      return (
        <svg
          aria-hidden="true"
          viewBox="0 0 120 60"
          fill="none"
          className={baseClass}
        >
          <path
            d="M 6 30 C 20 10, 40 50, 60 30 S 100 10, 114 30"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
  }
}
