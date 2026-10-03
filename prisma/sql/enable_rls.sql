-- Les tables Prisma vivent dans `public`, exposé par l'API Data de Supabase.
-- L'app n'utilise que Prisma (rôle postgres, bypass RLS) : on verrouille tout pour anon/authenticated.
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
