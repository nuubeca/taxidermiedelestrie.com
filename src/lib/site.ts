export const SITE = {
  name: "Taxidermie de l'Estrie",
  tagline: "Une passion depuis 1974",
  shortName: "TDE",
  established: 1974,
  email: "info@mouldecfournitures.com",
  phone: "819-829-3819",
  phoneTollFree: "1-800-665-3819",
  fax: "819-564-0833",
  address: {
    street: "3331 Rue King Est",
    city: "Sherbrooke",
    region: "QC",
    postalCode: "J1E 3Y8",
    country: "Canada",
  },
  social: {
    facebook: "https://www.facebook.com/Taxidermiedelestriemouldecfournitures",
  },
  hours: {
    regular: [
      { label: "Lundi au vendredi", value: "8 h 00 — 17 h 00" },
      { label: "Samedi & dimanche", value: "Fermé" },
    ],
    huntingSeason: [
      { label: "Lundi au vendredi", value: "8 h 00 — 18 h 00" },
      { label: "Samedi", value: "9 h 00 — 12 h 00" },
      { label: "Dimanche", value: "À déterminer" },
    ],
  },
};

export const NAV_PRIMARY = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/tannerie", label: "Tannerie" },
  { href: "/a-propos", label: "À propos" },
  { href: "/questions-et-reponses", label: "Q & R" },
  { href: "/contact", label: "Contact" },
];

export const NAV_FOOTER_DISCOVER = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/tannerie", label: "Tannerie" },
];

export const NAV_FOOTER_INFO = [
  { href: "/a-propos", label: "À propos" },
  { href: "/questions-et-reponses", label: "Questions & réponses" },
  { href: "/contact", label: "Nous joindre" },
];

export type NavItem = (typeof NAV_PRIMARY)[number];
