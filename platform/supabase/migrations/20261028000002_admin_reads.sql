-- The admin dashboard reads as role `authenticated` under RLS. Grant the
-- read-only helpers it calls explicitly (Supabase grants these by default, but
-- relying on that differs between environments). They are SECURITY INVOKER, so
-- a non-admin still sees nothing: the table policies filter every row.
grant execute on function public.miami_availability() to authenticated;
grant execute on function public.miami_group_usage(text) to authenticated;
grant execute on function public.miami_codes_active() to authenticated;
grant execute on function public.miami_gate_active() to authenticated;
grant execute on function public.session_taken(uuid) to authenticated;
grant execute on function public.app_today() to authenticated;
grant execute on function public.is_admin() to authenticated;
