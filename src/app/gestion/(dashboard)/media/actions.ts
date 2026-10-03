"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fail, ok, type ActionResult } from "@/lib/gestion/action-result";
import { MEDIA_BUCKET, buildMediaPath, findMediaUsage, mediaPathFromUrl, publicMediaUrl } from "@/lib/gestion/media";

const MAX_BYTES = 25 * 1024 * 1024;

const UploadSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|gif|avif)$/, "Format d'image non pris en charge (JPEG, PNG, WebP, GIF, AVIF)."),
  size: z.number().int().positive().max(MAX_BYTES, "Image trop lourde (25 Mo maximum)."),
});

/** Lien d'envoi signé : le navigateur envoie le fichier directement au Storage. */
export async function createMediaUpload(
  input: z.input<typeof UploadSchema>,
): Promise<ActionResult<{ path: string; token: string }>> {
  await requireAdmin();
  const parsed = UploadSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Fichier invalide.");

  const path = buildMediaPath(parsed.data.fileName);
  const { data, error } = await createSupabaseAdminClient().storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return fail(`Envoi impossible : ${error?.message ?? "réponse vide"}.`);
  return ok({ path: data.path, token: data.token });
}

const RegisterSchema = z.object({
  path: z.string().regex(/^\d{4}\/\d{2}\/[a-z0-9-]+\.[a-z0-9]+$/),
  fileName: z.string().max(200),
  contentType: z.string().max(60),
  size: z.number().int().nonnegative(),
  width: z.number().int().nonnegative().nullable(),
  height: z.number().int().nonnegative().nullable(),
});

export type UploadedMedia = { id: number; url: string; altText: string | null };

/** Enregistre dans la médiathèque un fichier déjà envoyé au Storage. */
export async function registerMedia(input: z.input<typeof RegisterSchema>): Promise<ActionResult<UploadedMedia>> {
  await requireAdmin();
  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success) return fail("Fichier invalide.");
  const d = parsed.data;

  const url = publicMediaUrl(d.path);
  const title = d.fileName.replace(/\.[^.]+$/, "");
  const asset = await prisma.mediaAsset.create({
    data: {
      originalUrl: url,
      filePath: d.path,
      publicUrl: url,
      storageBucket: MEDIA_BUCKET,
      storagePath: d.path,
      title,
      mimeType: d.contentType,
      fileSize: d.size,
      width: d.width,
      height: d.height,
      downloadedAt: new Date(),
    },
  });
  revalidatePath("/gestion/media");
  return ok({ id: asset.id, url, altText: null });
}

export type LibraryItem = { id: number; url: string; title: string | null; altText: string | null };

/** Images de la médiathèque pour le sélecteur (images publiques seulement). */
export async function listLibrary(q: string, page: number): Promise<ActionResult<{ items: LibraryItem[]; more: boolean }>> {
  await requireAdmin();
  const take = 48;
  const search = q.trim();
  const rows = await prisma.mediaAsset.findMany({
    where: {
      publicUrl: { not: null },
      AND: [
        { OR: [{ mimeType: null }, { NOT: { mimeType: { startsWith: "video/" } } }] },
        ...(search
          ? [{ OR: [{ title: { contains: search, mode: "insensitive" as const } }, { filePath: { contains: search, mode: "insensitive" as const } }, { altText: { contains: search, mode: "insensitive" as const } }] }]
          : []),
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: Math.max(0, page - 1) * take,
    take: take + 1,
    select: { id: true, publicUrl: true, title: true, altText: true },
  });
  return ok({
    items: rows.slice(0, take).map((r) => ({ id: r.id, url: r.publicUrl!, title: r.title, altText: r.altText })),
    more: rows.length > take,
  });
}

const UpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: z.string().trim().max(200),
  altText: z.string().trim().max(300),
});

export async function updateMedia(_prev: ActionResult<unknown> | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = UpdateSchema.safeParse({ id: formData.get("id"), title: formData.get("title") ?? "", altText: formData.get("altText") ?? "" });
  if (!parsed.success) return fail("Champs invalides.");
  await prisma.mediaAsset.update({
    where: { id: parsed.data.id },
    data: { title: parsed.data.title || null, altText: parsed.data.altText || null },
  });
  revalidatePath("/gestion/media");
  revalidatePath(`/gestion/media/${parsed.data.id}`);
  return ok();
}

export async function deleteMedia(id: number): Promise<ActionResult> {
  await requireAdmin();
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return fail("Média introuvable.");

  if (asset.publicUrl) {
    const usage = await findMediaUsage(asset.publicUrl);
    if (usage.total > 0) {
      return fail(`Image utilisée par ${usage.total} élément${usage.total > 1 ? "s" : ""}. Retirez-la d'abord.`);
    }
  }

  const bucket = asset.storageBucket ?? (asset.publicUrl ? MEDIA_BUCKET : null);
  const path = asset.storagePath ?? (asset.publicUrl ? mediaPathFromUrl(asset.publicUrl) : null);
  if (bucket && path) {
    const { error } = await createSupabaseAdminClient().storage.from(bucket).remove([path]);
    if (error) return fail(`Suppression du fichier impossible : ${error.message}.`);
  }
  await prisma.mediaAsset.delete({ where: { id } });
  revalidatePath("/gestion/media");
  redirect("/gestion/media");
}
