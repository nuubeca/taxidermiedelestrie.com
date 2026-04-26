import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        "bg-alt": "rgb(var(--bg-alt) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-muted": "rgb(var(--ink-muted) / <alpha-value>)",
        "ink-subtle": "rgb(var(--ink-subtle) / <alpha-value>)",
        rule: "rgb(var(--rule) / <alpha-value>)",
        "rule-strong": "rgb(var(--rule-strong) / <alpha-value>)",
        ochre: "rgb(var(--ochre) / <alpha-value>)",
        moss: "rgb(var(--moss) / <alpha-value>)",
        terracotta: "rgb(var(--terracotta) / <alpha-value>)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display": ["clamp(3rem, 8vw, 6rem)", { lineHeight: "0.95", letterSpacing: "-0.02em" }],
        "h1": ["clamp(2.25rem, 5vw, 3.75rem)", { lineHeight: "1.05", letterSpacing: "-0.015em" }],
        "h2": ["clamp(1.75rem, 3.5vw, 2.5rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        "h3": ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.005em" }],
        "h4": ["1.125rem", { lineHeight: "1.3" }],
        "lead": ["1.25rem", { lineHeight: "1.55" }],
        "caption": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.12em" }],
      },
      letterSpacing: {
        museum: "0.18em",
      },
      maxWidth: {
        prose: "68ch",
        editorial: "1320px",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
