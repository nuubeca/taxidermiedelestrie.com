"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_PRIMARY, SITE } from "@/lib/site";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule text-ink hover:border-rule-strong md:hidden"
      >
        <Menu className="h-4 w-4" strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 bg-bg md:hidden"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-rule">
              <span className="font-mono text-[0.65rem] uppercase tracking-museum text-ink-subtle">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule text-ink"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            <nav className="px-6 py-10">
              <ul className="flex flex-col gap-1">
                {NAV_PRIMARY.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={item.href}
                      className="group flex items-baseline justify-between border-b border-rule py-5"
                    >
                      <span className="font-serif text-3xl text-ink">{item.label}</span>
                      <span className="font-mono text-[0.65rem] uppercase tracking-museum text-ink-subtle">
                        0{i + 1}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>

            <div className="absolute bottom-0 left-0 right-0 px-6 py-6 border-t border-rule flex items-center justify-between">
              <a
                href={`tel:${SITE.phone.replace(/-/g, "")}`}
                className="font-mono text-xs text-ink-muted"
              >
                {SITE.phone}
              </a>
              <ThemeToggle />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
