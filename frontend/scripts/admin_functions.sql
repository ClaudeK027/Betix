-- RPC Function to fetch consolidated admin users data
-- This joins profiles, auth.users (email), user_stats and subscriptions
-- Security Definer is used to bypass RLS and access auth schema safely

DROP FUNCTION IF EXISTS get_admin_users_v1();

CREATE OR REPLACE FUNCTION get_admin_users_v1()
RETURNS TABLE (
  id uuid,
  username text,
  email text,
  role text,
  plan_id text,
  avatar_url text,
  created_at timestamptz,
  last_active timestamptz,
  status text,
  favorite_sport text,
  total_predictions integer,
  win_rate double precision
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    u.email::text,
    p.role,
    s.plan_id::text,
    p.avatar_url,
    p.created_at,
    u.last_sign_in_at as last_active,
    COALESCE(s.status, 'inactive')::text as status,
    CASE 
        WHEN p.favorite_sports IS NOT NULL AND array_length(p.favorite_sports, 1) > 0 
        THEN p.favorite_sports[1]::text 
        ELSE 'Unknown'::text 
    END as favorite_sport,
    COALESCE(st.total_bets, 0)::integer as total_predictions,
    COALESCE(st.win_rate, 0.0)::double precision as win_rate
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  LEFT JOIN public.subscriptions s ON p.id = s.user_id
  LEFT JOIN public.user_stats st ON p.id = st.user_id
  WHERE p.deleted_at IS NULL
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;
