import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findMediaUsage } from "@/lib/gestion/media";
import { dateTime, fileSize } from "@/lib/gestion/format";
import { ActionForm, ConfirmButton, Feedback, SubmitButton } from "@/components/gestion/forms";
import { Field, PageHeader, Panel, inputClass } from "@/components/gestion/ui";
import { deleteMedia, updateMedia } from "../actions";
import { CopyButton } from "../CopyButton";

export const dynamic = "force-dynamic";

export default async function MediaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mediaId = Number(id);
  if (!Number.isInteger(mediaId)) notFound();
  const m = await prisma.mediaAsset.findUnique({ where: { id: mediaId } });
  if (!m || !m.publicUrl) notFound();
  const usage = await findMediaUsage(m.publicUrl);

  return (
    <div>
      <PageHeader
        back={{ href: "/gestion/media", label: "Médiathèque" }}
        title={m.title ?? m.filePath.split("/").pop()}
        description={`${m.width && m.height ? `${m.width} × ${m.height} px · ` : ""}${fileSize(m.fileSize)} · ajoutée le ${dateTime(m.createdAt)}`}
        actions={
          <>
            <CopyButton value={m.publicUrl} />
            <ConfirmButton
              onConfirm={deleteMedia.bind(null, mediaId)}
              confirmLabel="Supprimer l'image"
              description={usage.total ? "Elle est encore utilisée." : undefined}
            />
          </>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-xl border border-rule bg-bg-alt" style={{ aspectRatio: m.width && m.height ? `${m.width} / ${m.height}` : "4 / 3" }}>
            <Image src={m.publicUrl} alt={m.altText ?? ""} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-contain" />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <Panel title="Détails">
            <ActionForm
              action={updateMedia}
              className="flex flex-col gap-4"
              submitLabel="Enregistrer" successMessage="Enregistré."
            >
              <input type="hidden" name="id" value={m.id} />
              <Field label="Titre" htmlFor="title">
                <input id="title" name="title" defaultValue={m.title ?? ""} className={inputClass} />
              </Field>
              <Field label="Texte alternatif" htmlFor="altText" hint="Décrit l'image pour les lecteurs d'écran et Google.">
                <textarea id="altText" name="altText" rows={3} defaultValue={m.altText ?? ""} className={inputClass} />
              </Field>
            </ActionForm>
          </Panel>
          <Panel title="Utilisée par">
            {usage.total === 0 ? (
              <p className="text-sm text-ink-muted">Aucun produit ni aucune catégorie.</p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {usage.products.map((p) => <li key={`p${p.id}`}><Link href={`/gestion/products/${p.id}`} className="text-ink hover:underline">Produit · {p.name}</Link></li>)}
                {usage.categories.map((c) => <li key={`c${c.id}`}><Link href={`/gestion/categories/${c.id}`} className="text-ink hover:underline">Catégorie · {c.name}</Link></li>)}
                {usage.variants ? <li className="text-ink-muted">{usage.variants} variante{usage.variants > 1 ? "s" : ""}</li> : null}
              </ul>
            )}
          </Panel>
          <Panel title="Fichier">
            <p className="break-all font-mono text-xs text-ink-muted">{m.filePath}</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
