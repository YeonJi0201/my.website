import type { IncomingMessage, ServerResponse } from 'node:http';
import { createSupabaseStore } from '../server/supabase-store.ts';

/** Vercel's static Vite deployment does not run the development API middleware. */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const send = (status: number, value: unknown) => {
    res.statusCode = status;
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify(value));
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    send(405, { error: '학생 명부는 조회만 가능합니다.' });
    return;
  }
  const url = process.env.SUPABASE_URL?.trim();
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (!url || !key) {
    send(503, { error: '배포 서버의 Supabase 연결 설정이 없습니다. Vercel 환경 변수에 SUPABASE_URL과 SUPABASE_SECRET_KEY를 추가하고 재배포해주세요.' });
    return;
  }
  try {
    send(200, await createSupabaseStore({ url, key }).list());
  } catch (error) {
    const known = error as Error & { expose?: boolean };
    send(503, { error: known.expose ? known.message : '배포 서버의 Supabase 연결 설정을 확인해주세요.' });
  }
}
