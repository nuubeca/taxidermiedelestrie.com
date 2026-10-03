# Configuration Supabase Auth (OTP courriel)

Projet : `aboarqakjdrdlykqaief` (ca-central-1).

## 1. SMTP (Authentication → Emails → SMTP Settings)
- Host `smtp.resend.com`, port `465`, user `resend`, mot de passe = clé API Resend.
- Sender : `connexion@taxidermiedelestrie.com` (domaine vérifié dans Resend). Jamais `noreply@`.

## 2. Gabarits (Authentication → Emails → Templates)
Le gabarit est servi par l app : `public/auth/otp-email.html` → `https://<app>/auth/otp-email.html` (cloud : coller son contenu dans **Magic Link** ET **Confirm signup** ; stack Mac mini : `GOTRUE_MAILER_TEMPLATES_*` dans le compose)
(le premier sert aux comptes existants, le second à la création de compte).
Sujet : `Votre code de connexion — Taxidermie de l'Estrie`.
Le gabarit utilise `{{ .Token }}` (code) et non `{{ .ConfirmationURL }}` (lien).

## 3. Réglages (Authentication → Sign In / Providers → Email)
- Email OTP length : `6` (le formulaire valide 6 chiffres).
- Email OTP expiration : `600` secondes.
- Confirm email : activé. Allow new users to sign up : activé.

## 4. Variables d'environnement (local `.env` + Vercel)
Voir `.env.example` : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, `ORDERS_NOTIFY_EMAIL`.

## 5. Migration des comptes et commandes
```bash
yarn migrate:accounts   # lit ../wp-users-orders.json, idempotent
```

## 6. Sécurité
`prisma/sql/enable_rls.sql` active RLS et retire les droits anon/authenticated sur `public`.
À relancer après chaque `prisma db push` qui crée une table :
```bash
yarn prisma db execute --file prisma/sql/enable_rls.sql --schema prisma/schema.prisma
```
