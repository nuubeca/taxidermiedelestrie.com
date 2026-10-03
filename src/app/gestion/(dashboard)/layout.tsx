import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "@/app/(public)/connexion/actions";

const NAV = [
  { href: "/gestion", label: "Tableau de bord" },
  { href: "/gestion/commandes", label: "Commandes" },
  { href: "/gestion/clients", label: "Clients" },
  { href: "/gestion/products", label: "Produits" },
  { href: "/gestion/categories", label: "Catégories" },
  { href: "/gestion/tags", label: "Tags" },
  { href: "/gestion/media", label: "Médias" },
];

export default async function GestionLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin("/gestion");

  return (
    <div className="dark min-h-screen flex bg-neutral-950 text-neutral-200">
      <aside className="w-60 border-r border-neutral-800 p-4 sticky top-0 h-screen flex flex-col">
        <Link href="/gestion" className="block font-semibold text-lg mb-6">
          Gestion · TDE
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="px-3 py-2 rounded text-sm text-neutral-300 hover:bg-neutral-800">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-8 text-xs text-neutral-500 flex flex-col gap-2">
          <span className="truncate" title={user.email}>{user.email}</span>
          <Link href="/" className="hover:text-neutral-300">← Retour au site</Link>
          <form action={signOut}>
            <button type="submit" className="hover:text-neutral-300">Se déconnecter</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-x-auto">{children}</main>
    </div>
  );
}
