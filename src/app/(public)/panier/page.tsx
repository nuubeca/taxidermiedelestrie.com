import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Caption } from "@/components/ui/Caption";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Panier", robots: { index: false } };

export default function CartPage() {
  return (
    <Section spacing="xl">
      <Container size="wide">
        <Caption className="block mb-4">Votre sélection</Caption>
        <Heading level="h1" as="h1" className="mb-12">Panier</Heading>
        <CartView />
      </Container>
    </Section>
  );
}
