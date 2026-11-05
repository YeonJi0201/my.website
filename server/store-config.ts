import { createFileStore, type CharacterStore } from './character-store.ts';
import { createSupabaseStore } from './supabase-store.ts';

export function storeFromEnvironment(env: Record<string, string | undefined>, directory: string): CharacterStore {
  const url = env.SUPABASE_URL?.trim();
  const key = (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  const provider = env.ARCHIVE_STORAGE?.trim() || (url || key ? 'supabase' : 'file');
  if (provider === 'file') return createFileStore(directory);
  if (provider !== 'supabase') throw new Error('ARCHIVE_STORAGE은 file 또는 supabase여야 합니다.');
  if (!url || !key) throw new Error('Supabase 사용 시 SUPABASE_URL과 SUPABASE_SECRET_KEY가 필요합니다.');
  return createSupabaseStore({ url, key });
}
