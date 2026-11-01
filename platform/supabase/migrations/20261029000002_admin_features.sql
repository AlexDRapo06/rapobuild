-- Stage 2/3 data the dashboard needs: per-registration prices (revenue by
-- camp/session, D12), promo codes and sibling discounts on payments (D10),
-- waitlist offers that hold a spot (D9), and registration cancellations.

alter table public.registrations
  add column price_cents      integer,
  add column discount_cents   integer not null default 0,
  add column cancelled_at     timestamptz,
  add column cancel_reason    text;

alter table public.payments
  add column promo_code_id          uuid references public.promo_codes (id),
  add column sibling_discount_cents integer not null default 0,
  add column promo_discount_cents   integer not null default 0;

create index payments_promo_idx on public.payments (promo_code_id) where promo_code_id is not null;

alter table public.promo_codes add column description text;

-- A waitlist offer holds its spot like a checkout does, without a checkout intent.
alter table public.waitlist_entries
  add column offer_token  text unique,
  add column converted_at timestamptz;

alter table public.holds
  alter column intent_id drop not null,
  add column waitlist_entry_id uuid references public.waitlist_entries (id) on delete cascade,
  add constraint holds_owner check (intent_id is not null or waitlist_entry_id is not null);

create index holds_waitlist_idx on public.holds (waitlist_entry_id) where waitlist_entry_id is not null;

grant delete on public.promo_codes to authenticated;
