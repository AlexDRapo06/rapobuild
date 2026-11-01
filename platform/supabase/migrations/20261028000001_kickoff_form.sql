-- Changes from the client's Kickoff Information Form (Oct 18, 2026):
-- * Boys and girls attend on different dates, so schedules live on each group.
-- * Registration opens to everyone at a set time and closes on a set date. The
--   access code becomes an optional key to reserved host-school spots once the
--   public phase starts, instead of only a gate.
-- * Reserved spots are a single pool across both groups ("200 out of all").
-- * New Miami fields: split names, emergency phone, position, club, shirt and short sizes.

alter table public.miami_event
  add column public_opens_at timestamptz,
  add column closes_at       timestamptz,
  add column reserved_total  integer not null default 0 check (reserved_total >= 0),
  add column reserved_until  timestamptz,
  add column positions       text[] not null default '{}',
  add column short_sizes     text[] not null default '{}';

alter table public.miami_event rename column clothing_sizes to shirt_sizes;

alter table public.miami_groups
  add column starts_on        date,
  add column ends_on          date,
  add column daily_start_time time,
  add column daily_end_time   time;

alter table public.registrations rename column clothing_size to shirt_size;

alter table public.registrations
  add column parent_first_name text,
  add column parent_last_name  text,
  add column emergency_phone   text,
  add column player_first_name text,
  add column player_last_name  text,
  add column player_position   text,
  add column player_club       text,
  add column short_size        text;

-- True while any access code is switched on and not past its end date.
create function public.miami_codes_active() returns boolean
language sql stable as $$
  select exists (
    select 1 from public.access_codes
     where active and (ends_at is null or ends_at > now())
  )
$$;

-- True while a code is required to check out: codes are active and the public
-- phase hasn't started (or no public opening time is set).
create or replace function public.miami_gate_active() returns boolean
language sql stable as $$
  select public.miami_codes_active()
     and not exists (
       select 1 from public.miami_event
        where public_opens_at is not null and public_opens_at <= now()
     )
$$;

-- Spots left per group, for code holders and for the public.
-- Reserved spots (per group and/or one shared pool) apply while any code is
-- active and before their reserved_until time. The public can never dip into a
-- reservation; code holders past the reservation draw from the general pool.
create or replace function public.miami_availability()
returns table (
  grp                     text,
  label                   text,
  cap                     integer,
  open                    boolean,
  code_taken              integer,
  public_taken            integer,
  reserved_effective      integer,
  left_for_code_holders   integer,
  left_for_public         integer,
  price_code_holder_cents integer,
  price_public_cents      integer
)
language sql stable as $$
  with codes as (select public.miami_codes_active() as active),
  shared as (
    select coalesce((
      select case when codes.active and (e.reserved_until is null or e.reserved_until > now())
                  then e.reserved_total else 0 end
        from public.miami_event e cross join codes
    ), 0) as reserved
  ),
  usage as (
    select g.grp, g.label, g.cap, g.open, g.price_code_holder_cents, g.price_public_cents,
           u.code_taken, u.public_taken,
           case when codes.active and (g.reserved_until is null or g.reserved_until > now())
                then g.reserved_for_code_holders else 0 end as reserved
      from public.miami_groups g
     cross join codes
     cross join lateral public.miami_group_usage(g.grp) u
  ),
  totals as (
    select coalesce(sum(cap), 0)::int as cap,
           coalesce(sum(code_taken), 0)::int as code_taken,
           coalesce(sum(public_taken), 0)::int as public_taken
      from usage
  )
  select
    u.grp,
    u.label,
    u.cap,
    u.open,
    u.code_taken,
    u.public_taken,
    u.reserved,
    greatest(u.cap - u.code_taken - u.public_taken, 0),
    greatest(least(
      u.cap - greatest(u.reserved, u.code_taken) - u.public_taken,
      t.cap - greatest(s.reserved, t.code_taken) - t.public_taken
    ), 0),
    u.price_code_holder_cents,
    u.price_public_cents
  from usage u cross join totals t cross join shared s
  order by u.grp
$$;

-- Same contract as before, but locks both group rows: the shared reserved pool
-- means a boys checkout and a girls checkout can compete for the same spots.
create or replace function public.reserve_miami(
  p_intent     uuid,
  p_counts     jsonb,
  p_via_code   boolean,
  p_expires_at timestamptz
) returns void
language plpgsql as $$
declare
  rec        record;
  avail      record;
  spots_left integer;
begin
  perform 1 from public.miami_groups order by grp for update;

  for rec in
    select key as grp, value::int as qty from jsonb_each_text(p_counts) order by key
  loop
    select * into avail from public.miami_availability() a where a.grp = rec.grp;
    if not found then
      raise exception 'unknown_group:%', rec.grp;
    end if;
    if not avail.open then
      raise exception 'group_closed:%', rec.grp;
    end if;

    spots_left := case when p_via_code then avail.left_for_code_holders else avail.left_for_public end;
    if spots_left < rec.qty then
      raise exception 'group_full:%', rec.grp;
    end if;

    insert into public.holds (intent_id, miami_group, quantity, via_access_code, expires_at)
    values (p_intent, rec.grp, rec.qty, p_via_code, p_expires_at);
  end loop;
end;
$$;

revoke execute on function public.miami_codes_active() from public, anon;
