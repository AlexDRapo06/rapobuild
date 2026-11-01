-- Footy Up registration platform: core schema.
-- Covers every stage up front (waitlists, waivers, promo codes, email log) so
-- later stages add behaviour, not table rework.

-- ---------------------------------------------------------------------------
-- Configuration
-- ---------------------------------------------------------------------------

create table public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.camps (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  host        text,
  kind        text not null default 'summer' check (kind in ('summer', 'winter', 'miami', 'other')),
  info_only   boolean not null default false,
  active      boolean not null default true,
  description text,
  info_url    text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.sessions (
  id                     uuid primary key default gen_random_uuid(),
  camp_id                uuid not null references public.camps (id) on delete restrict,
  slug                   text not null check (slug ~ '^[a-z0-9-]+$'),
  name                   text not null,
  starts_on              date,
  ends_on                date,
  start_time             time,
  location               text,
  age_min                integer check (age_min between 0 and 25),
  age_max                integer check (age_max between 0 and 25),
  price_cents            integer not null check (price_cents >= 0),
  early_bird_price_cents integer check (early_bird_price_cents >= 0),
  early_bird_until       date,
  capacity               integer check (capacity > 0),
  status                 text not null default 'open' check (status in ('open', 'closed')),
  info_text              text,
  reminder_days          integer[] not null default '{7,1}',
  sort_order             integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (camp_id, slug),
  check (ends_on is null or starts_on is null or ends_on >= starts_on),
  check (age_max is null or age_min is null or age_max >= age_min)
);

create index sessions_camp_idx on public.sessions (camp_id);

-- Singleton row describing the Miami combine. Dates, wording and opening time
-- are unconfirmed, so all are nullable configuration.
create table public.miami_event (
  id              boolean primary key default true check (id),
  camp_id         uuid not null references public.camps (id),
  name            text not null,
  starts_on       date,
  ends_on         date,
  location        text,
  info_text       text,
  opens_at        timestamptz,
  checkout_open   boolean not null default true,
  hold_minutes    integer not null default 35 check (hold_minutes between 31 and 1440),
  waiver_required boolean not null default false,
  clothing_sizes  text[] not null default '{}',
  updated_at      timestamptz not null default now()
);

create table public.miami_groups (
  grp                       text primary key check (grp in ('boys', 'girls')),
  label                     text not null,
  cap                       integer not null default 200 check (cap >= 0),
  reserved_for_code_holders integer not null default 0 check (reserved_for_code_holders >= 0),
  reserved_until            timestamptz,
  price_code_holder_cents   integer check (price_code_holder_cents >= 0),
  price_public_cents        integer check (price_public_cents >= 0),
  open                      boolean not null default true,
  updated_at                timestamptz not null default now(),
  check (reserved_for_code_holders <= cap)
);

-- Only a SHA-256 hash of each code is stored; codes never reach the browser.
create table public.access_codes (
  id         uuid primary key default gen_random_uuid(),
  code_hash  text not null unique,
  label      text,
  grp        text check (grp in ('boys', 'girls')),
  active     boolean not null default true,
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);

-- Waiver text is versioned and immutable once written (see trigger below).
create table public.waivers (
  id         uuid primary key default gen_random_uuid(),
  flow       text not null check (flow in ('camp', 'miami', 'all')),
  version    integer not null check (version > 0),
  title      text not null,
  body       text not null,
  url        text,
  active     boolean not null default false,
  created_at timestamptz not null default now(),
  unique (flow, version)
);

create table public.promo_codes (
  id                       uuid primary key default gen_random_uuid(),
  code                     text not null unique check (code = upper(code)),
  kind                     text not null check (kind in ('percent', 'amount')),
  amount                   integer not null check (amount > 0),
  scope                    text not null default 'all' check (scope in ('all', 'camp', 'session', 'miami')),
  camp_id                  uuid references public.camps (id),
  session_id               uuid references public.sessions (id),
  max_uses                 integer check (max_uses > 0),
  per_customer_limit       integer check (per_customer_limit > 0),
  starts_at                timestamptz,
  ends_at                  timestamptz,
  active                   boolean not null default true,
  stripe_coupon_id         text,
  stripe_promotion_code_id text,
  created_at               timestamptz not null default now(),
  check (kind <> 'percent' or amount <= 100)
);

-- ---------------------------------------------------------------------------
-- Checkout lifecycle
-- ---------------------------------------------------------------------------

-- A checkout the parent has started but not paid for. The payload holds the
-- form data until the Stripe webhook turns it into registrations, so no child
-- data is ever stored in Stripe metadata. Payload is cleared on completion or
-- expiry.
create table public.checkout_intents (
  id                uuid primary key default gen_random_uuid(),
  flow              text not null check (flow in ('camp', 'miami')),
  status            text not null default 'pending' check (status in ('pending', 'completed', 'expired', 'failed')),
  payload           jsonb,
  via_access_code   boolean not null default false,
  amount_cents      integer not null check (amount_cents >= 0),
  stripe_session_id text unique,
  expires_at        timestamptz not null,
  created_at        timestamptz not null default now(),
  completed_at      timestamptz
);

create index checkout_intents_pending_idx on public.checkout_intents (expires_at) where status = 'pending';

create table public.holds (
  id              uuid primary key default gen_random_uuid(),
  intent_id       uuid not null references public.checkout_intents (id) on delete cascade,
  session_id      uuid references public.sessions (id),
  miami_group     text references public.miami_groups (grp),
  quantity        integer not null check (quantity > 0),
  via_access_code boolean not null default false,
  status          text not null default 'active' check (status in ('active', 'converted', 'released')),
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now(),
  check ((session_id is null) <> (miami_group is null))
);

create index holds_active_session_idx on public.holds (session_id) where status = 'active';
create index holds_active_group_idx on public.holds (miami_group) where status = 'active';
create index holds_intent_idx on public.holds (intent_id);

create table public.payments (
  id                         uuid primary key default gen_random_uuid(),
  intent_id                  uuid unique references public.checkout_intents (id),
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id   text unique,
  currency                   text not null default 'usd',
  amount_subtotal_cents      integer not null default 0,
  amount_total_cents         integer not null default 0,
  discount_cents             integer not null default 0,
  promo_code                 text,
  refunded_cents             integer not null default 0,
  status                     text not null default 'paid' check (status in ('paid', 'refunded', 'partially_refunded')),
  customer_email             text,
  -- Sessions created by the legacy api/checkout.js have no intent; their raw
  -- Stripe metadata is kept here so nothing is lost during the migration.
  legacy_metadata            jsonb,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create table public.registrations (
  id                   uuid primary key default gen_random_uuid(),
  intent_id            uuid not null references public.checkout_intents (id),
  line_no              integer not null,
  payment_id           uuid not null references public.payments (id),
  camp_id              uuid not null references public.camps (id),
  session_id           uuid references public.sessions (id),
  miami_group          text references public.miami_groups (grp),
  via_access_code      boolean not null default false,
  status               text not null default 'active' check (status in ('active', 'cancelled')),
  parent_name          text not null,
  parent_email         text not null,
  parent_phone         text not null,
  parent_town          text not null,
  player_name          text not null,
  player_age           integer not null,
  player_sex           text check (player_sex in ('boy', 'girl')),
  -- Miami-only fields. Most sensitive data in the system: never on rosters.
  player_email         text,
  player_height_in     integer,
  player_weight_lb     integer,
  clothing_size        text,
  ship_line1           text,
  ship_line2           text,
  ship_city            text,
  ship_state           text,
  ship_postal_code     text,
  extra                jsonb not null default '{}',
  waiver_status        text not null default 'not_collected' check (waiver_status in ('accepted', 'not_collected')),
  waiver_id            uuid references public.waivers (id),
  waiver_accepted_at   timestamptz,
  waiver_accepted_name text,
  created_at           timestamptz not null default now(),
  unique (intent_id, line_no),
  check ((session_id is null) <> (miami_group is null))
);

create index registrations_camp_idx on public.registrations (camp_id);
create index registrations_session_idx on public.registrations (session_id);
create index registrations_group_idx on public.registrations (miami_group) where miami_group is not null;
create index registrations_town_idx on public.registrations (lower(parent_town));
create index registrations_email_idx on public.registrations (parent_email);
create index registrations_payment_idx on public.registrations (payment_id);

create table public.waitlist_entries (
  id               uuid primary key default gen_random_uuid(),
  camp_id          uuid not null references public.camps (id),
  session_id       uuid references public.sessions (id),
  miami_group      text references public.miami_groups (grp),
  parent_name      text not null,
  email            text not null,
  phone            text not null,
  town             text not null,
  spots            integer not null default 1 check (spots between 1 and 10),
  status           text not null default 'waiting' check (status in ('waiting', 'notified', 'converted', 'lapsed', 'removed')),
  notified_at      timestamptz,
  offer_expires_at timestamptz,
  created_at       timestamptz not null default now(),
  check ((session_id is null) <> (miami_group is null))
);

create index waitlist_order_idx on public.waitlist_entries (session_id, miami_group, created_at);

create table public.private_training_requests (
  id              uuid primary key default gen_random_uuid(),
  parent_name     text not null,
  email           text not null,
  phone           text not null,
  town            text not null,
  player_name     text not null,
  player_age      integer not null,
  message         text,
  preferred_times text,
  extra           jsonb not null default '{}',
  status          text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at      timestamptz not null default now()
);

create table public.contacts (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null unique check (email = lower(btrim(email))),
  name               text,
  phone              text,
  town               text,
  sources            text[] not null default '{}',
  consent            text not null default 'unknown' check (consent in ('unknown', 'granted', 'denied')),
  unsubscribed       boolean not null default false,
  unsubscribed_at    timestamptz,
  provider_id        text,
  provider_synced_at timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index contacts_town_idx on public.contacts (lower(town));

create table public.email_log (
  id                  uuid primary key default gen_random_uuid(),
  kind                text not null check (kind in ('campaign', 'confirmation', 'reminder', 'waitlist', 'notification')),
  sent_by             uuid,
  segment             jsonb,
  template            text,
  subject             text,
  recipient_count     integer not null default 0,
  excluded            jsonb,
  registration_id     uuid references public.registrations (id),
  provider_message_id text,
  created_at          timestamptz not null default now()
);

-- Reminder idempotency for Stage 3: one row per (registration, reminder offset).
create unique index email_log_reminder_once on public.email_log (registration_id, template)
  where kind in ('confirmation', 'reminder');

-- ---------------------------------------------------------------------------
-- Infrastructure
-- ---------------------------------------------------------------------------

create table public.stripe_events (
  id          text primary key,
  type        text not null,
  received_at timestamptz not null default now()
);

create table public.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (key, window_start)
);

create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Guards
-- ---------------------------------------------------------------------------

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger camps_touch before update on public.camps for each row execute function public.touch_updated_at();
create trigger sessions_touch before update on public.sessions for each row execute function public.touch_updated_at();
create trigger miami_event_touch before update on public.miami_event for each row execute function public.touch_updated_at();
create trigger miami_groups_touch before update on public.miami_groups for each row execute function public.touch_updated_at();
create trigger payments_touch before update on public.payments for each row execute function public.touch_updated_at();
create trigger contacts_touch before update on public.contacts for each row execute function public.touch_updated_at();

create function public.waivers_immutable() returns trigger
language plpgsql as $$
begin
  if new.body is distinct from old.body
     or new.title is distinct from old.title
     or new.version is distinct from old.version
     or new.flow is distinct from old.flow then
    raise exception 'waiver text is immutable; insert a new version instead';
  end if;
  return new;
end;
$$;

create trigger waivers_no_edit before update on public.waivers for each row execute function public.waivers_immutable();
