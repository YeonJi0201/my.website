-- Run once in the project's Supabase SQL Editor, or apply with Supabase migrations.
begin;

create table if not exists public.characters (
  id text primary key check (id ~ '^[a-zA-Z0-9_-]{1,120}$'),
  profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint character_profile_object check (jsonb_typeof(profile) = 'object'),
  constraint character_profile_id check (profile ? 'id' and profile->>'id' = id),
  constraint character_profile_name check (length(btrim(profile->>'nameKo')) > 0)
);

alter table public.characters enable row level security;
-- The browser uses the existing Express API, never the Supabase Data API directly.
-- No anon/authenticated policies: even a signed-in Supabase user cannot write.
revoke all on table public.characters from public, anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.characters to service_role;

create or replace function public.archive_touch_character()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.archive_touch_character() from public, anon, authenticated;
drop trigger if exists archive_character_updated on public.characters;
create trigger archive_character_updated before update on public.characters
for each row execute function public.archive_touch_character();

create index if not exists characters_created_at_idx on public.characters (created_at desc, id asc);
commit;
