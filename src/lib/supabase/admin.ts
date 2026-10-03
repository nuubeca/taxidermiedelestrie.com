import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Client avec la clé secrète : scripts de migration et création de comptes. Jamais côté navigateur. */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY sont requis.");
  return createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
}
