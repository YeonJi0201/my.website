import { loadEnv } from 'vite';
import { randomUUID, scryptSync } from 'node:crypto';
import { once } from 'node:events';
import sharp from 'sharp';
import { createApi } from '../server/api.ts';
import { createSupabaseStore } from '../server/supabase-store.ts';
import { supabaseAdminAuth } from '../server/admin-auth.ts';
import { createImageStorage, IMAGE_BUCKET } from '../server/image-storage.ts';
import { INITIAL_CHARACTERS } from '../src/data/initialCharacters.ts';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const url = env.SUPABASE_URL, key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Supabase 설정 누락');
const store = createSupabaseStore({ url, key });
const id = `hosted-check-${randomUUID()}`;
const password = randomUUID(); // Ephemeral test credential; never written or printed.
const hash = `test-salt:${scryptSync(password, 'test-salt', 64).toString('hex')}`;
const servers = [1, 2].map(() => createApi({ username: 'verification-only', passwordHash: hash, dataDirectory: 'unused', store,
  auth: supabaseAdminAuth({ url, key }), images: createImageStorage({ url, key }), clientAddress: () => id,
}).listen(0, '127.0.0.1'));
await Promise.all(servers.map(server => once(server, 'listening')));
let cookie = '', signedPath = '', saved = false;
const paths: string[] = [];
const request = async (index: number, path: string, method = 'GET', body?: unknown) => {
  const base = `http://127.0.0.1:${(servers[index].address() as { port: number }).port}`;
  const response = await fetch(base + path, { method, headers: { Origin: base, Cookie: cookie, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(`API 확인 실패: HTTP ${response.status}, ${result.error || '응답 오류'}`);
  return { response, result };
};
try {
  const login = await request(0, '/api/admin/login', 'POST', { username: 'verification-only', password });
  cookie = (login.response.headers.get('set-cookie') || '').split(';')[0];
  if (!(await request(1, '/api/admin/session')).result.authenticated) throw new Error('서버 간 세션 공유 실패');
  console.log('실제 인증 DB: 로그인·다른 서버에서의 세션 확인 성공.');
  const png = await sharp({ create: { width: 24, height: 32, channels: 4, background: { r: 80, g: 90, b: 120, alpha: .5 } } }).png().toBuffer();
  const signed = (await request(1, '/api/admin/image-upload/sign', 'POST', { id, size: png.length, contentType: 'image/png' })).result;
  signedPath = signed.path;
  const uploaded = await fetch(signed.signedUrl, { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: new Uint8Array(png) });
  if (!uploaded.ok) throw new Error(`직접 업로드 실패: HTTP ${uploaded.status}`);
  const images = (await request(0, '/api/admin/image-upload/complete', 'POST', { id, path: signed.path })).result;
  const publicBase = new URL(`/storage/v1/object/public/${IMAGE_BUCKET}/`, url).href;
  for (const field of ['image', 'imageOriginal', 'imageThumbnail']) {
    const path = String(images[field]).slice(publicBase.length);
    if (!String(images[field]).startsWith(publicBase) || !path.startsWith(`${id}/`)) throw new Error('테스트 이미지 경로 불일치');
    paths.push(path);
  }
  const record = { ...INITIAL_CHARACTERS[0], id, nameKo: '배포 연결 확인용 임시 캐릭터', nameEn: 'Temporary deployment check', ...images };
  await request(1, '/api/admin/characters', 'POST', record); saved = true;
  const listed = (await request(0, '/api/characters')).result;
  if (!listed.some((item: { id: string }) => item.id === id)) throw new Error('공개 명부 조회 실패');
  await request(0, `/api/admin/characters/${id}`, 'PUT', { ...record, quote: 'Updated test record' });
  console.log('실제 DB·Storage: 서명 발급·PNG 직접 업로드·WebP 생성·캐릭터 등록·공개 조회·수정 성공.');
  await request(1, `/api/admin/characters/${id}`, 'DELETE', {}); saved = false;
  await request(1, '/api/admin/logout', 'POST', {});
  if ((await request(0, '/api/admin/session')).result.authenticated) throw new Error('로그아웃 취소 실패');
  console.log('캐릭터 삭제·다른 서버에서의 로그아웃 확인 성공.');
} finally {
  if (saved) await store.remove(id);
  if (cookie) await supabaseAdminAuth({ url, key }).revoke(cookie.split('=')[1]);
  if (signedPath) paths.push(signedPath);
  if (paths.length) {
    if (!paths.every(path => path.startsWith(`${id}/`) || path.startsWith(`uploads/${id}/`))) throw new Error('테스트 정리 경로 확인 실패');
    const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' };
    if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;
    const response = await fetch(new URL(`/storage/v1/object/${IMAGE_BUCKET}`, url), { method: 'DELETE', headers, body: JSON.stringify({ prefixes: paths }) });
    if (!response.ok) throw new Error('테스트 파일 정리 실패');
  }
  await Promise.all(servers.map(server => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))));
  console.log('이번 검사에서 만든 임시 캐릭터·세션·이미지를 정리했습니다.');
}
