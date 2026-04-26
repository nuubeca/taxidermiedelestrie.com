"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  primary: string | null;
  gallery: string[];
  alt: string;
};

export function ProductGallery({ primary, gallery, alt }: Props) {
  const all = [primary, ...gallery].filter((u): u is string => Boolean(u));
  const [active, setActive] = useState(all[0] ?? null);

  if (!active) {
    return (
      <div className="aspect-[4/5] bg-bg-alt flex items-center justify-center">
        <span className="font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle">
          Image non disponible
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main */}
      <div className="relative aspect-[4/5] overflow-hidden bg-bg-alt">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={active}
              alt={alt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnails */}
      {all.length > 1 && (
        <ul className="grid grid-cols-5 gap-2">
          {all.map((url, i) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => setActive(url)}
                aria-label={`Voir image ${i + 1}`}
                className={cn(
                  "relative block w-full aspect-square overflow-hidden border bg-bg-alt transition-colors",
                  active === url ? "border-ink" : "border-rule hover:border-ink-muted",
                )}
              >
                <Image
                  src={url}
                  alt={`${alt} — vignette ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
