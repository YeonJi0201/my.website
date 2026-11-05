import { loadEnv } from 'vite';
import { createImageStorage } from '../server/image-storage.ts';
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const url = env.SUPABASE_URL, key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Supabase URL과 서버용 키를 설정해주세요.');
await createImageStorage({ url, key }).ensureBucket();
console.log('character-images 공개 이미지 버킷 준비 완료. 업로드는 서버 관리자 API를 통해서만 처리합니다.');
