import { loadEnv } from 'vite';
import { createSupabaseStore } from '../server/supabase-store.ts';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const url = env.SUPABASE_URL, key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('SUPABASE_URL과 SUPABASE_SECRET_KEY를 .env.local에 설정해주세요.');
const records = await createSupabaseStore({ url, key }).list();
console.log(`Supabase 연결 성공: 캐릭터 ${records.length}개. 데이터 변경은 수행하지 않았습니다.`);
