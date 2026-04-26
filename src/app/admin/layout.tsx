import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/media", label: "Médias" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen flex bg-neutral-950 text-neutral-200">
      <aside className="w-60 border-r border-neutral-800 p-4 sticky top-0 h-screen">
        <Link href="/admin" className="block font-semibold text-lg mb-6">
          Mouldec Admin
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded text-sm text-neutral-300 hover:bg-neutral-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 text-xs text-neutral-500">
          <Link href="/" className="hover:text-neutral-300">← Retour accueil</Link>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-x-auto">{children}</main>
    </div>
  );
}
