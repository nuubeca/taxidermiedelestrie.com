import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Caption } from "@/components/ui/Caption";
import { Button } from "@/components/ui/Button";
import { ScribbleAccent } from "@/components/ui/ScribbleAccent";
import { mediaUrl } from "@/lib/media";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Conserver sa peau d'ours après la chasse",
  description:
    "Incision ventrale ou dorsale : comment préparer et congeler la peau de votre ours selon le montage souhaité, tapis, fourrure ou naturalisation complète.",
  alternates: { canonical: "/conseils/conserver-sa-peau-d-ours" },
};

const TECHNIQUES = [
  {
    numero: "§ I",
    titre: "L'incision ventrale",
    usage: "Pour un tapis ou une simple fourrure",
    image: mediaUrl("2018/09/bear-1.png"),
    alt: "Schéma de l'incision ventrale sur un ours, du menton à la queue et le long des pattes",
    texte:
      "Cette technique est utilisée lorsque vous désirez faire un tapis ou simplement conserver la fourrure. Effectuez les incisions aux endroits indiqués sur le schéma. Coupez ensuite la tête et les pattes à la chair, puis placez le tout au congélateur, cuir sur cuir.",
  },
  {
    numero: "§ II",
    titre: "L'incision dorsale",
    usage: "Pour un montage complet",
    image: mediaUrl("2018/09/bear-back.png"),
    alt: "Schéma de l'incision dorsale sur un ours, le long de la colonne vertébrale",
    texte:
      "Cette technique est pratiquée si vous désirez un montage complet. Effectuez une seule incision à l'endroit indiqué sur le schéma. Coupez la tête et les pattes à la chair, puis placez l'ours au congélateur, cuir sur cuir.",
  },
];

export default function BearSkinPage() {
  return (
    <>
      <Section spacing="lg" divide="bottom">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            <div className="md:col-span-8">
              <Caption className="block mb-4">Conseils · Chasse à l'ours</Caption>
              <Heading level="display" as="h1">
                Conserver sa peau d'ours
                <span className="relative inline-block mx-3 italic">
                  après la chasse
                  <ScribbleAccent variant="underline" className="absolute -bottom-3 left-0 h-3 w-full text-ochre" strokeWidth={2.5} />
                </span>
              </Heading>
              <p className="mt-8 max-w-2xl text-lead text-ink-muted text-balance">
                Deux techniques s'offrent à vous selon ce que vous voulez en faire. Dans les deux cas, le secret est le même :
                une peau bien incisée, coupée à la chair et congelée cuir sur cuir le plus vite possible.
              </p>
            </div>
            <aside className="md:col-span-4 md:self-end">
              <Caption tone="strong" className="block mb-3 text-terracotta">Avant de commencer</Caption>
              <p className="font-serif text-lg text-ink leading-snug">Pas certain de la technique à choisir ?</p>
              <p className="mt-3 text-sm text-ink-muted">
                Appelez-nous au {SITE.phone} avant d'inciser. Une erreur de coupe se répare mal au montage.
              </p>
            </aside>
          </div>
        </Container>
      </Section>

      {TECHNIQUES.map((t, i) => (
        <Section key={t.titre} spacing="xl" divide={i === 0 ? "bottom" : undefined} className={i === 1 ? "bg-surface" : undefined}>
          <Container size="wide">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16 items-start">
              <div className={i % 2 === 0 ? "md:col-span-5" : "md:col-span-5 md:order-2"}>
                <Caption className="block mb-4">{t.numero} · {t.usage}</Caption>
                <Heading level="h1" italic>{t.titre}</Heading>
                <p className="mt-8 text-lead text-ink-muted">{t.texte}</p>
                <ul className="mt-8 space-y-3 text-sm text-ink">
                  <li className="flex gap-3"><span className="font-mono text-ink-subtle">01</span> Inciser aux endroits indiqués sur le schéma.</li>
                  <li className="flex gap-3"><span className="font-mono text-ink-subtle">02</span> Couper la tête et les pattes à la chair.</li>
                  <li className="flex gap-3"><span className="font-mono text-ink-subtle">03</span> Congeler sans attendre, cuir sur cuir.</li>
                </ul>
              </div>
              <figure className={i % 2 === 0 ? "md:col-span-7" : "md:col-span-7 md:order-1"}>
                <div className="relative aspect-[4/3] bg-bg-alt border border-rule">
                  <Image src={t.image} alt={t.alt} fill sizes="(min-width: 768px) 58vw, 100vw" className="object-contain p-6" />
                </div>
                <figcaption className="mt-3 font-mono text-xs text-ink-subtle">{t.alt}</figcaption>
              </figure>
            </div>
          </Container>
        </Section>
      ))}

      <Section spacing="lg" divide="top">
        <Container size="wide">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <Caption className="block mb-2">Ensuite</Caption>
              <p className="font-serif text-xl text-ink">Apportez-nous la peau congelée, on s'occupe du tannage et du montage.</p>
            </div>
            <div className="flex gap-4">
              <Button href="/tannerie" variant="outline" withArrow>Services de tannerie</Button>
              <Button href="/contact" withArrow>Nous joindre</Button>
            </div>
          </div>
          <p className="mt-8 text-sm text-ink-muted">
            D'autres questions ? Voir les <Link href="/questions-et-reponses" className="link-naturalist text-ink">questions et réponses</Link>.
          </p>
        </Container>
      </Section>
    </>
  );
}
