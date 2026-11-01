-- Row Level Security: default-deny on every table. The public site never talks
-- to the database directly; it goes through the server functions in api/,
-- which connect with the database owner role. Only the two admin users (rows
-- in admin_users) can read anything through Supabase's client-side API.

do $$
declare
  t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end;
$$;

-- Admin read-only tables.
do $$
declare
  t text;
begin
  foreach t in array array[
    'payments', 'checkout_intents', 'holds', 'email_log', 'admin_users'
  ] loop
    execute format('grant select on public.%I to authenticated', t);
    execute format(
      'create policy admin_read on public.%I for select to authenticated using (public.is_admin())', t);
  end loop;
end;
$$;

-- Admin read/write tables (managed from the dashboard in Stage 2).
do $$
declare
  t text;
begin
  foreach t in array array[
    'settings', 'camps', 'sessions', 'miami_event', 'miami_groups', 'access_codes',
    'waivers', 'promo_codes', 'registrations', 'waitlist_entries',
    'private_training_requests', 'contacts'
  ] loop
    execute format('grant select, insert, update on public.%I to authenticated', t);
    execute format(
      'create policy admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end;
$$;

grant delete on public.access_codes, public.promo_codes, public.waitlist_entries to authenticated;

-- rate_limits and stripe_events stay server-only: RLS on, no grants, no policies.

-- Functions are executable by PUBLIC by default; lock the write helpers down.
revoke execute on function public.reserve_miami(uuid, jsonb, boolean, timestamptz) from public, anon, authenticated;
revoke execute on function public.reserve_sessions(uuid, jsonb, timestamptz) from public, anon, authenticated;
revoke execute on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.upsert_contact(text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.miami_availability() from public, anon;
revoke execute on function public.miami_gate_active() from public, anon;
revoke execute on function public.miami_group_usage(text) from public, anon;
revoke execute on function public.session_taken(uuid) from public, anon;
