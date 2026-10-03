/**
 * Base publique des médias migrés depuis WordPress : bucket Supabase Storage `media`,
 * chemins conservés (`YYYY/MM/fichier`). Local → stack Mac mini en IP privée ;
 * démo/prod → URL HTTPS de la stack ou du projet cloud.
 */
export const MEDIA_BASE_URL =
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL ??
  "https://supabase.pelti.co:5517/storage/v1/object/public/media";

export function mediaUrl(filePath: string): string {
  return `${MEDIA_BASE_URL}/${filePath.replace(/^\/+/, "")}`;
}
