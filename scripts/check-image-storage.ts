import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { loadEnv } from 'vite';
import { createImageStorage, IMAGE_BUCKET } from '../server/image-storage.ts';
import { INITIAL_CHARACTERS } from '../src/data/initialCharacters.ts';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const url = env.SUPABASE_URL, key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Supabase URL과 서버용 키를 설정해주세요.');
const id = `storage-check-${randomUUID()}`;
const original = await sharp({ create: { width: 16, height: 24, channels: 4, background: { r: 30, g: 60, b: 90, alpha: .5 } } }).png().toBuffer();
let paths: string[] = [];
try {
  const record = await createImageStorage({ url, key }).prepare({ ...INITIAL_CHARACTERS[0], id, image: `data:image/png;base64,${original.toString('base64')}` });
  const base = new URL(`/storage/v1/object/public/${IMAGE_BUCKET}/`, url).href;
  const urls = [record.imageOriginal!, record.image, record.imageThumbnail!];
  paths = urls.map(item => {
    if (!item.startsWith(base)) throw new Error('Unexpected test object URL');
    const path = item.slice(base.length);
    if (!path.startsWith(`${id}/`) || path.includes('..')) throw new Error('Unexpected test object path');
    return path;
  });
  for (let i = 0; i < urls.length; i++) {
    const response = await fetch(urls[i], { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`공개 이미지 조회 실패: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (i === 0 && !bytes.equals(original)) throw new Error('원본 파일이 일치하지 않습니다.');
    const metadata = await sharp(bytes).metadata();
    if (!metadata.hasAlpha || metadata.format !== (i === 0 ? 'png' : 'webp')) throw new Error('이미지 형식 또는 투명도 검증 실패');
  }
  console.log('실제 Storage 업로드·공개 조회·원본 일치·WebP 투명도 검증 성공. 캐릭터 DB는 변경하지 않았습니다.');
} finally {
  if (paths.length) {
    const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' };
    if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;
    const response = await fetch(new URL(`/storage/v1/object/${IMAGE_BUCKET}`, url), {
      method: 'DELETE', headers, body: JSON.stringify({ prefixes: paths }), signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error('검증은 끝났지만 임시 테스트 이미지 정리에 실패했습니다.');
    console.log('이번 검사에서 만든 임시 이미지 3개만 삭제했습니다.');
  }
}
