import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/app/(public)/connexion/actions";
import { Sidebar } from "@/components/gestion/Sidebar";

export default async function GestionLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin("/gestion");
  const pendingOrders = await prisma.order.count({ where: { status: { in: ["RECEIVED", "PROCESSING"] } } });

  return (
    <div className="min-h-screen bg-bg text-ink lg:flex">
      <Sidebar email={user.email} pendingOrders={pendingOrders} signOut={signOut} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
