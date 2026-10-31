-- Graduation years offered on the Miami form (edited in Settings → Miami).
alter table public.miami_event add column grad_years text[] not null default '{}';
