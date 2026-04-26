import type { Metadata } from "next";
import { MapPin, Phone, Printer, Mail, Clock } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Heading } from "@/components/ui/Heading";
import { Caption } from "@/components/ui/Caption";
import { ScribbleAccent } from "@/components/ui/ScribbleAccent";
import { ContactForm } from "./ContactForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Joignez Taxidermie de l'Estrie : adresse, téléphone, courriel, heures d'ouverture régulières et de saison de chasse.",
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <Section spacing="lg" divide="bottom">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            <div className="md:col-span-8">
              <Caption className="block mb-4">Atelier · Sherbrooke</Caption>
              <Heading level="display" as="h1">
                Nous
                <span className="relative inline-block mx-3 italic">
                  joindre
                  <ScribbleAccent
                    variant="underline"
                    className="absolute -bottom-3 left-0 h-3 w-full text-ochre"
                    strokeWidth={2.5}
                  />
                </span>
              </Heading>
              <p className="mt-8 max-w-2xl text-lead text-ink-muted text-balance">
                Par téléphone, par courriel ou en personne à la salle de montre — nous sommes
                disponibles pour répondre à vos questions et discuter de vos projets.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Form + Info */}
      <Section spacing="xl">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-20">
            {/* Form */}
            <div className="lg:col-span-7">
              <Caption className="block mb-6">Écrivez-nous</Caption>
              <Heading level="h2" className="mb-10">
                Envoyer un message
              </Heading>
              <ContactForm />
            </div>

            {/* Coordonnées */}
            <aside className="lg:col-span-4 lg:col-start-9">
              <Caption className="block mb-6">Coordonnées</Caption>
              <Heading level="h3" as="h2" className="mb-10">
                Maison · Atelier
              </Heading>

              <ul className="flex flex-col gap-7 border-y border-rule py-8">
                <ContactItem icon={<MapPin />} label="Adresse">
                  {SITE.address.street}
                  <br />
                  {SITE.address.city} ({SITE.address.region}) {SITE.address.postalCode}
                  <br />
                  {SITE.address.country}
                </ContactItem>

                <ContactItem icon={<Phone />} label="Téléphone">
                  <a
                    href={`tel:${SITE.phone.replace(/-/g, "")}`}
                    className="link-naturalist"
                  >
                    {SITE.phone}
                  </a>
                  <br />
                  <a
                    href={`tel:${SITE.phoneTollFree.replace(/-/g, "")}`}
                    className="link-naturalist text-ink-muted"
                  >
                    Sans frais · {SITE.phoneTollFree}
                  </a>
                </ContactItem>

                <ContactItem icon={<Printer />} label="Télécopieur">
                  {SITE.fax}
                </ContactItem>

                <ContactItem icon={<Mail />} label="Courriel">
                  <a
                    href={`mailto:${SITE.email}`}
                    className="link-naturalist break-all"
                  >
                    {SITE.email}
                  </a>
                </ContactItem>
              </ul>
            </aside>
          </div>
        </Container>
      </Section>

      {/* Heures d'ouverture */}
      <Section spacing="xl" divide="top" className="bg-surface">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-4">
              <Caption className="block mb-4 inline-flex items-center gap-2">
                <Clock className="h-3 w-3" strokeWidth={1.5} />
                Heures d’ouverture
              </Caption>
              <Heading level="h1" italic>
                Quand nous visiter.
              </Heading>
              <p className="mt-6 text-base text-ink-muted">
                Nos horaires varient selon la saison. Pendant la période de chasse, nous
                élargissons nos heures d’ouverture pour accommoder les chasseurs.
              </p>
            </div>

            <div className="md:col-span-7 md:col-start-6">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
                <ScheduleCard
                  title="Régulier"
                  rows={SITE.hours.regular}
                />
                <ScheduleCard
                  title="Saison de chasse"
                  subtitle="Arc, carabine & poudre noire"
                  rows={SITE.hours.huntingSeason}
                  accent
                />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Plan / map placeholder */}
      <Section spacing="lg" divide="top">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:items-end">
            <div className="md:col-span-6">
              <Caption className="block mb-4">Pour s’y rendre</Caption>
              <Heading level="h2">
                {SITE.address.street}, {SITE.address.city}
              </Heading>
            </div>
            <div className="md:col-span-4 md:col-start-9 md:text-right">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  `${SITE.address.street}, ${SITE.address.city}, ${SITE.address.region}`,
                )}`}
                target="_blank"
                rel="noreferrer noopener"
                className="font-mono text-xs uppercase tracking-museum text-ink hover:text-ink-muted link-naturalist"
              >
                Ouvrir dans Google Maps ↗
              </a>
            </div>
          </div>

          <div className="mt-12 relative aspect-[16/7] bg-bg-alt overflow-hidden border border-rule">
            <iframe
              title="Plan de l'atelier Taxidermie de l'Estrie"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                `${SITE.address.street}, ${SITE.address.city}, ${SITE.address.region} ${SITE.address.postalCode}`,
              )}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 w-full h-full grayscale contrast-[1.05] opacity-90"
            />
          </div>
        </Container>
      </Section>
    </>
  );
}

function ContactItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[2rem_1fr] gap-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-rule text-ink">
        <span className="[&>svg]:h-4 [&>svg]:w-4 [&>svg]:stroke-[1.5]">{icon}</span>
      </span>
      <div>
        <div className="font-mono text-[0.7rem] uppercase tracking-museum text-ink-subtle mb-1">
          {label}
        </div>
        <div className="text-base text-ink leading-snug">{children}</div>
      </div>
    </li>
  );
}

function ScheduleCard({
  title,
  subtitle,
  rows,
  accent = false,
}: {
  title: string;
  subtitle?: string;
  rows: { label: string; value: string }[];
  accent?: boolean;
}) {
  return (
    <article
      className={
        accent
          ? "border border-ochre p-6 bg-ochre/5"
          : "border border-rule p-6"
      }
    >
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-serif text-xl text-ink">{title}</h3>
        {accent && (
          <span className="font-mono text-[0.65rem] uppercase tracking-museum text-ochre">
            Saison
          </span>
        )}
      </div>
      {subtitle && <Caption className="block mb-4">{subtitle}</Caption>}
      <dl className="flex flex-col">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-2 gap-3 border-t border-rule py-3 last:border-b-0"
          >
            <dt className="text-sm text-ink-muted">{row.label}</dt>
            <dd className="text-right text-sm text-ink font-mono">{row.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
