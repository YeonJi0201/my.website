-- Supabase SQL Editor: run the complete file. No character data is changed.
begin;
create table if not exists public.archive_admin_sessions (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null
);
create index if not exists archive_admin_sessions_expiry on public.archive_admin_sessions(expires_at);
create table if not exists public.archive_admin_login_attempts (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  attempts integer not null check (attempts > 0),
  expires_at timestamptz not null
);
alter table public.archive_admin_sessions enable row level security;
alter table public.archive_admin_login_attempts enable row level security;
revoke all on public.archive_admin_sessions, public.archive_admin_login_attempts from public, anon, authenticated;
grant select, insert, delete on public.archive_admin_sessions to service_role;
grant select, insert, update, delete on public.archive_admin_login_attempts to service_role;

create or replace function public.archive_admin_login_attempt(p_key text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  result public.archive_admin_login_attempts%rowtype;
  current_time_value timestamptz := clock_timestamp();
begin
  delete from public.archive_admin_sessions where expires_at <= current_time_value;
  delete from public.archive_admin_login_attempts where expires_at <= current_time_value;
  insert into public.archive_admin_login_attempts(key_hash, attempts, expires_at)
    values (p_key, 1, current_time_value + interval '15 minutes')
  on conflict (key_hash) do update set
    attempts = case when public.archive_admin_login_attempts.expires_at <= current_time_value then 1 else public.archive_admin_login_attempts.attempts + 1 end,
    expires_at = case when public.archive_admin_login_attempts.expires_at <= current_time_value then current_time_value + interval '15 minutes' else public.archive_admin_login_attempts.expires_at end
  returning * into result;
  return jsonb_build_object('allowed', result.attempts <= 5, 'retryAfter', greatest(1, ceil(extract(epoch from result.expires_at - current_time_value))));
end;
$$;
revoke all on function public.archive_admin_login_attempt(text) from public, anon, authenticated;
grant execute on function public.archive_admin_login_attempt(text) to service_role;
commit;
