import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Caption } from "@/components/ui/Caption";
import { Button } from "@/components/ui/Button";
import { ScribbleAccent } from "@/components/ui/ScribbleAccent";

export const metadata: Metadata = {
  title: "Tannerie",
  description:
    "Tannage humide pour la naturalisation, tannage sec pour la confection. Tarifs des services de tannerie de Taxidermie de l'Estrie.",
};

const TANNAGE_HUMIDE = [
  { espece: "Ours noir — tête", details: ["Humide", "Oreilles", "Babines", "Crâne"] },
  { espece: "Ours noir — ½ corps", details: ["Humide", "Oreilles", "Babines", "Crâne"] },
  { espece: "Ours noir — ¾ corps", details: ["Humide", "Oreilles", "Babines", "Crâne"] },
  { espece: "Chevreuil — tête", details: ["Humide", "Oreilles", "Babines", "Crâne"] },
  { espece: "Caribou — tête", details: ["Humide", "Oreilles", "Babines", "Crâne"] },
  { espece: "Bison — tête", details: ["Humide", "Oreilles", "Babines", "Crâne"] },
  { espece: "Orignal — tête", details: ["Humide", "Oreilles", "Babines", "Crâne"] },
  { espece: "Coyote — tête", details: ["Humide", "Oreilles", "Babines", "Crâne"] },
  { espece: "Raton laveur — tête", details: ["Humide", "Oreilles", "Babines", "Crâne"] },
  { espece: "Renard — tête", details: ["Humide", "Oreilles", "Babines", "Crâne"] },
  { espece: "Sanglier — tête", details: ["Humide", "Oreilles", "Babines", "Crâne"] },
  { espece: "Wapiti — tête", details: ["Humide", "Oreilles", "Babines", "Crâne"] },
  { espece: "Loup — tête", details: ["Humide", "Oreilles", "Babines", "Crâne"] },
];

const TANNAGE_SEC = [
  "Belette",
  "Castor",
  "Chevreuil",
  "Chèvre",
  "Coyote",
  "Écureuil",
  "Lapin",
  "Loup",
  "Loutre",
  "Lynx",
  "Martre",
  "Moufette",
  "Ours noir",
  "Ours polaire",
  "Pékan",
  "Rat musqué",
  "Raton laveur",
  "Renard",
  "Vison",
];

