import type { Character } from '../types/character';
import { api } from './api';
import { MAX_IMAGE_BYTES } from './image-limits';

/** Large PNG bytes go directly to Storage, never through a Vercel Function. */
export async function prepareImageUpload(character: Character): Promise<Character> {
  if (!character.image.startsWith('data:')) return character;
  const blob = await (await fetch(character.image)).blob();
  if (blob.type !== 'image/png' || blob.size > MAX_IMAGE_BYTES) throw new Error('20MB 이하의 PNG 이미지를 선택해주세요. 이전 JPEG 기록은 로컬 데이터 이전 명령을 사용해주세요.');
  const signed = await api<{ direct: boolean; signedUrl?: string; path?: string }>('/api/admin/image-upload/sign', 'POST', { id: character.id, size: blob.size, contentType: blob.type });
  if (!signed.direct) return character; // Existing local file-store mode.
  if (!signed.signedUrl || !signed.path) throw new Error('이미지 업로드 주소를 받지 못했습니다. 다시 시도해주세요.');
  let response: Response;
  try { response = await fetch(signed.signedUrl, { method: 'PUT', headers: { 'Content-Type': 'image/png', 'Cache-Control': 'max-age=31536000' }, body: blob, credentials: 'omit' }); }
  catch { throw new Error('이미지를 Storage에 업로드하지 못했습니다. 인터넷 연결을 확인해주세요.'); }
  if (!response.ok) throw new Error(response.status === 413 ? '이미지 저장소 업로드 제한을 넘었습니다. 20MB 이하의 PNG 파일인지 확인해주세요.' : '이미지 업로드가 거부되었습니다. 다시 저장해 임시 업로드 주소를 새로 발급받아주세요.');
  const images = await api<Pick<Character, 'image' | 'imageOriginal' | 'imageThumbnail'>>('/api/admin/image-upload/complete', 'POST', { id: character.id, path: signed.path });
  return { ...character, ...images };
}
