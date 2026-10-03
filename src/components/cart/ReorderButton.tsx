"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import type { CartLine } from "@/lib/cart/types";
import { useCart } from "./CartProvider";

type Line = Omit<CartLine, "key" | "quantity"> & { quantity: number };

export function ReorderButton({ lines }: { lines: Line[] }) {
  const { add } = useCart();
  const router = useRouter();
  if (lines.length === 0) return null;

  return (
    <button
      type="button"
      onClick={() => {
        for (const { quantity, ...line } of lines) add(line, quantity);
        router.push("/panier");
      }}
      className="inline-flex h-11 items-center gap-2 border border-ink px-6 font-mono text-xs uppercase tracking-museum hover:bg-ink hover:text-bg transition-colors"
    >
      <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
      Commander à nouveau
    </button>
  );
}
