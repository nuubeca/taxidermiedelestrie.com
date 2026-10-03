"use client";

import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { useCart } from "./CartProvider";

export function CartLink() {
  const { count, hydrated } = useCart();
  return (
    <Link
      href="/panier"
      aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}
      className="relative inline-flex h-10 w-10 items-center justify-center text-ink hover:text-ink-muted transition-colors"
    >
      <ShoppingBasket className="h-5 w-5" strokeWidth={1.5} />
      {hydrated && count > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 inline-flex items-center justify-center bg-ink text-bg font-mono text-[0.6rem] leading-none">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
