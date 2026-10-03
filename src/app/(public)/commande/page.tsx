import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Caption } from "@/components/ui/Caption";
import { LoginForm } from "@/app/(public)/connexion/LoginForm";
import { asAddress } from "@/lib/orders/format";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Passer la commande", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  return (
    <Section spacing="xl">
      <Container size="wide">
        <Caption className="block mb-4">{user ? "Dernière étape" : "Étape 1 de 2 · Identification"}</Caption>
        <Heading level="h1" as="h1" className="mb-6">Passer la commande</Heading>

        {user ? (
          <>
            <p className="mb-12 max-w-xl text-lead text-ink-muted text-balance">
              Vérifiez vos coordonnées et envoyez votre commande. Un commis vous rappelle pour confirmer transport, taxes et paiement.
            </p>
            <CheckoutForm
              email={user.email}
              defaults={{
                firstName: user.profile.firstName ?? "",
                lastName: user.profile.lastName ?? "",
                company: user.profile.company ?? "",
                phone: user.profile.phone ?? "",
                shipping: asAddress(user.profile.shipping),
              }}
            />
          </>
        ) : (
          <>
            <p className="mb-12 max-w-xl text-lead text-ink-muted text-balance">
              Entrez votre courriel pour continuer. Si c'est votre première visite, votre compte est créé automatiquement. Votre panier est conservé.
            </p>
            <div className="max-w-xl">
              <LoginForm next="/commande" />
            </div>
          </>
        )}
      </Container>
    </Section>
  );
}
