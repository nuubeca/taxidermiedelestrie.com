import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Caption } from "@/components/ui/Caption";
import { Button } from "@/components/ui/Button";
import { ScribbleAccent } from "@/components/ui/ScribbleAccent";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Questions & réponses",
  description:
    "Conseils pratiques pour la chasse, l'enregistrement de gibier et la naturalisation : panache, peau d'ours, transport.",
};

const QA = [
  {
    question: "Dois-je être présent lors de l’enregistrement de mon gibier ?",
    answer:
      "Le chasseur qui a abattu un cerf de Virginie, un orignal, un ours noir ou un dindon doit se présenter lui-même avec son permis et faire enregistrer son animal auprès d’une personne, d’une société ou d’une association autorisée par le Ministère.",
  },
  {
    question: "Que dois-je faire si je souhaite naturaliser mon panache ?",
    answer:
      "Trop souvent, nous recevons des panaches coupés courts. L’idéal est de nous apporter le visage coupé sous la mâchoire du bas. Cela nous permettra ainsi d’avoir suffisamment de peau pour recouvrir votre panache lors de la naturalisation.",
  },
  {
    question:
      "Que dois-je faire si je souhaite faire naturaliser la tête de mon chevreuil, orignal ou ours ?",
    answer:
      "Premièrement, avisez votre boucher de vos intentions ; en général il vous laissera la peau en entier. Sinon, assurez-vous qu’elle soit coupée en ligne droite, six pouces à l’arrière des pattes avant.",
  },
  {
    question: "Je viens d’abattre un gibier en période de chasse — que dois-je faire ?",
    answer: `Que ce soit un cerf, un orignal, un ours ou un dindon sauvage, le chasseur doit détacher de son permis le coupon de transport (au bas du permis) et l’apposer sur l’animal. Si votre prise possède des bois, fixez-y votre coupon. Évitez de perforer les oreilles : toute coupure ou déchirure reste apparente lors d’une naturalisation.

Tout chasseur ayant abattu un gros gibier ou un dindon doit se présenter dans les 48 heures suivant la sortie de son lieu de chasse, avec son permis de chasse et son certificat de chasse. Le tarif applicable d’enregistrement doit être réglé. Le dindon sauvage doit être transporté et présenté en entier, éviscéré ou non. Pour l’ours, présentez la carcasse ou la fourrure ; pour le cerf, en entier ou en deux parties égales ; l’orignal peut être présenté en entier ou en quartier.

Pour plus d’information, visitez le site du Ministère des Forêts, de la Faune et des Parcs (mffp.gouv.qc.ca).`,
  },
];

export default function FAQPage() {
  return (
    <>
      {/* Hero */}
      <Section spacing="lg" divide="bottom">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            <div className="md:col-span-8">
              <Caption className="block mb-4">Conseils & repères</Caption>
              <Heading level="display" as="h1">
                Questions
                <span className="relative inline-block mx-3 italic">
                  & réponses
                  <ScribbleAccent
                    variant="underline"
                    className="absolute -bottom-3 left-0 h-3 w-full text-ochre"
                    strokeWidth={2.5}
                  />
                </span>
              </Heading>
              <p className="mt-8 max-w-2xl text-lead text-ink-muted text-balance">
                Quelques repères pratiques pour les chasseurs : enregistrement, préparation du
                gibier, conseils avant naturalisation. Une autre question ?{" "}
                <a href="/contact" className="link-naturalist text-ink">
                  Joignez-nous
                </a>
                .
              </p>
            </div>
            <div className="md:col-span-3 md:col-start-10 md:self-end">
              <div className="font-serif text-7xl text-ochre leading-none">
                {QA.length.toString().padStart(2, "0")}
              </div>
              <Caption className="block mt-2">questions courantes</Caption>
            </div>
          </div>
        </Container>
      </Section>

      {/* Q&A list — editorial alternating layout */}
      <Section spacing="xl">
        <Container size="wide">
          <ul className="space-y-24">
            {QA.map((qa, i) => (
              <li key={qa.question}>
                <Reveal direction="up" delay={i * 0.05}>
                  <article className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-16 border-t border-rule-strong pt-8">
                    {/* Index + question */}
                    <header className="md:col-span-5">
                      <div className="flex items-baseline gap-4">
                        <span className="font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle">
                          Q · {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <h2 className="mt-4 font-serif text-h2 font-normal text-ink leading-[1.1] text-balance">
                        {qa.question}
                      </h2>
                    </header>

                    {/* Answer */}
                    <div className="md:col-span-6 md:col-start-7">
                      <Caption className="block mb-4">Réponse</Caption>
                      <div className="space-y-4 text-lead text-ink-muted leading-relaxed max-w-prose">
                        {qa.answer.split("\n\n").map((para, pi) => (
                          <p key={pi}>{para}</p>
                        ))}
                      </div>
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
        <Container size="narrow" className="text-center">
          <Caption className="block mb-6">Une autre question ?</Caption>
          <Heading level="h1">Notre équipe vous répond.</Heading>
          <p className="mt-6 text-lead text-ink-muted">
            Par téléphone, par courriel ou en personne à l’atelier — nous sommes là pour vous
            orienter.
          </p>
          <div className="mt-10 flex justify-center gap-4 flex-wrap">
            <Button href="/contact" variant="filled" size="lg" withArrow>
              Nous joindre
            </Button>
            <Button href="/a-propos" variant="link">
              Notre approche
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
