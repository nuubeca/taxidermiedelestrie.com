# Mouldec — Migration WooCommerce → Next.js

Migration du catalogue **Taxidermie de l'Estrie** depuis WordPress/WooCommerce vers Next.js 15 + PostgreSQL + Prisma.

## Pré-requis

- Node.js 20+
- Une instance PostgreSQL (Neon, Supabase, Railway, Docker local — peu importe)
- Le dump JSON phpMyAdmin du WP source à la racine du repo (`../mouldec_wp.json`)

## Installation

```bash
cd app
npm install
cp .env.example .env
# Éditer .env et renseigner DATABASE_URL
```

## Migration des données

```bash
# 1. Pousser le schéma Prisma vers la DB
npm run db:push

# 2. Transformer le dump JSON en JSON normalisé (data/transformed/)
npm run migrate:transform

# 3. Seeder Prisma (idempotent — relançable sans dupliquer)
npm run migrate:seed

# Raccourci pour lancer transform + seed:
npm run migrate:all
```

Après le seed, lancer l'admin pour vérifier visuellement:

```bash
npm run dev
# → http://localhost:3000/admin
```

## Téléchargement des médias (différé)

Les images vivent encore sur https://taxidermiedelestrie.com. Le seed enregistre uniquement les URLs absolues. Quand vous êtes prêt à rapatrier les fichiers:

```bash
# Téléchargement séquentiel raisonnable (concurrency 4, 250ms entre chaque requête)
npm run migrate:media

# Plus agressif (attention au rate-limit du WordPress source)
npm run migrate:media -- --concurrency=8 --rate=100

# Re-télécharger même les fichiers déjà présents
npm run migrate:media -- --force
```

Les images sont sauvegardées dans `public/uploads/<YYYY>/<MM>/<filename>` pour préserver l'arborescence WordPress. Le champ `MediaAsset.localPath` est mis à jour à la volée.

## Structure du projet

```
app/
├── prisma/schema.prisma          # Schéma DB (Product, Variant, Category, Tag, ProductAttribute, MediaAsset)
├── scripts/
│   ├── 01-transform.ts           # JSON dump → JSON normalisé
│   ├── 02-seed.ts                # JSON normalisé → Prisma
│   ├── 03-download-media.ts      # Téléchargement images (différé)
│   └── lib/
│       ├── load-json.ts          # Loader phpMyAdmin + helpers de cast
│       ├── php-unserialize.ts    # Désérialiseur PHP (gère bytes UTF-8)
│       └── types.ts              # Types des structures intermédiaires
├── data/transformed/             # Sorties de 01-transform (gitignored)
├── src/
│   ├── lib/prisma.ts             # Singleton PrismaClient
│   └── app/
│       ├── page.tsx              # Accueil
│       └── admin/
│           ├── page.tsx          # Dashboard (counts, dernière migration)
│           ├── products/         # Liste + fiche détail
│           ├── categories/       # Arbre hiérarchique
│           ├── tags/             # Cloud de tags
│           └── media/            # Galerie + statut téléchargement
└── public/uploads/               # Images téléchargées (gitignored)
```

## Modèle de données

### Tables source utilisées

| WordPress | Usage |
|---|---|
| `posts` (post_type=product) | Produits |
| `posts` (post_type=product_variation) | Variations (FK → produit via post_parent) |
| `posts` (post_type=attachment) | Médias |
| `postmeta` | Prix, stock, SKU, attributs sérialisés, dimensions, SEO Yoast, etc. |
| `terms` + `term_taxonomy` | Catégories, tags, types, visibilité |
| `term_relationships` | Liens produit ↔ catégorie/tag |
| `termmeta` | Image de catégorie (`thumbnail_id`) |

### Tables source ignorées

`actionscheduler_*`, `wc_admin_*`, `wc_order_*`, `woocommerce_payment_*`, `woocommerce_session*`, `woocommerce_shipping_*`, `woocommerce_tax_*`, `yith_wcwl*`, `yoast_*` (sauf SEO via postmeta), `nextend2_*`, `totalsoft_*`, `ts_poll_*`, etc.

### Particularités constatées

- **Attributs locaux uniquement** (la table `woocommerce_attribute_taxonomies` est vide). Chaque produit définit ses attributs dans `postmeta._product_attributes` (PHP serialized). Les options sont splittées sur `|`.
- **Variations** stockent l'option choisie pour chaque attribut dans des postmetas `attribute_<slug>`. On les agrège en `Variant.attributes` (JSON).
- **Images** référencées via `_thumbnail_id` (principale) et `_product_image_gallery` (CSV d'IDs d'attachments).

## Idempotence

Tous les seeds sont des `upsert` par `wpPostId` / `wpTermId`. Vous pouvez:

- Relancer `migrate:all` autant de fois que voulu
- Modifier le dump source et réimporter sans nettoyer la DB
- Pour repartir de zéro: `npm run db:push -- --force-reset` (attention: efface toutes les données)

Chaque exécution est tracée dans la table `MigrationRun` (visible dans le dashboard).

## Validation

Comptes attendus après migration complète:

| Table | Attendu |
|---|---|
| Product | 302 |
| Variant | 1018 |
| Category | 46 |
| Tag | 397 |
| MediaAsset | 614 |

Vérifier dans l'admin (`/admin`) ou via Prisma Studio (`npm run db:studio`).

## Décisions ouvertes

À traiter après le premier seed réussi:

1. **HTML legacy** dans `Product.description` — les shortcodes `[vc_row]` (Visual Composer) sont conservés tels quels. À convertir en Markdown ou à nettoyer selon l'UI cible.
2. **URLs front** — pas encore implémentées. Pattern à choisir: `/produit/[slug]` vs autre.
3. **Authentification admin** — actuellement pas de protection. Ajouter NextAuth ou middleware basic-auth avant exposition.
4. **Stockage médias** — actuellement `public/uploads`. Migration possible vers S3/Cloudinary/Vercel Blob.
5. **Avis produits** — la table `comments` (avec `comment_type='review'`) n'est pas migrée. À ajouter si besoin.
