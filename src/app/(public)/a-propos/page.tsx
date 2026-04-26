import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Caption } from "@/components/ui/Caption";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { ScribbleAccent } from "@/components/ui/ScribbleAccent";
import { Reveal } from "@/components/ui/Reveal";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Établie depuis 1974 à Sherbrooke, Taxidermie de l'Estrie est une référence québécoise de la naturalisation et des fournitures de taxidermie.",
};

const TEAM = [
  { name: "Philippe Giguère", role: "Propriétaire" },
  { name: "Jessika Arcand-Duval", role: "Gérante" },
  { name: "Guillaume Ferland", role: "Fabrication" },
  { name: "Caroline Roy-Lavoie", role: "Commis bureau" },
];

const CHAPTERS = [
  {
    label: "I",
    title: "Le commerce",
    body: "Distributeur de fournitures pour la taxidermie, nous fournissons à nos clients tous les produits nécessaires pour la création de leurs trophées de chasse. Notre catalogue est disponible en magasin ou en ligne ; tous les produits sont disponibles en magasin ou par livraison.",
  },
  {
    label: "II",
    title: "L’atelier de tannerie",
    body: "Nous bénéficions également d’un département de tannerie. Il vous est possible de tanner gibiers de tout genre afin d’en obtenir le résultat désiré. Il nous est également possible de travailler certaines peaux pour la création de vêtements et autres ouvrages de confection.",
  },
  {
    label: "III",
    title: "Station d’enregistrement",
    body: "Pour tous nos chasseurs durant la période de chasse, il est possible de venir enregistrer vos prises chez nous. Nous bénéficions d’une station d’enregistrement établie par les Ressources naturelles de la faune — l’occasion de visiter notre salle de montre.",
  },
];

export default function AProposPage() {
  return (
    <>
      {/* Hero */}
      <Section spacing="lg" divide="bottom">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            <div className="md:col-span-7">
              <Caption className="block mb-4">Maison · Sherbrooke</Caption>
              <Heading level="display" as="h1">
                Une passion
                <span className="relative inline-block mx-3 italic">
                  depuis 1974
                  <ScribbleAccent
                    variant="underline"
                    className="absolute -bottom-3 left-0 h-3 w-full text-ochre"
                    strokeWidth={2.5}
                  />
                </span>
              </Heading>
              <p className="mt-8 max-w-2xl text-lead text-ink-muted text-balance">
                Établie depuis 1974, la maison Taxidermie de l’Estrie a toujours su répondre
                aux besoins des chasseurs, artisans et amateurs de naturalisation. Cinq
                décennies d’artisanat, transmises avec la même rigueur.
              </p>
            </div>

            <div className="md:col-span-4 md:col-start-9 md:self-end">
              <dl className="grid grid-cols-2 gap-y-4 border-t border-rule pt-6">
                <dt className="font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle">
                  Fondée en
                </dt>
                <dd className="text-right font-serif text-2xl text-ink">{SITE.established}</dd>
                <dt className="font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle">
                  Cinquante ans
                </dt>
                <dd className="text-right font-serif text-2xl text-ink">50</dd>
                <dt className="font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle">
                  Région
                </dt>
                <dd className="text-right font-serif text-base text-ink">Estrie · QC</dd>
              </dl>
            </div>
          </div>
        </Container>
      </Section>

      {/* Pull quote */}
      <Section spacing="lg" className="bg-bg-alt">
        <Container size="narrow" className="text-center">
          <ScribbleAccent variant="asterisk" className="h-6 w-6 mx-auto mb-6 text-ochre" />
          <p className="font-serif italic text-3xl md:text-4xl leading-snug text-ink text-balance">
            « Chaque trophée raconte une histoire de chasse, de patience, de territoire. Notre
            métier est de la préserver intacte — pour celui qui l’a vécue, comme pour ceux qui
            la regarderont demain. »
          </p>
          <Caption className="block mt-8">— L’atelier</Caption>
        </Container>
      </Section>

      {/* Three chapters */}
      <Section spacing="xl">
        <Container size="wide">
          <div className="mb-16">
            <Caption className="block mb-4">Trois chapitres</Caption>
            <Heading level="h1">Ce que nous faisons.</Heading>
          </div>

          <div className="space-y-20">
            {CHAPTERS.map((ch, i) => (
              <Reveal key={ch.label} direction="up" delay={i * 0.1}>
                <article className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-16 border-t border-rule-strong pt-8">
                  <div className="md:col-span-4">
                    <div className="font-serif text-7xl text-ochre leading-none">
                      {ch.label}
                    </div>
                  </div>
                  <div className="md:col-span-7 md:col-start-6">
                    <h3 className="font-serif text-3xl text-ink mb-6 text-balance">
                      {ch.title}
                    </h3>
                    <p className="text-lead text-ink-muted leading-relaxed max-w-prose">
                      {ch.body}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Team */}
      <Section spacing="xl" divide="top" className="bg-surface">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-8 mb-16 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <Caption className="block mb-4">L’équipe</Caption>
              <Heading level="h1">Quatre artisans à votre service.</Heading>
            </div>
            <div className="md:col-span-4 md:col-start-9">
              <p className="text-base text-ink-muted">
                Une petite équipe, solidaire, qui partage la même exigence du travail bien
                fait. Chaque pièce passe entre des mains qui en connaissent la valeur.
              </p>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
            {TEAM.map((member, i) => (
              <li key={member.name}>
                <Reveal direction="up" delay={i * 0.08}>
                  <article className="flex flex-col gap-4">
                    <div className="relative aspect-[4/5] bg-bg-alt overflow-hidden flex items-center justify-center">
                      <span className="font-serif text-7xl text-ink-subtle/40">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                      <span className="absolute top-3 left-3 font-mono text-[0.65rem] uppercase tracking-museum text-bg bg-ink/85 px-2 py-1">
                        N° {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-serif text-xl text-ink leading-tight">
                        {member.name}
                      </h3>
                      <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle">
                        {member.role}
                      </p>
                    </div>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* CTA */}
      <Section spacing="lg" divide="top">
        <Container size="wide" className="text-center">
          <Heading level="h1" className="mx-auto max-w-3xl">
            Une question, un projet, une visite ?
          </Heading>
          <p className="mt-6 text-lead text-ink-muted max-w-xl mx-auto">
            Notre salle de montre est ouverte aux visiteurs durant les heures d’ouverture.
          </p>
          <div className="mt-10 flex justify-center gap-4 flex-wrap">
            <Button href="/contact" variant="filled" size="lg" withArrow>
              Nous joindre
            </Button>
            <Button href="/realisations" variant="outline" size="lg">
              Voir les réalisations
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
