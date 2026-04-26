import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Caption } from "@/components/ui/Caption";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { ScribbleAccent } from "@/components/ui/ScribbleAccent";
import { Reveal } from "@/components/ui/Reveal";
import { CategoryCard } from "@/components/catalog/CategoryCard";
import { ProductCard } from "@/components/catalog/ProductCard";
import {
  getFeaturedProducts,
  getRecentProducts,
  getTopLevelCategories,
} from "@/lib/queries";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getTopLevelCategories(),
    getFeaturedProducts(8),
  ]);

  const products = featured.length > 0 ? featured : await getRecentProducts(8);
  const heroImage = products[0]?.primaryImageUrl ?? categories[0]?.imageUrl ?? null;

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-rule">
        <Container size="wide" className="grid grid-cols-1 gap-10 py-16 md:grid-cols-12 md:gap-8 md:py-24 lg:py-32">
          {/* Left — copy */}
          <div className="md:col-span-7 lg:col-span-6 flex flex-col justify-center">
            <Reveal direction="up">
              <Caption className="block">
                Maison fondée en {SITE.established} · Sherbrooke (QC)
              </Caption>
            </Reveal>

            <Reveal direction="up" delay={0.1}>
              <Heading level="display" as="h1" className="mt-6 lg:mt-8">
                L’art de
                <span className="relative inline-block mx-3 italic">
                  préserver
                  <ScribbleAccent
                    variant="underline"
                    className="absolute -bottom-2 left-0 h-3 w-full text-ochre"
                    strokeWidth={2.5}
                  />
                </span>
                la beauté du gibier.
              </Heading>
            </Reveal>

            <Reveal direction="up" delay={0.25}>
              <p className="mt-8 max-w-xl text-lead text-ink-muted text-balance">
                Distributeur de fournitures de taxidermie, atelier de naturalisation et station
                d’enregistrement de gibier — au service des chasseurs et des artisans depuis
                cinq décennies.
              </p>
            </Reveal>

            <Reveal direction="up" delay={0.4}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button href="/catalogue" variant="filled" size="lg" withArrow>
                  Explorer le catalogue
                </Button>
                <Button href="/realisations" variant="link">
                  Voir nos réalisations
                </Button>
              </div>
            </Reveal>

            <Reveal direction="up" delay={0.55}>
              <div className="mt-16 grid grid-cols-3 gap-6 max-w-md border-t border-rule pt-6">
                <Stat number="50" label="ans" />
                <Stat number={`${categories.length}`} label="catégories" />
                <Stat number="∞" label="passion" />
              </div>
            </Reveal>
          </div>

          {/* Right — hero image collage */}
          <div className="md:col-span-5 lg:col-span-6 relative">
            <Reveal direction="left" delay={0.2}>
              <div className="relative aspect-[4/5] overflow-hidden bg-bg-alt">
                {heroImage ? (
                  <Image
                    src={heroImage}
                    alt="Atelier Taxidermie de l'Estrie"
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                    priority
                  />
                ) : null}
                {/* Museum metadata overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                  <Caption className="text-white/90">
                    Atelier · {SITE.address.street}
                  </Caption>
                </div>
              </div>
            </Reveal>

            {/* Floating annotation */}
            <Reveal direction="up" delay={0.6}>
              <div className="hidden md:flex absolute -bottom-8 -left-12 lg:-left-16 max-w-[14rem] flex-col gap-2 bg-bg border border-rule p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.3)]">
                <Caption tone="strong">Note de l’artisan</Caption>
                <p className="font-serif italic text-base leading-snug text-ink">
                  « Chaque trophée raconte une histoire. Notre travail est de la préserver. »
                </p>
              </div>
            </Reveal>
          </div>
        </Container>

        {/* Decorative running rule */}
        <div className="absolute top-1/2 -right-12 hidden lg:block">
          <ScribbleAccent variant="swirl" className="w-32 h-16 text-rule" strokeWidth={1} />
        </div>
      </section>

      {/* ============ CATÉGORIES ============ */}
      <Section spacing="xl" className="bg-surface">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-8 mb-16 md:grid-cols-12 md:items-end">
            <div className="md:col-span-5">
              <Caption className="block mb-4">§ I · Le cabinet</Caption>
              <Heading level="h1">Catégories d’ouvrages</Heading>
            </div>
            <div className="md:col-span-6 md:col-start-7">
              <p className="text-lead text-ink-muted text-balance">
                De la grande faune nord-américaine aux oiseaux et petits mammifères — chaque
                pièce trouve sa place dans une nomenclature soignée.
              </p>
            </div>
          </div>

          <ul className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, i) => (
              <li key={cat.id}>
                <Reveal direction="up" delay={i * 0.05}>
                  <CategoryCard category={cat} index={i} size="md" />
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ============ HISTOIRE ============ */}
      <Section spacing="xl" divide="top">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-4 md:sticky md:top-32 md:self-start">
              <Caption className="block mb-4">§ II · L’atelier</Caption>
              <Heading level="h2">
                Une passion <em>depuis</em> 1974
              </Heading>
            </div>

            <div className="md:col-span-7 md:col-start-6 max-w-prose">
              <p className="font-serif text-2xl leading-snug text-ink mb-8 text-balance">
                Établie depuis 1974, la maison Taxidermie de l’Estrie est devenue, au fil des
                décennies, une référence québécoise de la naturalisation et de la fourniture
                pour artisans.
              </p>
              <div className="space-y-5 text-base leading-relaxed text-ink-muted">
                <p>
                  Distributeur de fournitures pour la taxidermie, nous fournissons à nos
                  clients tous les produits nécessaires à la création de leurs trophées de
                  chasse — disponibles en magasin ou par livraison.
                </p>
                <p>
                  Nous bénéficions également d’un département de tannerie qui vous permet de
                  faire tanner gibiers de tout genre, ou de travailler certaines peaux pour la
                  confection.
                </p>
              </div>
              <div className="mt-10">
                <Button href="/a-propos" variant="outline" withArrow>
                  Notre histoire
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ============ TANNERIE CALLOUT ============ */}
      <Section spacing="xl" className="bg-bg-alt">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:items-center md:gap-16">
            <div className="md:col-span-5">
              <Caption className="block mb-4">§ III · Tannerie</Caption>
              <Heading level="h1" italic>
                Tanner, c’est transmettre.
              </Heading>
              <p className="mt-8 text-lead text-ink-muted">
                Tannage humide pour la naturalisation, tannage sec pour la confection. Nos
                grilles tarifaires couvrent l’ensemble du gibier nord-américain.
              </p>

              <div className="mt-8 flex items-center gap-3 border border-terracotta px-4 py-3 bg-terracotta/10">
                <span className="h-2 w-2 rounded-full bg-terracotta" aria-hidden="true" />
                <Caption tone="strong" className="text-terracotta">
                  Service non disponible actuellement — Consulter les tarifs
                </Caption>
              </div>

              <div className="mt-10">
                <Button href="/tannerie" variant="filled" withArrow>
                  Voir les tarifs
                </Button>
              </div>
            </div>

            <div className="md:col-span-6 md:col-start-7">
              <ul className="grid grid-cols-2 gap-px bg-rule border border-rule">
                {[
                  ["Tannage humide", "pour naturalisation"],
                  ["Tannage sec", "fini, prêt confection"],
                  ["Cuir & peaux", "vêtements et accessoires"],
                  ["Crâne blanchi", "et panaches"],
                ].map(([title, sub]) => (
                  <li key={title} className="bg-bg p-8">
                    <Caption className="block mb-3">Spécialité</Caption>
                    <h3 className="font-serif text-xl text-ink mb-2">{title}</h3>
                    <p className="text-sm text-ink-muted">{sub}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* ============ PIÈCES SÉLECTIONNÉES ============ */}
      {products.length > 0 && (
        <Section spacing="xl">
          <Container size="wide">
            <div className="flex flex-col gap-8 mb-16 md:flex-row md:items-end md:justify-between">
              <div>
                <Caption className="block mb-4">§ IV · Sélection</Caption>
                <Heading level="h1">Pièces du moment</Heading>
              </div>
              <Button href="/catalogue" variant="link">
                Tout le catalogue ↗
              </Button>
            </div>

            <ul className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {products.slice(0, 8).map((p, i) => (
                <li key={p.id}>
                  <Reveal direction="up" delay={(i % 4) * 0.06}>
                    <ProductCard product={p} index={i} />
                  </Reveal>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* ============ ATELIER / VISITE ============ */}
      <Section spacing="xl" className="bg-ink text-bg" divide="top">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-6">
              <span className="font-mono text-[0.7rem] uppercase tracking-museum text-bg/60">
                § V · Visite
              </span>
              <h2 className="mt-4 font-serif text-h1 font-light text-bg text-balance">
                Venez nous voir <em>à l’atelier</em>.
              </h2>
              <p className="mt-8 text-lead text-bg/80 max-w-md">
                Salle de montre ouverte aux visiteurs. Station d’enregistrement de gibier
                établie par les Ressources naturelles de la faune.
              </p>
            </div>

            <div className="md:col-span-5 md:col-start-8">
              <dl className="flex flex-col gap-6">
                <Detail label="Adresse">
                  {SITE.address.street}
                  <br />
                  {SITE.address.city} ({SITE.address.region}) {SITE.address.postalCode}
                </Detail>
                <Detail label="Téléphone">
                  <a href={`tel:${SITE.phone.replace(/-/g, "")}`} className="link-naturalist">
                    {SITE.phone}
                  </a>
                  <br />
                  <a
                    href={`tel:${SITE.phoneTollFree.replace(/-/g, "")}`}
                    className="link-naturalist text-bg/80"
                  >
                    Sans frais · {SITE.phoneTollFree}
                  </a>
                </Detail>
                <Detail label="Horaire régulier">
                  {SITE.hours.regular.map((h) => (
                    <span key={h.label} className="block text-bg/80">
                      <span className="text-bg">{h.label}</span> · {h.value}
                    </span>
                  ))}
                </Detail>
              </dl>

              <div className="mt-10">
                <Link
                  href="/contact"
                  className="inline-flex h-14 items-center px-8 bg-bg text-ink font-mono text-xs uppercase tracking-museum hover:bg-bg-alt transition-colors"
                >
                  Nous joindre →
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-4xl text-ink leading-none">{number}</div>
      <div className="mt-2 font-mono text-[0.65rem] uppercase tracking-museum text-ink-subtle">
        {label}
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-bg/20 pt-4">
      <dt className="font-mono text-[0.65rem] uppercase tracking-museum text-bg/60 mb-2">
        {label}
      </dt>
      <dd className="font-serif text-lg text-bg leading-snug">{children}</dd>
    </div>
  );
}
