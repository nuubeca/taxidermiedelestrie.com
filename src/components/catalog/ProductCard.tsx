import Image from "next/image";
import Link from "next/link";
import { Caption } from "@/components/ui/Caption";
import { cn, formatPrice } from "@/lib/utils";

type Props = {
  product: {
    slug: string;
    name: string;
    sku: string | null;
    price: number | string | null;
    stockStatus: string;
    primaryImageUrl: string | null;
    categories?: { slug: string; name: string }[];
  };
  href?: string;
  index?: number;
  priority?: boolean;
  className?: string;
};

export function ProductCard({ product, href, index, priority, className }: Props) {
  const linkHref = href ?? `/catalogue/${product.categories?.[0]?.slug ?? "tous"}/${product.slug}`;
  const inStock = product.stockStatus === "instock";

  return (
    <Link
      href={linkHref}
      className={cn(
        "group block focus:outline-none",
        className,
      )}
    >
      <article className="flex flex-col gap-4">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-bg-alt">
          {product.primaryImageUrl ? (
            <Image
              src={product.primaryImageUrl}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              priority={priority}
              className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink-subtle">
              <span className="font-mono text-[0.65rem] uppercase tracking-museum">Sans image</span>
            </div>
          )}

          {/* Index marker (museum catalog style) */}
          {typeof index === "number" && (
            <span className="absolute top-3 left-3 font-mono text-[0.65rem] uppercase tracking-museum text-ink-subtle bg-bg/85 px-2 py-1">
              N° {String(index + 1).padStart(3, "0")}
            </span>
          )}

          {!inStock && (
            <span className="absolute top-3 right-3 font-mono text-[0.65rem] uppercase tracking-museum text-bg bg-ink px-2 py-1">
              Rupture
            </span>
          )}
        </div>

        {/* Metadata block */}
        <div className="flex flex-col gap-1.5">
          <h3 className="font-serif text-lg leading-tight text-ink text-balance">
            {product.name}
          </h3>

          <div className="flex items-center justify-between gap-4 pt-1">
            <Caption>
              {product.sku ? `SKU · ${product.sku}` : "Référence —"}
            </Caption>
            <span className="font-mono text-sm text-ink">
              {formatPrice(product.price ? Number(product.price) : null)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
