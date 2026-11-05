import { loadEnv } from 'vite';
import { createSupabaseStore } from '../server/supabase-store.ts';
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const url = env.SUPABASE_URL, key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Supabase URL과 서버용 키를 설정해주세요.');
const store = createSupabaseStore({ url, key });
const records = (await store.list()).filter(c => c.image.startsWith('data:'));
console.log(`이전 대상: DB에 이미지가 포함된 캐릭터 ${records.length}개.`);
if (process.argv.includes('--apply')) {
  let count = 0;
  for (const record of records) { await store.update(record); console.log(`이미지 이전 완료: ${++count}/${records.length}`); }
  console.log('원본과 화면용 이미지를 Storage에 저장하고 DB를 이미지 주소로 갱신했습니다.');
} else console.log('검증만 수행했습니다. 이전하려면 --apply를 추가하세요.');
