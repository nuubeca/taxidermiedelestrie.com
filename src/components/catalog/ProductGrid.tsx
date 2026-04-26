import { ProductCard } from "./ProductCard";
import { cn } from "@/lib/utils";

type Product = Parameters<typeof ProductCard>[0]["product"];

type Props = {
  products: Product[];
  emptyMessage?: string;
  startIndex?: number;
  className?: string;
};

export function ProductGrid({
  products,
  emptyMessage = "Aucun produit ne correspond à votre sélection.",
  startIndex = 0,
  className,
}: Props) {
  if (products.length === 0) {
    return (
      <div className="border border-dashed border-rule p-16 text-center">
        <p className="font-serif text-xl text-ink-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product, i) => (
        <li key={product.slug}>
          <ProductCard product={product} index={startIndex + i} />
        </li>
      ))}
    </ul>
  );
}
