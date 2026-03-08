-- Enable Row Level Security (RLS) on all public tables
-- Fixes: policy_exists_rls_disabled, rls_disabled_in_public
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0007_policy_exists_rls_disabled
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_visits ENABLE ROW LEVEL SECURITY;
