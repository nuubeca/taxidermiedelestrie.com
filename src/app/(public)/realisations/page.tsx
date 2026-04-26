import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Caption } from "@/components/ui/Caption";
import { Button } from "@/components/ui/Button";
import { ScribbleAccent } from "@/components/ui/ScribbleAccent";
import { Reveal } from "@/components/ui/Reveal";
import { prisma } from "@/lib/prisma";
import { getTopLevelCategories } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réalisations",
  description:
    "Portfolio de naturalisations réalisées : cervidés, oiseaux, mammifères, tannerie. Cinq décennies d'artisanat.",
};

export default async function RealisationsPage() {
  const categories = await getTopLevelCategories();

  // For each category, pull a handful of product images
  const groups = await Promise.all(
    categories.map(async (cat) => {
      const products = await prisma.product.findMany({
        where: {
          status: "PUBLISHED",
          primaryImageUrl: { not: null },
          categories: { some: { slug: cat.slug } },
        },
        select: {
          id: true,
          slug: true,
          name: true,
          primaryImageUrl: true,
        },
        take: 12,
        orderBy: [{ featured: "desc" }, { wpModifiedAt: "desc" }],
      });
      return { category: cat, products };
    }),
  );

  const populatedGroups = groups.filter((g) => g.products.length > 0);
  const totalPieces = populatedGroups.reduce((acc, g) => acc + g.products.length, 0);

  return (
    <>
      {/* Hero */}
      <Section spacing="lg" divide="bottom">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            <div className="md:col-span-7">
              <Caption className="block mb-4">Portfolio · Atelier</Caption>
              <Heading level="display" as="h1">
                Nos
                <span className="relative inline-block mx-3 italic">
                  réalisations
                  <ScribbleAccent
                    variant="underline"
                    className="absolute -bottom-3 left-0 h-3 w-full text-ochre"
                    strokeWidth={2.5}
                  />
                </span>
              </Heading>
              <p className="mt-8 max-w-2xl text-lead text-ink-muted">
                Parce que la réalisation de vos trophées nous tient à cœur. Une sélection de
                pièces issues de cinq décennies d’artisanat, classées par espèce.
              </p>
            </div>
            <div className="md:col-span-4 md:col-start-9 md:self-end">
              <dl className="border-t border-rule pt-6 grid grid-cols-2 gap-y-4">
                <dt className="font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle">
                  Sections
                </dt>
                <dd className="text-right font-serif text-2xl text-ink">
                  {populatedGroups.length.toString().padStart(2, "0")}
                </dd>
                <dt className="font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle">
                  Pièces visibles
                </dt>
                <dd className="text-right font-serif text-2xl text-ink">
                  {totalPieces.toString().padStart(3, "0")}
                </dd>
              </dl>
            </div>
          </div>

          {/* In-page navigation */}
          {populatedGroups.length > 0 && (
            <nav aria-label="Sections" className="mt-12 border-t border-rule pt-6">
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {populatedGroups.map((g, i) => (
                  <li key={g.category.id}>
                    <a
                      href={`#section-${g.category.slug}`}
                      className="font-mono text-[0.7rem] uppercase tracking-museum text-ink-muted hover:text-ink link-naturalist"
                    >
                      <span className="text-ink-subtle">0{i + 1}</span> · {g.category.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </Container>
      </Section>

      {/* Galleries by category */}
      {populatedGroups.map((g, gi) => (
        <Section key={g.category.id} spacing="xl" divide="top" className={gi % 2 === 0 ? "" : "bg-surface"}>
          <Container size="wide">
            <div
              id={`section-${g.category.slug}`}
              className="grid grid-cols-1 gap-8 mb-14 md:grid-cols-12 md:items-end"
            >
              <div className="md:col-span-7">
                <Caption className="block mb-4">
                  § {String(gi + 1).padStart(2, "0")} · Section
                </Caption>
                <Heading level="h1" italic={gi % 2 === 0}>
                  {g.category.name}
                </Heading>
                {g.category.description && (
                  <p className="mt-6 max-w-xl text-lead text-ink-muted">
                    {g.category.description}
                  </p>
                )}
              </div>
              <div className="md:col-span-3 md:col-start-10 md:text-right">
                <Button href={`/catalogue/${g.category.slug}`} variant="link">
                  Voir au catalogue ↗
                </Button>
              </div>
            </div>

            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {g.products.map((p, i) => (
                <li
                  key={p.id}
                  className={cn(
                    // Asymmetric editorial: certains éléments en aspect différent
                    i % 7 === 0 && "lg:col-span-2 lg:row-span-2",
                  )}
                >
                  <Reveal direction="up" delay={(i % 4) * 0.05}>
                    <PortfolioTile product={p} />
                  </Reveal>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ))}

      {/* CTA */}
      <Section spacing="lg" divide="top">
        <Container size="wide" className="text-center">
          <Caption className="block mb-6">Prêt à confier votre prochain trophée ?</Caption>
          <Heading level="h1" className="mx-auto max-w-3xl">
            Discutons de votre projet de naturalisation.
          </Heading>
          <div className="mt-10 flex justify-center gap-4">
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

function PortfolioTile({
  product,
}: {
  product: { id: number; slug: string; name: string; primaryImageUrl: string | null };
}) {
  return (
    <Link
      href={`/catalogue/${product.slug.split("/")[0] ?? "tous"}/${product.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden bg-bg-alt"
    >
      {product.primaryImageUrl && (
        <Image
          src={product.primaryImageUrl}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.05]"
        />
      )}
      {/* Caption overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4 translate-y-2 opacity-0 transition-all duration-500 ease-editorial group-hover:translate-y-0 group-hover:opacity-100">
        <div className="bg-bg/90 px-3 py-2">
          <p className="font-serif text-sm text-ink line-clamp-1">{product.name}</p>
        </div>
      </div>
    </Link>
  );
}
