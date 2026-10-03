"use client";

import { useEffect, useState } from "react";
import { Check, ShoppingBasket } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CartLine } from "@/lib/cart/types";
import { useCart } from "./CartProvider";

type Props = {
  line: Omit<CartLine, "key" | "quantity">;
  disabled?: boolean;
};

export function AddToCartButton({ line, disabled }: Props) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(t);
  }, [added]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        add(line);
        setAdded(true);
      }}
      className={cn(
        "h-14 w-full inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-museum transition-colors",
        disabled ? "bg-bg-alt text-ink-subtle cursor-not-allowed" : added ? "bg-moss text-bg" : "bg-ink text-bg hover:bg-ink-muted",
      )}
    >
      {disabled ? (
        "Indisponible"
      ) : added ? (
        <>
          <Check className="h-4 w-4" strokeWidth={2} /> Ajouté au panier
        </>
      ) : (
        <>
          <ShoppingBasket className="h-4 w-4" strokeWidth={1.5} /> Ajouter au panier
        </>
      )}
    </button>
  );
}
