import type { Metadata } from "next";
import { fontMono, fontSans, fontSerif } from "@/lib/fonts";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Taxidermie de l'Estrie — Une passion depuis 1974",
    template: "%s · Taxidermie de l'Estrie",
  },
  description:
    "Distributeur de fournitures de taxidermie, service de tannerie et station d'enregistrement de gibier à Sherbrooke depuis 1974.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn(fontSerif.variable, fontSans.variable, fontMono.variable)}
    >
      <body className="min-h-screen bg-bg text-ink antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
