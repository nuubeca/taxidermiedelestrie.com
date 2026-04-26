import { Container } from "@/components/ui/Container";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Logo } from "./Logo";
import { PrimaryNav } from "./PrimaryNav";
import { MobileMenu } from "./MobileMenu";
import { SITE } from "@/lib/site";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      {/* Top info strip */}
      <div className="hidden md:block border-b border-rule">
        <Container size="wide" className="flex h-8 items-center justify-between text-[0.7rem]">
          <span className="font-mono uppercase tracking-museum text-ink-subtle">
            {SITE.address.street} · {SITE.address.city}
          </span>
          <div className="flex items-center gap-6 font-mono text-ink-subtle">
            <a href={`tel:${SITE.phone.replace(/-/g, "")}`} className="hover:text-ink transition-colors">
              {SITE.phone}
            </a>
            <span aria-hidden="true">·</span>
            <a href={`tel:${SITE.phoneTollFree.replace(/-/g, "")}`} className="hover:text-ink transition-colors">
              {SITE.phoneTollFree}
            </a>
          </div>
        </Container>
      </div>

      {/* Main header row */}
      <Container size="wide" className="flex h-20 md:h-24 items-center justify-between gap-6">
        <Logo />
        <div className="flex items-center gap-4">
          <PrimaryNav />
          <span className="hidden md:block h-6 w-px bg-rule" aria-hidden="true" />
          <ThemeToggle />
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}
