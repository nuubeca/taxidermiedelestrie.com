import Link from "next/link";
import { UserRound } from "lucide-react";

/** Lien statique : /mon-compte redirige vers /connexion si la session est absente (proxy). */
export function AccountLink() {
  return (
    <Link
      href="/mon-compte"
      aria-label="Mon compte"
      className="inline-flex h-10 w-10 items-center justify-center text-ink hover:text-ink-muted transition-colors"
    >
      <UserRound className="h-5 w-5" strokeWidth={1.5} />
    </Link>
  );
}
