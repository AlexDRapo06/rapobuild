-- Connecting the live site (rapobuild): its camp ids use underscores, its camp
-- form doesn't ask for a phone (Stripe collects it), its Miami pricing goes up
-- on a date, sessions close at a set time (Veterans Day), the training inquiry
-- form has different fields, and private-training packages are sold online.

alter table public.camps drop constraint camps_slug_check;
alter table public.camps add constraint camps_slug_check check (slug ~ '^[a-z0-9_-]+$');
alter table public.sessions drop constraint sessions_slug_check;
alter table public.sessions add constraint sessions_slug_check check (slug ~ '^[a-z0-9_-]+$');

-- The site page (hash route) a family returns to if they cancel Stripe checkout.
alter table public.camps add column site_route text;

alter table public.sessions add column closes_at timestamptz;

alter table public.miami_groups
  add column age_min integer check (age_min between 0 and 25),
  add column age_max integer check (age_max between 0 and 25);

-- [{ "until": ISO or null, "cents": 150000 }, ...]: the first tier whose `until`
-- hasn't passed sets the price for everyone. Empty = use the group prices.
alter table public.miami_event add column price_tiers jsonb not null default '[]';

alter table public.registrations alter column parent_phone drop not null;

alter table public.private_training_requests
  alter column town drop not null,
  alter column player_name drop not null,
  alter column player_age drop not null,
  add column players     text,
  add column bundle      text,
  add column player_ages text;

alter table public.checkout_intents drop constraint checkout_intents_flow_check;
alter table public.checkout_intents add constraint checkout_intents_flow_check check (flow in ('camp', 'miami', 'training'));

-- Private-training packages bought online (site "Buy" buttons).
create table public.training_purchases (
  id           uuid primary key default gen_random_uuid(),
  payment_id   uuid not null unique references public.payments (id),
  package_id   text not null,
  package_name text not null,
  parent_name  text,
  email        text,
  phone        text,
  player_name  text,
  player_age   text,
  status       text not null default 'new' check (status in ('new', 'scheduled', 'completed')),
  created_at   timestamptz not null default now()
);

alter table public.training_purchases enable row level security;
revoke all on public.training_purchases from anon, authenticated;
grant select, update on public.training_purchases to authenticated;
create policy admin_all on public.training_purchases for all to authenticated using (public.is_admin()) with check (public.is_admin());
