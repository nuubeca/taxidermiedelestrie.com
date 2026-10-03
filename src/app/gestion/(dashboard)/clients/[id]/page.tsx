import { notFound } from "next/navigation";
import { Ban, Mail, Phone, Plus, ShieldCheck, ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { asAddress, FULFILLMENT_LABEL } from "@/lib/orders/format";
import { money, shortDate } from "@/lib/gestion/format";
import { OrderStatusBadge } from "@/components/gestion/badges";
import { ActionButton, ActionForm, Feedback, SubmitButton } from "@/components/gestion/forms";
import { Badge, ButtonLink, EmptyState, Field, PageHeader, Panel, RowLink, Table, Td, Th, inputClass, rowClass } from "@/components/gestion/ui";
import { setClientAccess, updateClient } from "../actions";
import { ClientFields } from "../ClientFields";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const profile = await prisma.profile.findUnique({
    where: { id },
    include: { orders: { orderBy: { placedAt: "desc" }, include: { _count: { select: { items: true } } } } },
  });
  if (!profile) notFound();

  const { data: auth } = await createSupabaseAdminClient().auth.admin.getUserById(id);
  const bannedUntil = auth?.user?.banned_until ? new Date(auth.user.banned_until) : null;
  const blocked = Boolean(bannedUntil && bannedUntil > new Date());
  const lastSignIn = auth?.user?.last_sign_in_at ? new Date(auth.user.last_sign_in_at) : null;

  const ship = asAddress(profile.shipping);
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  const spent = profile.orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.subtotal.toNumber(), 0);

  return (
    <div>
      <PageHeader
        back={{ href: "/gestion/clients", label: "Clients" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {name || profile.email}
            {profile.role === "ADMIN" ? <Badge tone="info">Admin</Badge> : null}
            {blocked ? <Badge tone="danger">Accès bloqué</Badge> : null}
          </span>
        }
        description={`Client depuis le ${shortDate(profile.createdAt)}${lastSignIn ? ` · dernière connexion le ${shortDate(lastSignIn)}` : " · jamais connecté au nouveau site"}`}
        actions={<ButtonLink href={`/gestion/commandes/nouvelle?client=${profile.id}`} icon={Plus}>Nouvelle commande</ButtonLink>}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Panel title="Commandes" description={`${profile.orders.length} commande${profile.orders.length > 1 ? "s" : ""} · ${money(spent)} avant taxes`} bodyClassName="p-0">
            {profile.orders.length === 0 ? (
              <div className="p-5"><EmptyState icon={ShoppingBag} title="Aucune commande" /></div>
            ) : (
              <div className="[&>div]:rounded-none [&>div]:border-0">
                <Table>
                  <thead><tr><Th>Commande</Th><Th className="hidden sm:table-cell">Réception</Th><Th>Statut</Th><Th className="text-right">Sous-total</Th></tr></thead>
                  <tbody>
                    {profile.orders.map((o) => (
                      <tr key={o.id} className={rowClass}>
                        <Td>
                          <RowLink href={`/gestion/commandes/${o.id}`} label={`Ouvrir la commande ${o.number}`}><span className="font-mono font-medium text-ink">{o.number}</span></RowLink>
                          <span className="block text-xs text-ink-muted">{shortDate(o.placedAt)} · {o._count.items} article{o._count.items > 1 ? "s" : ""}</span>
                        </Td>
                        <Td className="hidden text-ink-muted sm:table-cell">{FULFILLMENT_LABEL[o.fulfillment]}</Td>
                        <Td><OrderStatusBadge status={o.status} /></Td>
                        <Td className="text-right font-mono tabular-nums">{money(o.subtotal)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Panel>

          <Panel title="Coordonnées">
            <ActionForm
              action={updateClient}
              className="flex flex-col gap-4"
              submitLabel="Enregistrer" successMessage="Fiche enregistrée."
            >
              <input type="hidden" name="id" value={profile.id} />
              <ClientFields
                v={{
                  firstName: profile.firstName ?? "", lastName: profile.lastName ?? "", company: profile.company ?? "", phone: profile.phone ?? "",
                  address1: ship?.address1 ?? "", address2: ship?.address2 ?? "", city: ship?.city ?? "", state: ship?.state ?? "QC", postcode: ship?.postcode ?? "",
                }}
              />
              <Field label="Rôle" htmlFor="role" hint="Un administrateur a accès à toute la gestion." className="sm:max-w-xs">
                <select id="role" name="role" defaultValue={profile.role} className={inputClass}>
                  <option value="CUSTOMER">Client</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </Field>
            </ActionForm>
          </Panel>
        </div>

        <aside className="flex flex-col gap-6">
          <Panel title="Contact">
            <div className="flex flex-col gap-2 text-sm">
              <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-ink hover:underline"><Mail className="h-4 w-4 text-ink-muted" aria-hidden />{profile.email}</a>
              {profile.phone ? <a href={`tel:${profile.phone}`} className="flex items-center gap-2 text-ink hover:underline"><Phone className="h-4 w-4 text-ink-muted" aria-hidden />{profile.phone}</a> : null}
              {profile.wpLogin ? <p className="text-xs text-ink-muted">Ancien identifiant WordPress : {profile.wpLogin}</p> : null}
            </div>
          </Panel>
          <Panel title="Accès au site">
            <p className="mb-4 text-sm text-ink-muted">
              {blocked ? "Ce client ne peut plus se connecter. Ses commandes restent consultables ici." : "Le client peut se connecter et passer des commandes."}
            </p>
            {blocked ? (
              <ActionButton action={setClientAccess.bind(null, profile.id, false)} icon={<ShieldCheck className="h-4 w-4" aria-hidden />}>Rétablir l&apos;accès</ActionButton>
            ) : (
              <ActionButton action={setClientAccess.bind(null, profile.id, true)} variant="danger" icon={<Ban className="h-4 w-4" aria-hidden />}>Bloquer l&apos;accès</ActionButton>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
