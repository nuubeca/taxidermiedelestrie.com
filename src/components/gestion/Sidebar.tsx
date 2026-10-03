"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ExternalLink,
  FolderTree,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Tags,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: number };

export function Sidebar({
  email,
  pendingOrders,
  signOut,
}: {
  email: string;
  pendingOrders: number;
  signOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const groups: { title?: string; items: NavItem[] }[] = [
    { items: [{ href: "/gestion", label: "Tableau de bord", icon: LayoutDashboard }] },
    {
      title: "Ventes",
      items: [
        { href: "/gestion/commandes", label: "Commandes", icon: ShoppingBag, badge: pendingOrders },
        { href: "/gestion/clients", label: "Clients", icon: Users },
      ],
    },
    {
      title: "Catalogue",
      items: [
        { href: "/gestion/products", label: "Produits", icon: Package },
        { href: "/gestion/categories", label: "Catégories", icon: FolderTree },
        { href: "/gestion/tags", label: "Étiquettes", icon: Tags },
        { href: "/gestion/media", label: "Médiathèque", icon: Images },
      ],
    },
  ];

  const isActive = (href: string) => (href === "/gestion" ? pathname === href : pathname.startsWith(href));

  const nav = (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4" aria-label="Gestion">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.title ? <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">{g.title}</p> : null}
          <ul className="flex flex-col gap-0.5">
            {g.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150",
                      active ? "bg-bg-alt font-medium text-ink" : "text-ink-muted hover:bg-bg-alt/70 hover:text-ink",
                    )}
                  >
                    {active ? <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-ochre" aria-hidden /> : null}
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-ochre px-1.5 py-0.5 font-mono text-[11px] font-medium leading-none text-white tabular-nums">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-rule p-3">
      <p className="truncate px-3 pb-2 text-xs text-ink-muted" title={email}>{email}</p>
      <div className="flex items-center gap-1">
        <Link href="/" className="flex h-9 flex-1 items-center gap-2 rounded-lg px-3 text-sm text-ink-muted transition-colors hover:bg-bg-alt hover:text-ink">
          <ExternalLink className="h-4 w-4" aria-hidden /> Voir le site
        </Link>
        <ThemeToggle />
      </div>
      <form action={signOut}>
        <button type="submit" className="mt-1 flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-3 text-sm text-ink-muted transition-colors hover:bg-bg-alt hover:text-ink">
          <LogOut className="h-4 w-4" aria-hidden /> Se déconnecter
        </button>
      </form>
    </div>
  );

  const brand = (
    <Link href="/gestion" className="flex items-center gap-2 text-ink">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ochre font-serif text-sm font-semibold text-white">TE</span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold">Taxidermie de l&apos;Estrie</span>
        <span className="block text-xs text-ink-muted">Gestion</span>
      </span>
    </Link>
  );

  return (
    <>
      {/* Barre mobile */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-rule bg-surface/95 px-4 backdrop-blur lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-ink hover:bg-bg-alt"
          aria-label="Ouvrir le menu"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Tiroir mobile */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-label="Fermer le menu" />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-rule bg-surface">
            <div className="flex h-14 items-center justify-between border-b border-rule px-4">
              {brand}
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg hover:bg-bg-alt" aria-label="Fermer le menu">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      ) : null}

      {/* Barre latérale bureau */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-rule bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-rule px-4">{brand}</div>
        {nav}
        {footer}
      </aside>
    </>
  );
}
