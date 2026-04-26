import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";

const LOGO_SRC = "https://taxidermiedelestrie.com/wp-content/uploads/2018/03/logo_taxidermie_coul.png";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { box: string; sizes: string }> = {
  sm: { box: "h-10 w-32", sizes: "128px" },
  md: { box: "h-14 w-40 md:h-16 md:w-48", sizes: "(min-width: 768px) 192px, 160px" },
  lg: { box: "h-20 w-56 md:h-24 md:w-64", sizes: "(min-width: 768px) 256px, 224px" },
};

type Props = {
  className?: string;
  size?: Size;
};

export function Logo({ className, size = "md" }: Props) {
  const cfg = SIZES[size];
  return (
    <Link
      href="/"
      aria-label={`${SITE.name} — Accueil`}
      className={cn("group inline-flex items-center text-ink", className)}
    >
      <span
        className={cn(
          "relative block shrink-0 dark:invert dark:brightness-110 transition-all duration-300",
          cfg.box,
        )}
      >
        <Image
          src={LOGO_SRC}
          alt={SITE.name}
          fill
          sizes={cfg.sizes}
          className="object-contain object-left"
          priority
        />
      </span>
    </Link>
  );
}
