import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface SearchParams { q?: string; page?: string }

export default async function ClientsList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.ProfileWhereInput = q
    ? { OR: [
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ] }
    : {};

  const [total, profiles] = await Promise.all([
    prisma.profile.count({ where }),
    prisma.profile.findMany({ where, orderBy: [{ role: "asc" }, { lastName: "asc" }], take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, include: { _count: { select: { orders: true } } } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Clients <span className="text-neutral-500 text-base">({total})</span></h1>
      <form className="flex gap-3 mb-6">
        <input name="q" defaultValue={q} placeholder="Nom, courriel, entreprise, téléphone" className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm w-80" />
        <button type="submit" className="bg-neutral-200 text-neutral-900 rounded px-4 py-2 text-sm">Chercher</button>
      </form>
      <table className="w-full text-sm">
        <thead className="text-left text-neutral-500 border-b border-neutral-800">
          <tr><th className="py-2">Nom</th><th>Courriel</th><th>Téléphone</th><th>Entreprise</th><th>Rôle</th><th className="text-right">Commandes</th></tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id} className="border-b border-neutral-900 hover:bg-neutral-900">
              <td className="py-2">{[p.firstName, p.lastName].filter(Boolean).join(" ") || "—"}</td>
              <td><Link href={{ pathname: "/gestion/commandes", query: { q: p.email } }} className="hover:underline">{p.email}</Link></td>
              <td>{p.phone ?? "—"}</td>
              <td>{p.company ?? "—"}</td>
              <td>{p.role === "ADMIN" ? "Admin" : "Client"}</td>
              <td className="text-right">{p._count.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {pages > 1 ? (
        <div className="flex gap-2 mt-6 text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={{ pathname: "/gestion/clients", query: { ...(q ? { q } : {}), page: n } }} className={n === page ? "px-3 py-1 bg-neutral-200 text-neutral-900 rounded" : "px-3 py-1 bg-neutral-900 rounded"}>{n}</Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
