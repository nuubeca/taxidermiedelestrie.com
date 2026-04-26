import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Caption } from "@/components/ui/Caption";
import { cn } from "@/lib/utils";

type Props = {
  category: {
    slug: string;
    name: string;
    imageUrl: string | null;
    productCount: number;
    description?: string | null;
  };
  index?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const ASPECT: Record<NonNullable<Props["size"]>, string> = {
  sm: "aspect-[4/5]",
  md: "aspect-[5/6]",
  lg: "aspect-[3/4]",
};

export function CategoryCard({ category, index, size = "md", className }: Props) {
  return (
    <Link
      href={`/catalogue/${category.slug}`}
      className={cn("group block focus:outline-none", className)}
    >
      <article className="flex flex-col gap-5">
        <div className={cn("relative overflow-hidden bg-bg-alt", ASPECT[size])}>
          {category.imageUrl ? (
            <Image
              src={category.imageUrl}
              alt={category.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink-subtle">
              <span className="font-mono text-xs uppercase tracking-museum">Sans visuel</span>
            </div>
          )}

          {/* Top metadata bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
            {typeof index === "number" && (
              <span className="font-mono text-[0.65rem] uppercase tracking-museum text-bg bg-ink/85 px-2 py-1">
                {String(index + 1).padStart(2, "0")} / Catégorie
              </span>
            )}
            <span className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-bg/90 text-ink transition-transform duration-500 ease-editorial group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-serif text-2xl md:text-3xl leading-tight text-ink text-balance">
            {category.name}
          </h3>
          {category.description ? (
            <p className="text-sm text-ink-muted line-clamp-2">{category.description}</p>
          ) : null}
          <div className="pt-2">
            <Caption>
              {category.productCount} {category.productCount === 1 ? "pièce" : "pièces"}
            </Caption>
          </div>
        </div>
      </article>
    </Link>
  );
}
