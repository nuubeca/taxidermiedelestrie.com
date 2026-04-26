"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule text-ink transition-colors duration-300 hover:border-rule-strong hover:bg-bg-alt"
    >
      <span className="sr-only">{isDark ? "Mode clair" : "Mode sombre"}</span>
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4 transition-transform duration-500 group-hover:rotate-45" strokeWidth={1.5} />
        ) : (
          <Moon className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-12" strokeWidth={1.5} />
        )
      ) : (
        <span className="h-4 w-4" />
      )}
    </button>
  );
}
