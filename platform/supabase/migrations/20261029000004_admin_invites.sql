-- Who gave each admin dashboard access (admins can now add each other from Settings).
alter table public.admin_users add column invited_by text;