export default function TanneriePage() {
  return (
    <>
      {/* Hero with status banner */}
      <Section spacing="lg" divide="bottom">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            <div className="md:col-span-8">
              <Caption className="block mb-4">Service spécialisé · Atelier</Caption>
              <Heading level="display" as="h1">
                Tannerie
              </Heading>
              <p className="mt-8 max-w-2xl text-lead text-ink-muted text-balance">
                Tannage humide pour la naturalisation, tannage sec pour la confection — nos
                grilles tarifaires couvrent l’essentiel du gibier nord-américain.
              </p>
            </div>

            <div className="md:col-span-4 md:col-start-9 md:self-end">
              <div className="border border-terracotta bg-terracotta/10 p-6 relative">
                <ScribbleAccent
                  variant="asterisk"
                  className="absolute -top-3 -right-3 h-6 w-6 text-terracotta"
                />
                <Caption tone="strong" className="block mb-3 text-terracotta">
                  Avis important
                </Caption>
                <p className="font-serif text-lg text-ink leading-snug">
                  Service de tannerie <em>non disponible actuellement</em>.
                </p>
                <p className="mt-3 text-sm text-ink-muted">
                  Les tarifs ci-dessous restent communiqués à titre indicatif. Pour toute
                  question, joignez-nous directement.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Tannage humide */}
      <Section spacing="xl">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-8 mb-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <Caption className="block mb-4">§ I · Tannage humide</Caption>
              <Heading level="h1" italic>
                Pour la naturalisation.
              </Heading>
            </div>
            <div className="md:col-span-7 md:col-start-6 md:self-end">
              <p className="text-lead text-ink-muted">
                Le tannage humide prépare la peau aux étapes de naturalisation. Les services
                couvrent la tête, les oreilles, les babines et le crâne pour chaque espèce.
              </p>
            </div>
          </div>

          {/* Pricing table */}
          <div className="overflow-hidden border border-rule">
            <table className="w-full">
              <thead className="bg-bg-alt">
                <tr>
                  <th className="text-left p-4 font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle">
                    Espèce
                  </th>
                  <th className="text-right p-4 font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle">
                    Humide
                  </th>
                  <th className="text-right p-4 font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle hidden md:table-cell">
                    Oreilles
                  </th>
                  <th className="text-right p-4 font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle hidden md:table-cell">
                    Babines
                  </th>
                  <th className="text-right p-4 font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle">
                    Crâne
                  </th>
                </tr>
              </thead>
              <tbody>
                {TANNAGE_HUMIDE.map((row, i) => (
                  <tr
                    key={row.espece}
                    className={i % 2 === 0 ? "bg-bg" : "bg-surface"}
                  >
                    <td className="p-4 font-serif text-ink">{row.espece}</td>
                    <td className="p-4 text-right font-mono text-sm text-ink-muted">
                      Sur demande
                    </td>
                    <td className="p-4 text-right font-mono text-sm text-ink-muted hidden md:table-cell">
                      Sur demande
                    </td>
                    <td className="p-4 text-right font-mono text-sm text-ink-muted hidden md:table-cell">
                      Sur demande
                    </td>
                    <td className="p-4 text-right font-mono text-sm text-ink-muted">
                      Sur demande
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle">
            Tarifs détaillés communiqués sur demande — service actuellement indisponible.
          </p>
        </Container>
      </Section>

      {/* Tannage sec */}
      <Section spacing="xl" divide="top" className="bg-surface">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-8 mb-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <Caption className="block mb-4">§ II · Tannage sec</Caption>
              <Heading level="h1" italic>
                Pour la confection.
              </Heading>
            </div>
            <div className="md:col-span-7 md:col-start-6 md:self-end">
              <p className="text-lead text-ink-muted">
                Deux finis disponibles : « humide » pour naturalisation et « fini » prêt à la
                confection (vêtements, accessoires en cuir).
              </p>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-px bg-rule border border-rule md:grid-cols-3 lg:grid-cols-4">
            {TANNAGE_SEC.map((espece, i) => (
              <li key={espece} className="bg-bg p-6">
                <div className="flex items-baseline justify-between mb-3">
                  <Caption tone="strong">N° {String(i + 1).padStart(2, "0")}</Caption>
                </div>
                <h3 className="font-serif text-lg text-ink">{espece}</h3>
                <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-wider text-ink-subtle">
                  Humide · Fini
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Cuir & confection */}
      <Section spacing="lg" divide="top">
        <Container size="narrow" className="text-center">
          <Caption className="block mb-4">Au-delà du trophée</Caption>
          <Heading level="h2">Cuir, confection et création.</Heading>
          <p className="mt-6 text-lead text-ink-muted">
            Il nous est également possible de travailler certaines peaux pour en faire
            simplement du cuir destiné à la confection de vêtements et autres ouvrages.
          </p>
        </Container>
      </Section>

      {/* CTA */}
      <Section spacing="lg" className="bg-ink text-bg" divide="top">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7">
              <span className="font-mono text-[0.7rem] uppercase tracking-museum text-bg/60">
                Reprise du service
              </span>
              <h2 className="mt-4 font-serif text-h1 font-light text-bg text-balance">
                Restez informé de la <em>réouverture</em>.
              </h2>
              <p className="mt-6 max-w-md text-bg/80">
                Pour être averti dès que le service de tannerie reprend, ou pour discuter d’un
                projet particulier, joignez-nous directement.
              </p>
            </div>
            <div className="md:col-span-4 md:col-start-9 md:text-right">
              <Button href="/contact" variant="outline" size="lg" className="border-bg text-bg hover:bg-bg hover:text-ink" withArrow>
                Nous joindre
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
