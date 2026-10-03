import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Profile, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  profile: Profile;
};

/**
 * Utilisateur courant, ou null. Le profil est créé à la volée à la première
 * connexion (rôle CUSTOMER par défaut). `cache` évite plusieurs appels par requête.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const email = user.email.toLowerCase();
  const profile =
    (await prisma.profile.findUnique({ where: { id: user.id } })) ??
    (await prisma.profile.upsert({
      where: { email },
      update: { id: user.id },
      create: { id: user.id, email },
    }));

  return { id: user.id, email, profile };
});

export async function requireUser(nextPath?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const params = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/connexion${params}`);
  }
  return user;
}

export async function requireRole(role: UserRole, nextPath?: string): Promise<CurrentUser> {
  const user = await requireUser(nextPath);
  if (user.profile.role !== role) redirect("/mon-compte");
  return user;
}

export const requireAdmin = (nextPath?: string) => requireRole("ADMIN", nextPath);
