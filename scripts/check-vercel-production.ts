import { readFile } from 'node:fs/promises';
import { randomUUID, randomBytes } from 'node:crypto';
import { loadEnv } from 'vite';
import sharp from 'sharp';
import { INITIAL_CHARACTERS } from '../src/data/initialCharacters.ts';
import { IMAGE_BUCKET } from '../server/image-storage.ts';

const base = 'https://my-website-seven-eta-82.vercel.app';
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const storageUrl = env.SUPABASE_URL, storageKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!storageUrl || !storageKey) throw new Error('로컬 Supabase 연결 설정 누락');
const local = await readFile('.admin-access.local.txt', 'utf8');
const username = local.match(/^아이디:\s*(.+)$/m)?.[1].trim();
const password = local.match(/^비밀번호:\s*(.+)$/m)?.[1].trim();
if (!username || !password) throw new Error('로컬 관리자 접속 정보 파일 형식을 확인해주세요.');
let cookie = '', saved = false, signedPath = '';
const paths: string[] = [];
const id = `production-check-${randomUUID()}`;
const request = async (route: string, method = 'GET', body?: unknown) => {
  const response = await fetch(base + route, { method, redirect: 'error', signal: AbortSignal.timeout(90_000),
    headers: { Origin: base, Cookie: cookie, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error(`API가 JSON을 반환하지 않습니다: HTTP ${response.status}`);
  const result = await response.json();
  if (!response.ok) throw new Error(`운영 API 오류: HTTP ${response.status}; ${result.error || '응답 오류'}`);
  return { response, result };
};
try {
  const login = await request('/api/admin/login', 'POST', { username, password });
  cookie = (login.response.headers.get('set-cookie') || '').split(';')[0];
  if (!cookie || !(await request('/api/admin/session')).result.authenticated) throw new Error('운영 로그인 세션 확인 실패');
  console.log('운영 Vercel: 관리자 로그인과 세션 확인 성공.');
  const width = 1600, height = 1000;
  const png = await sharp(randomBytes(width * height * 4), { raw: { width, height, channels: 4 } }).png().toBuffer();
  if (png.length <= 4.5 * 1024 * 1024) throw new Error('대용량 테스트 PNG 크기 부족');
  const signed = (await request('/api/admin/image-upload/sign', 'POST', { id, size: png.length, contentType: 'image/png' })).result;
  if (new URL(signed.signedUrl).origin !== new URL(storageUrl).origin) throw new Error('예상하지 못한 업로드 서버');
  signedPath = signed.path;
  const uploaded = await fetch(signed.signedUrl, { method: 'PUT', redirect: 'error', headers: { 'Content-Type': 'image/png' }, body: new Uint8Array(png), signal: AbortSignal.timeout(90_000) });
  if (!uploaded.ok) throw new Error(`직접 업로드 실패: HTTP ${uploaded.status}`);
  const images = (await request('/api/admin/image-upload/complete', 'POST', { id, path: signed.path })).result;
  const publicBase = new URL(`/storage/v1/object/public/${IMAGE_BUCKET}/`, storageUrl).href;
  for (const field of ['image', 'imageOriginal', 'imageThumbnail']) {
    const value = String(images[field]);
    if (!value.startsWith(publicBase) || !value.slice(publicBase.length).startsWith(`${id}/`)) throw new Error('테스트 이미지 주소 불일치');
    paths.push(value.slice(publicBase.length));
  }
  console.log(`운영 Vercel: ${(png.length / 1024 / 1024).toFixed(1)}MB PNG 직접 업로드·원본 보존·WebP 생성 성공.`);
  const record = { ...INITIAL_CHARACTERS[0], id, nameKo: '운영 배포 확인용 임시 캐릭터', nameEn: 'Temporary production verification', ...images };
  await request('/api/admin/characters', 'POST', record); saved = true;
  if (!(await request('/api/characters')).result.some((item: { id: string }) => item.id === id)) throw new Error('운영 공개 명부에 등록되지 않았습니다.');
  await request(`/api/admin/characters/${id}`, 'PUT', { ...record, quote: 'Production update verified' });
  await request(`/api/admin/characters/${id}`, 'DELETE', {}); saved = false;
  console.log('운영 Vercel: 캐릭터 등록·공개 조회·수정·삭제 성공.');
  await request('/api/admin/logout', 'POST', {});
  if ((await request('/api/admin/session')).result.authenticated) throw new Error('운영 로그아웃 실패');
  cookie = '';
  console.log('운영 Vercel: 로그아웃 확인 성공.');
} finally {
  if (saved) await request(`/api/admin/characters/${id}`, 'DELETE', {});
  if (cookie) await request('/api/admin/logout', 'POST', {});
  if (signedPath) paths.push(signedPath);
  if (paths.length) {
    if (!paths.every(path => path.startsWith(`${id}/`) || path.startsWith(`uploads/${id}/`))) throw new Error('테스트 정리 경로 오류');
    const headers: Record<string, string> = { apikey: storageKey, 'Content-Type': 'application/json' };
    if (!storageKey.startsWith('sb_secret_')) headers.Authorization = `Bearer ${storageKey}`;
    const result = await fetch(new URL(`/storage/v1/object/${IMAGE_BUCKET}`, storageUrl), { method: 'DELETE', headers, body: JSON.stringify({ prefixes: paths }), signal: AbortSignal.timeout(30_000) });
    if (!result.ok) throw new Error('이번 검사의 임시 이미지 정리 실패');
  }
  console.log('이번 검사의 임시 캐릭터·세션·이미지 정리 완료. 기존 캐릭터는 변경하지 않았습니다.');
}
