-- Email: contact import (D6), segmented campaigns (D7), automatic parent
-- emails (D8), and two-way unsubscribe/bounce sync with Brevo.

alter table public.contacts
  add column bounced            boolean not null default false,
  add column consent_updated_at timestamptz,
  add column last_import_id     uuid;

create table public.contact_imports (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  created_by_email text,
  filename         text,
  consent          text not null check (consent in ('unknown', 'granted')),
  found            integer not null default 0,
  imported         integer not null default 0,
  merged           integer not null default 0,
  duplicates       integer not null default 0,
  rejected_count   integer not null default 0,
  rejected         jsonb not null default '[]'
);

alter table public.contacts
  add constraint contacts_last_import_fk foreign key (last_import_id) references public.contact_imports (id) on delete set null;

alter table public.email_log
  add column status               text not null default 'sent' check (status in ('sending', 'sent', 'failed', 'test')),
  add column sent_by_email        text,
  add column body                 text,
  add column provider_campaign_id text,
  add column error                text,
  add column request_id           uuid unique,
  add column payment_id           uuid references public.payments (id),
  add column recipient_email      text;

create index email_log_campaigns_idx on public.email_log (created_at desc) where kind = 'campaign';

alter table public.contact_imports enable row level security;
revoke all on public.contact_imports from anon, authenticated;
grant select on public.contact_imports to authenticated;
create policy admin_read on public.contact_imports for select to authenticated using (public.is_admin());
