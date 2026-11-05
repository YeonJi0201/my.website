import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from 'vite';
import { INITIAL_CHARACTERS } from '../src/data/initialCharacters.ts';
import { validCharacter } from '../server/api.ts';
import { createSupabaseStore } from '../server/supabase-store.ts';

// Explicit migration only; connecting an empty database does not auto-seed it.
const root = process.cwd();
const env = { ...loadEnv('production', root, ''), ...process.env };
const args = process.argv.slice(2);
const allowed = new Set(['--seed', '--apply']);
if (args.some(arg => !allowed.has(arg))) throw new Error('사용법: npm run db:migrate -- [--seed] [--apply]');
const seed = args.includes('--seed');
let records: unknown;
if (seed) records = structuredClone(INITIAL_CHARACTERS);
else {
  try { records = JSON.parse(await readFile(path.resolve(root, env.ARCHIVE_DATA_DIR || 'data', 'characters.json'), 'utf8')); }
  catch { throw new Error('기존 data/characters.json을 읽지 못했습니다. 예시 인물을 옮기려면 --seed를 사용하세요.'); }
}
if (!Array.isArray(records) || !records.every(validCharacter) || new Set(records.map(c => c.id)).size !== records.length) {
  throw new Error('캐릭터 데이터 형식이나 중복 ID를 확인해주세요.');
}
console.log(`이전 대상: ${records.length}개 (${seed ? '예시 캐릭터' : '기존 로컬 기록'}). 원본 파일은 유지됩니다.`);
if (!args.includes('--apply')) {
  console.log('검증만 완료했습니다. Supabase에 반영하려면 --apply를 추가하세요. 같은 ID의 기록은 갱신됩니다.');
} else {
  const url = env.SUPABASE_URL, key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL과 SUPABASE_SECRET_KEY를 설정해주세요.');
  const store = createSupabaseStore({ url, key });
  await store.import(records);
  console.log('Supabase로 기록을 이전했습니다.');
}
