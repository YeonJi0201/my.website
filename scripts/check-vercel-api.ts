import { loadEnv } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import handler from '../api/characters.ts';
const env = loadEnv('production', process.cwd(), '');
for (const name of ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (process.env[name] === undefined && env[name]) process.env[name] = env[name];
}
let body = '';
const res = { statusCode: 0, setHeader: () => {}, end: (value: string) => { body = value; } };
await handler({ method: 'GET' } as IncomingMessage, res as unknown as ServerResponse);
const data = JSON.parse(body);
if (res.statusCode !== 200 || !Array.isArray(data)) throw new Error(`조회 실패: HTTP ${res.statusCode}; ${data.error || '응답 오류'}`);
console.log(`Vercel 학생 조회 함수 로컬 실행 성공: HTTP 200, 캐릭터 ${data.length}개. DB 변경 없음.`);
