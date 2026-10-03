"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

/** Vide le panier une fois la commande confirmée (page de remerciement). */
export function ClearCartOnMount() {
  const { clear, hydrated } = useCart();
  useEffect(() => {
    if (hydrated) clear();
  }, [hydrated, clear]);
  return null;
}
