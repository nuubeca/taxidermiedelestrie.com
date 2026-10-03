import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Caption } from "@/components/ui/Caption";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <PublicHeader />
      <Section spacing="xl">
        <Container size="narrow">
          <Caption className="block mb-4">Espace client</Caption>
          <Heading level="h1" as="h1" className="mb-6">
            Connexion
          </Heading>
          <p className="mb-12 max-w-xl text-lead text-ink-muted text-balance">
            Consultez vos commandes passées et passez-en de nouvelles. Entrez votre courriel, nous vous envoyons un code.
          </p>
          <LoginForm next={sp.next} initialEmail={sp.email} />
        </Container>
      </Section>
      <PublicFooter />
    </>
  );
}
