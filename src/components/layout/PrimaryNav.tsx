"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NAV_PRIMARY } from "@/lib/site";
import { cn } from "@/lib/utils";

export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:block">
      <ul className="flex items-center gap-1">
        {NAV_PRIMARY.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href) ?? false;
          return (
            <li key={item.href} className="relative">
              <Link
                href={item.href}
                className={cn(
                  "relative inline-flex h-9 items-center px-3 font-sans text-sm transition-colors duration-300",
                  active ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="primary-nav-active"
                    className="absolute left-2 right-2 -bottom-0.5 h-px bg-ink"
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
