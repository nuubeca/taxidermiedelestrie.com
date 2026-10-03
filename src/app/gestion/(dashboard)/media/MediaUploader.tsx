"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { DropZone, useMediaUpload } from "@/components/gestion/media-input";

export function MediaUploader() {
  const router = useRouter();
  const { upload, uploading, error } = useMediaUpload();
  const [done, setDone] = useState(0);
  return (
    <div className="mb-6 flex flex-col gap-2">
      <DropZone
        busy={uploading > 0}
        onFiles={async (files) => {
          const res = await upload(files);
          setDone(res.length);
          router.refresh();
        }}
      />
      {uploading > 0 ? <p className="text-sm text-ink-muted">{uploading} image{uploading > 1 ? "s" : ""} en cours d&apos;envoi…</p> : null}
      {done > 0 && uploading === 0 ? (
        <p className="inline-flex items-center gap-1.5 text-sm text-moss" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> {done} image{done > 1 ? "s" : ""} ajoutée{done > 1 ? "s" : ""}.
        </p>
      ) : null}
      {error ? <p className="text-sm text-ochre" role="alert">{error}</p> : null}
    </div>
  );
}
