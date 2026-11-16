-- Supabase SQL Editor: run the complete file. No character data is changed.
-- 관리자 로그인 제한: 5회까지 시도 가능, 5번째 시도 이후 5분 동안 잠금.
-- 각 시도마다 5분 창이 새로 시작되며, 잠긴 동안의 추가 시도는 잠금 시간을 늘리지 않는다. 로그인 성공 시 기록은 지워진다.
begin;
create or replace function public.archive_admin_login_attempt(p_key text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  result public.archive_admin_login_attempts%rowtype;
  current_time_value timestamptz := clock_timestamp();
begin
  delete from public.archive_admin_sessions where expires_at <= current_time_value;
  delete from public.archive_admin_login_attempts where expires_at <= current_time_value;
  insert into public.archive_admin_login_attempts(key_hash, attempts, expires_at)
    values (p_key, 1, current_time_value + interval '5 minutes')
  on conflict (key_hash) do update set
    attempts = public.archive_admin_login_attempts.attempts + 1,
    expires_at = case when public.archive_admin_login_attempts.attempts + 1 <= 5
      then current_time_value + interval '5 minutes'
      else public.archive_admin_login_attempts.expires_at end
  returning * into result;
  return jsonb_build_object('allowed', result.attempts <= 5, 'retryAfter', greatest(1, ceil(extract(epoch from result.expires_at - current_time_value))));
end;
$$;
revoke all on function public.archive_admin_login_attempt(text) from public, anon, authenticated;
grant execute on function public.archive_admin_login_attempt(text) to service_role;
commit;
