import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Caption } from "@/components/ui/Caption";
import { ScribbleAccent } from "@/components/ui/ScribbleAccent";
import { Logo } from "./Logo";
import {
  NAV_FOOTER_DISCOVER,
  NAV_FOOTER_INFO,
  SITE,
} from "@/lib/site";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-rule bg-bg-alt text-ink">
      <Container size="wide" className="grid grid-cols-1 gap-12 py-20 md:grid-cols-12 md:gap-10">
        {/* Brand block */}
        <div className="md:col-span-5">
          <Logo size="lg" />
          <p className="mt-6 max-w-md font-serif italic text-lg text-ink-muted">
            « {SITE.tagline} »
          </p>
          <div className="mt-8 relative inline-block">
            <Caption tone="strong">Depuis {SITE.established}</Caption>
            <ScribbleAccent
              variant="underline"
              className="absolute -bottom-2 left-0 h-2 w-full text-ochre"
            />
          </div>
        </div>

        {/* Discover */}
        <div className="md:col-span-2">
          <Caption className="block mb-5">Découvrir</Caption>
          <ul className="flex flex-col gap-3">
            {NAV_FOOTER_DISCOVER.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink-muted hover:text-ink link-naturalist">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Info */}
        <div className="md:col-span-2">
          <Caption className="block mb-5">Information</Caption>
          <ul className="flex flex-col gap-3">
            {NAV_FOOTER_INFO.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink-muted hover:text-ink link-naturalist">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="md:col-span-3">
          <Caption className="block mb-5">Nous joindre</Caption>
          <address className="not-italic flex flex-col gap-3 text-sm text-ink-muted">
            <span>
              {SITE.address.street}
              <br />
              {SITE.address.city} ({SITE.address.region}) {SITE.address.postalCode}
            </span>
            <a
              href={`tel:${SITE.phone.replace(/-/g, "")}`}
              className="font-mono hover:text-ink link-naturalist w-fit"
            >
              {SITE.phone}
            </a>
            <a
              href={`mailto:${SITE.email}`}
              className="font-mono text-xs hover:text-ink link-naturalist w-fit"
            >
              {SITE.email}
            </a>
            <a
              href={SITE.social.facebook}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-ink link-naturalist w-fit"
            >
              Facebook ↗
            </a>
          </address>
        </div>
      </Container>

      {/* Colophon */}
      <div className="border-t border-rule">
        <Container
          size="wide"
          className="flex flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between"
        >
          <Caption>© {year} · Taxidermie de l’Estrie · Tous droits réservés</Caption>
          <Caption>
            Sherbrooke · Québec · Canada
          </Caption>
        </Container>
      </div>
    </footer>
  );
}
