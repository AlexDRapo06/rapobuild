-- Capacity, holds, rate limiting and contact helpers. Every capacity check runs
-- inside the database under a row lock so two buyers can never take the same
-- last spot.

create function public.app_today() returns date
language sql stable as $$
  select (now() at time zone coalesce(
    (select value #>> '{}' from public.settings where key = 'timezone'),
    'America/New_York'))::date
$$;

create function public.session_price_cents(s public.sessions) returns integer
language sql stable as $$
  select case
    when s.early_bird_price_cents is not null
     and s.early_bird_until is not null
     and public.app_today() <= s.early_bird_until
    then s.early_bird_price_cents
    else s.price_cents
  end
$$;

-- Paid (not fully refunded, not cancelled) registrations plus unexpired holds.
create function public.session_taken(p_session uuid) returns integer
language sql stable as $$
  select
    (select count(*)
       from public.registrations r
       join public.payments p on p.id = r.payment_id
      where r.session_id = p_session
        and r.status = 'active'
        and p.status <> 'refunded')::int
    +
    coalesce((select sum(h.quantity)
       from public.holds h
      where h.session_id = p_session
        and h.status = 'active'
        and h.expires_at > now()), 0)::int
$$;

create function public.miami_gate_active() returns boolean
language sql stable as $$
  select exists (
    select 1 from public.access_codes
     where active and (ends_at is null or ends_at > now())
  )
$$;

create function public.miami_group_usage(p_grp text, out code_taken integer, out public_taken integer)
language sql stable as $$
  with paid as (
    select r.via_access_code
      from public.registrations r
      join public.payments p on p.id = r.payment_id
     where r.miami_group = p_grp
       and r.status = 'active'
       and p.status <> 'refunded'
  ),
  held as (
    select h.via_access_code, h.quantity
      from public.holds h
     where h.miami_group = p_grp
       and h.status = 'active'
       and h.expires_at > now()
  )
  select
    ((select count(*) from paid where via_access_code)
      + coalesce((select sum(quantity) from held where via_access_code), 0))::int,
    ((select count(*) from paid where not via_access_code)
      + coalesce((select sum(quantity) from held where not via_access_code), 0))::int
$$;

-- Spots left per group, for code holders and for the public.
-- Reserved spots only apply while the access-code gate is active (and before
-- reserved_until, if set). Code holders who exceed the reserved allotment draw
-- from the general pool; the public can never dip into the reserved allotment.
create function public.miami_availability()
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
  with gate as (select public.miami_gate_active() as active)
  select
    g.grp,
    g.label,
    g.cap,
    g.open,
    u.code_taken,
    u.public_taken,
    re.reserved,
    greatest(g.cap - u.code_taken - u.public_taken, 0),
    greatest(g.cap - greatest(re.reserved, u.code_taken) - u.public_taken, 0),
    g.price_code_holder_cents,
    g.price_public_cents
  from public.miami_groups g
  cross join gate
  cross join lateral public.miami_group_usage(g.grp) u
  cross join lateral (
    select case
      when gate.active and (g.reserved_until is null or g.reserved_until > now())
      then g.reserved_for_code_holders
      else 0
    end as reserved
  ) re
  order by g.grp
$$;

-- p_counts: {"boys": 1, "girls": 2}
-- Raises 'group_full:<grp>', 'group_closed:<grp>' or 'unknown_group:<grp>'.
create function public.reserve_miami(
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
  -- Lock in a fixed order so concurrent checkouts queue instead of deadlocking.
  perform 1
     from public.miami_groups
    where grp in (select jsonb_object_keys(p_counts))
    order by grp
      for update;

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

-- p_counts: {"<session uuid>": 2}. Sessions without a capacity are skipped.
-- Raises 'session_full:<id>'.
create function public.reserve_sessions(
  p_intent     uuid,
  p_counts     jsonb,
  p_expires_at timestamptz
) returns void
language plpgsql as $$
declare
  rec       record;
  session_cap integer;
begin
  perform 1
     from public.sessions
    where id in (select key::uuid from jsonb_each_text(p_counts))
      and capacity is not null
    order by id
      for update;

  for rec in
    select key::uuid as sid, value::int as qty from jsonb_each_text(p_counts) order by key
  loop
    select capacity into session_cap from public.sessions where id = rec.sid;
    if session_cap is null then
      continue;
    end if;
    if public.session_taken(rec.sid) + rec.qty > session_cap then
      raise exception 'session_full:%', rec.sid;
    end if;

    insert into public.holds (intent_id, session_id, quantity, expires_at)
    values (p_intent, rec.sid, rec.qty, p_expires_at);
  end loop;
end;
$$;

-- Fixed-window counter. Returns true while the caller is under the limit.
create function public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql as $$
declare
  win  timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  hits integer;
begin
  insert into public.rate_limits (key, window_start, hits)
  values (p_key, win, 1)
  on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
  returning public.rate_limits.hits into hits;
  return hits <= p_limit;
end;
$$;

-- Latest non-null details win. Consent only ever upgrades unknown -> granted
-- here; downgrades come from unsubscribes, never from a new form submission.
create function public.upsert_contact(
  p_email   text,
  p_name    text,
  p_phone   text,
  p_town    text,
  p_source  text,
  p_consent text default null
) returns uuid
language sql as $$
  insert into public.contacts as c (email, name, phone, town, sources, consent)
  values (lower(btrim(p_email)), p_name, p_phone, p_town, array[p_source], coalesce(p_consent, 'unknown'))
  on conflict (email) do update set
    name    = coalesce(excluded.name, c.name),
    phone   = coalesce(excluded.phone, c.phone),
    town    = coalesce(excluded.town, c.town),
    sources = case when p_source = any(c.sources) then c.sources else c.sources || p_source end,
    consent = case when p_consent = 'granted' and c.consent = 'unknown' then 'granted' else c.consent end
  returning id
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;
