import { createHash } from 'node:crypto';
import sharp from 'sharp';
import type { Character } from '../src/types/character.ts';
import { MAX_IMAGE_BYTES } from '../src/utils/image-limits.ts';
import { storeError } from './character-store.ts';

export const IMAGE_BUCKET = 'character-images';
type Options = { url: string; key: string; fetch?: typeof fetch };

export function createImageStorage(options: Options) {
  const base = new URL('/storage/v1/', options.url).href;
  const publicBase = `${base}object/public/${IMAGE_BUCKET}/`;
  const fetcher = options.fetch ?? fetch;
  const auth: Record<string, string> = { apikey: options.key };
  if (!options.key.startsWith('sb_secret_')) auth.Authorization = `Bearer ${options.key}`;
  let bucketReady: Promise<void> | undefined;

  const request = async (resource: string, init: RequestInit = {}) => {
    try {
      return await fetcher(`${base}${resource}`, { ...init, headers: { ...auth, ...init.headers }, signal: AbortSignal.timeout(120_000), redirect: 'error' });
    } catch { throw storeError(503, '이미지 저장소에 연결하지 못했습니다. 연결 상태를 확인하고 다시 저장해주세요.'); }
  };
  const fail = (status: number): never => {
    if (status === 401 || status === 403) throw storeError(503, 'Supabase Storage 권한이 없습니다. 서버용 Secret key를 확인해주세요.');
    if (status === 413) throw storeError(413, '이미지 저장소의 파일 크기 제한을 넘었습니다. Storage 버킷과 프로젝트 업로드 제한을 확인해주세요.');
    throw storeError(503, '이미지 저장에 실패했습니다. Supabase Storage 상태와 저장 용량을 확인해주세요.');
  };
  const ensureBucket = async () => {
    if (!bucketReady) bucketReady = (async () => {
      const found = await request(`bucket/${IMAGE_BUCKET}`);
      if (found.ok) {
        const bucket = await found.json();
        if (!bucket.public) throw storeError(503, 'character-images 버킷이 비공개입니다. 공개 프로필 이미지를 표시하려면 버킷을 Public으로 설정해주세요.');
        return;
      }
      if (found.status !== 404 && found.status !== 400) fail(found.status);
      const result = await request('bucket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        id: IMAGE_BUCKET, name: IMAGE_BUCKET, public: true, file_size_limit: MAX_IMAGE_BYTES,
        allowed_mime_types: ['image/png', 'image/jpeg', 'image/webp'],
      }) });
      if (!result.ok) {
        // Another request/server may have created the same bucket concurrently.
        const again = await request(`bucket/${IMAGE_BUCKET}`);
        if (!again.ok || !(await again.json()).public) fail(result.status);
      }
    })().catch(error => { bucketReady = undefined; throw error; });
    await bucketReady;
  };
  const upload = async (path: string, data: Buffer, contentType: string) => {
    const response = await request(`object/${IMAGE_BUCKET}/${path}`, {
      method: 'POST', headers: { 'Content-Type': contentType, 'Cache-Control': 'max-age=31536000', 'x-upsert': 'false' },
      body: new Uint8Array(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      // Paths include the SHA-256 of the exact source; an existing object is reusable.
      if (!(response.status === 409 || error.statusCode === '409' || error.error === 'Duplicate')) fail(response.status);
    }
    return `${publicBase}${path}`;
  };
  const validateUrls = (character: Character) => {
    for (const value of [character.image, character.imageOriginal, character.imageThumbnail]) {
      if (!value || !value.startsWith('https://')) continue;
      if (!value.startsWith(publicBase) || !/^[\w/-]+\.(png|jpg|webp)$/.test(value.slice(publicBase.length))) {
        throw storeError(400, '현재 프로젝트에 업로드한 캐릭터 이미지 주소만 사용할 수 있습니다. PNG 파일을 다시 선택해주세요.');
      }
    }
  };
  const prepare = async (character: Character): Promise<Character> => {
    if (!character.image.startsWith('data:')) { validateUrls(character); return character; }
    const match = character.image.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) throw storeError(400, '지원하지 않는 이미지입니다. PNG 파일을 선택해주세요.');
    const bytes = Buffer.from(match[2], 'base64');
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw storeError(413, '이미지는 20MB 이하로 업로드해주세요.');
    let profile: Buffer, thumbnail: Buffer;
    try {
      const image = sharp(bytes, { limitInputPixels: 64_000_000, failOn: 'error' });
      const metadata = await image.metadata();
      if (metadata.format !== match[1] || (metadata.pages ?? 1) > 1) throw new Error('Unsupported image');
      // Keep the full composition and alpha; cropping remains controlled by portraitCrop.
      profile = await image.clone().rotate().resize({ width: 1536, height: 2048, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 100, effort: 4 }).toBuffer();
      thumbnail = await image.clone().rotate().resize({ width: 960, height: 1280, fit: 'inside', withoutEnlargement: true }).webp({ quality: 90, alphaQuality: 100, effort: 4 }).toBuffer();
    } catch { throw storeError(400, '이미지를 처리하지 못했습니다. 손상되지 않은 정지 PNG 파일인지 확인해주세요. 최대 해상도는 6,400만 픽셀입니다.'); }
    await ensureBucket();
    if (!/^[a-zA-Z0-9_-]{1,120}$/.test(character.id)) throw storeError(400, '캐릭터 ID 형식이 올바르지 않습니다.');
    const hash = createHash('sha256').update(bytes).digest('hex');
    const folder = `${character.id}/${hash}`;
    const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
    // Upload sequentially to avoid multiplying memory usage for large originals.
    const imageOriginal = await upload(`${folder}/original.${extension}`, bytes, `image/${match[1]}`);
    const imageUrl = await upload(`${folder}/profile-v1.webp`, profile, 'image/webp');
    const imageThumbnail = await upload(`${folder}/thumbnail-v2.webp`, thumbnail, 'image/webp');
    return { ...character, image: imageUrl, imageOriginal, imageThumbnail };
  };
  return { ensureBucket, prepare };
}
