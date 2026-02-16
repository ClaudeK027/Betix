-- 1. Activer la réplication pour la table public.matches
-- Cela permet à Supabase de suivre les changements ligne par ligne.
ALTER TABLE public.matches REPLICA IDENTITY FULL;

-- 2. Ajouter la table à la publication 'supabase_realtime'
-- 'supabase_realtime' est la publication par défaut écoutée par les Websockets.
BEGIN;
  -- Supprimer si déjà présent pour éviter les erreurs lors d'une ré-exécution
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.matches;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
COMMIT;
