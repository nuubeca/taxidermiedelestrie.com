"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Images, Loader2, Search, Star, Upload, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createMediaUpload,
  listLibrary,
  registerMedia,
  type LibraryItem,
  type UploadedMedia,
} from "@/app/gestion/(dashboard)/media/actions";
import { buttonClass, inputClass } from "./ui";
import { cn } from "@/lib/utils";

async function imageSize(file: File): Promise<{ width: number | null; height: number | null }> {
  try {
    const bmp = await createImageBitmap(file);
    const size = { width: bmp.width, height: bmp.height };
    bmp.close();
    return size;
  } catch {
    return { width: null, height: null };
  }
}

/** Envoie des fichiers au Storage (lien signé) puis les inscrit dans la médiathèque. */
export function useMediaUpload() {
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (files: File[]): Promise<UploadedMedia[]> => {
    setError(null);
    setUploading((n) => n + files.length);
    const supabase = createSupabaseBrowserClient();
    const done: UploadedMedia[] = [];
    for (const file of files) {
      try {
        const signed = await createMediaUpload({ fileName: file.name, contentType: file.type, size: file.size });
        if (!signed.success) throw new Error(signed.error);
        const { error: upErr } = await supabase.storage
          .from("media")
          .uploadToSignedUrl(signed.data.path, signed.data.token, file, { contentType: file.type });
        if (upErr) throw new Error(upErr.message);
        const dims = await imageSize(file);
        const reg = await registerMedia({
          path: signed.data.path,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          ...dims,
        });
        if (!reg.success) throw new Error(reg.error);
        done.push(reg.data);
      } catch (e) {
        setError(`${file.name} : ${e instanceof Error ? e.message : "échec de l'envoi"}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    return done;
  }, []);

  return { upload, uploading, error };
}

export function DropZone({
  onFiles,
  multiple = true,
  busy,
  compact = false,
}: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  busy?: boolean;
  compact?: boolean;
}) {
  const inputId = useId();
  const [over, setOver] = useState(false);
  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors duration-200",
        compact ? "p-4" : "p-8",
        over ? "border-ochre bg-ochre/5" : "border-rule bg-bg hover:border-ink-subtle",
      )}
    >
      {busy ? <Loader2 className="h-6 w-6 animate-spin text-ink-muted" aria-hidden /> : <Upload className="h-6 w-6 text-ink-muted" aria-hidden />}
      <span className="text-sm font-medium text-ink">{busy ? "Envoi en cours…" : "Glissez des images ici ou cliquez pour choisir"}</span>
      {!compact ? <span className="text-xs text-ink-muted">JPEG, PNG, WebP · 25 Mo maximum par image</span> : null}
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </label>
  );
}

/** Fenêtre de sélection dans la médiathèque. */
function LibraryDialog({
  open,
  onClose,
  onPick,
  multiple,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (urls: string[]) => void;
  multiple: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, start] = useTransition();

  const load = useCallback((query: string, p: number) => {
    start(async () => {
      const res = await listLibrary(query, p);
      if (!res.success) return;
      setItems((prev) => (p === 1 ? res.data.items : [...prev, ...res.data.items]));
      setMore(res.data.more);
      setPage(p);
    });
  }, []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setSelected([]);
      load(q, 1);
    }
    if (!open && d.open) d.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (url: string) =>
    setSelected((s) => (s.includes(url) ? s.filter((u) => u !== url) : multiple ? [...s, url] : [url]));

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[min(960px,calc(100vw-2rem))] rounded-2xl border border-rule bg-surface p-0 text-ink backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between border-b border-rule px-5 py-4">
        <h2 className="text-base font-semibold">Médiathèque</h2>
        <button type="button" onClick={onClose} className={buttonClass.ghost} aria-label="Fermer">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="p-5">
        <div className="mb-4 flex gap-2" role="search">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  load(q, 1);
                }
              }}
              placeholder="Chercher par nom de fichier ou titre"
              aria-label="Chercher dans la médiathèque"
              className={cn(inputClass, "pl-9")}
            />
          </div>
          <button type="button" onClick={() => load(q, 1)} className={buttonClass.secondary}>Chercher</button>
        </div>
        <div className="grid max-h-[55vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5 md:grid-cols-6">
          {items.map((m) => {
            const active = selected.includes(m.url);
            return (
              <button
                type="button"
                key={m.id}
                onClick={() => toggle(m.url)}
                aria-pressed={active}
                title={m.title ?? undefined}
                className={cn(
                  "relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-colors",
                  active ? "border-ochre" : "border-transparent hover:border-rule",
                )}
              >
                <Image src={m.url} alt={m.altText ?? m.title ?? ""} fill sizes="160px" className="object-cover" />
                {active ? <span className="absolute right-1 top-1 rounded-full bg-ochre px-1.5 text-xs font-medium text-white">{selected.indexOf(m.url) + 1}</span> : null}
              </button>
            );
          })}
          {!pending && items.length === 0 ? <p className="col-span-full py-10 text-center text-sm text-ink-muted">Aucune image.</p> : null}
        </div>
        {more ? (
          <div className="mt-3 text-center">
            <button type="button" disabled={pending} onClick={() => load(q, page + 1)} className={buttonClass.secondary}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Charger plus
            </button>
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-rule px-5 py-4">
        <span className="mr-auto text-sm text-ink-muted">{selected.length} sélectionnée{selected.length > 1 ? "s" : ""}</span>
        <button type="button" onClick={onClose} className={buttonClass.ghost}>Annuler</button>
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() => {
            onPick(selected);
            onClose();
          }}
          className={buttonClass.primary}
        >
          Ajouter
        </button>
      </div>
    </dialog>
  );
}

/** Une seule image (catégorie, variante) : publie la valeur dans un champ caché `name`. */
export function ImageInput({ name, defaultValue, label = "Image" }: { name: string; defaultValue: string | null; label?: string }) {
  const [url, setUrl] = useState<string | null>(defaultValue);
  const [library, setLibrary] = useState(false);
  const { upload, uploading, error } = useMediaUpload();

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={url ?? ""} />
      {url ? (
        <div className="relative aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-xl border border-rule bg-bg-alt">
          <Image src={url} alt={label} fill sizes="220px" className="object-cover" />
          <button
            type="button"
            onClick={() => setUrl(null)}
            className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-ink shadow transition-colors hover:bg-surface"
            aria-label="Retirer l'image"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : (
        <DropZone
          multiple={false}
          busy={uploading > 0}
          compact
          onFiles={async (files) => {
            const [first] = await upload(files);
            if (first) setUrl(first.url);
          }}
        />
      )}
      <div>
        <button type="button" onClick={() => setLibrary(true)} className={buttonClass.ghost}>
          <Images className="h-4 w-4" aria-hidden /> Choisir dans la médiathèque
        </button>
      </div>
      {error ? <p className="text-sm text-ochre" role="alert">{error}</p> : null}
      <LibraryDialog open={library} multiple={false} onClose={() => setLibrary(false)} onPick={([u]) => u && setUrl(u)} />
    </div>
  );
}

/**
 * Images d'un produit : la première est l'image principale, les suivantes la galerie.
 * Publie `primaryImageUrl` et `galleryImageUrls` (JSON) dans des champs cachés.
 */
export function GalleryInput({ primary, gallery }: { primary: string | null; gallery: string[] }) {
  const [urls, setUrls] = useState<string[]>(() => [primary, ...gallery].filter((u): u is string => Boolean(u)));
  const [library, setLibrary] = useState(false);
  const { upload, uploading, error } = useMediaUpload();

  const add = (list: string[]) => setUrls((u) => [...u, ...list.filter((x) => !u.includes(x))]);
  const move = (i: number, dir: -1 | 1) =>
    setUrls((u) => {
      const j = i + dir;
      if (j < 0 || j >= u.length) return u;
      const next = [...u];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="primaryImageUrl" value={urls[0] ?? ""} />
      <input type="hidden" name="galleryImageUrls" value={JSON.stringify(urls.slice(1))} />

      {urls.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {urls.map((u, i) => (
            <li key={u} className="group relative overflow-hidden rounded-xl border border-rule bg-bg-alt">
              <div className="relative aspect-square">
                <Image src={u} alt={i === 0 ? "Image principale" : `Image ${i + 1}`} fill sizes="200px" className="object-cover" />
              </div>
              {i === 0 ? (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-ink px-2 py-0.5 text-xs font-medium text-bg">
                  <Star className="h-3 w-3" aria-hidden /> Principale
                </span>
              ) : null}
              <div className="flex items-center justify-between gap-1 border-t border-rule bg-surface p-1">
                <div className="flex">
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className={cn(buttonClass.ghost, "h-8 px-2")} aria-label="Déplacer avant">
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                  </button>
                  <button type="button" disabled={i === urls.length - 1} onClick={() => move(i, 1)} className={cn(buttonClass.ghost, "h-8 px-2")} aria-label="Déplacer après">
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                {i !== 0 ? (
                  <button type="button" onClick={() => setUrls((x) => [u, ...x.filter((y) => y !== u)])} className={cn(buttonClass.ghost, "h-8 px-2 text-xs")}>
                    Principale
                  </button>
                ) : null}
                <button type="button" onClick={() => setUrls((x) => x.filter((y) => y !== u))} className={cn(buttonClass.ghost, "h-8 px-2 hover:text-ochre")} aria-label="Retirer l'image">
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <DropZone busy={uploading > 0} onFiles={async (files) => add((await upload(files)).map((m) => m.url))} />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setLibrary(true)} className={buttonClass.secondary}>
          <ImagePlus className="h-4 w-4" aria-hidden /> Choisir dans la médiathèque
        </button>
        {error ? <p className="text-sm text-ochre" role="alert">{error}</p> : null}
      </div>
      <LibraryDialog open={library} multiple onClose={() => setLibrary(false)} onPick={add} />
    </div>
  );
}
