-- Automatic emails that never left the server (no Brevo key, or the test-recipient guard outside production).
alter table public.email_log drop constraint if exists email_log_status_check;
alter table public.email_log add constraint email_log_status_check check (status in ('sending', 'sent', 'failed', 'test', 'skipped'));
