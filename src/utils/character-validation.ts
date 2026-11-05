import { MAX_IMAGE_DATA_URL_LENGTH } from './image-limits.ts';
import type { Character } from '../types/character.ts';

/** Return actionable messages without including submitted values or credentials. */
export function characterErrors(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['캐릭터 데이터 형식이 올바르지 않습니다.'];
  const c = value as Character;
  const errors: string[] = [];
  const fields = { id: '캐릭터 ID', nameKo: '한글 이름', nameEn: '영문 이름', gender: '성별', birthday: '생일', appearanceSummary: '외관 요약', appearanceDetail: '외관 상세', personalityDetail: '성격 상세', background: '배경 이야기', quote: '대표 대사' } as const;
  for (const [key, label] of Object.entries(fields)) {
    const field = c[key as keyof typeof fields];
    if (typeof field !== 'string') errors.push(`${label}: 문자열로 입력해주세요.`);
    else if (field.length > 20000) errors.push(`${label}: 20,000자 이하로 입력해주세요.`);
  }
  if (typeof c.id === 'string' && !/^[a-zA-Z0-9_-]{1,120}$/.test(c.id)) errors.push('캐릭터 ID: 영문·숫자·밑줄·하이픈으로 1~120자여야 합니다.');
  if (typeof c.nameKo === 'string' && !c.nameKo.trim()) errors.push('한글 이름을 입력해주세요.');
  if (typeof c.nameEn === 'string' && !c.nameEn.trim()) errors.push('영문 이름을 입력해주세요.');
  if (!['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'].includes(c.house)) errors.push('기숙사를 선택해주세요.');
  if (!['순수혈통', '혼혈', '머글태생'].includes(c.bloodStatus)) errors.push('혈통을 선택해주세요.');
  if (!Number.isInteger(c.age) || c.age < 1 || c.age > 200) errors.push('나이: 1~200 사이의 정수를 입력해주세요.');
  if (!Number.isInteger(c.year) || c.year < 0 || c.year > 7) errors.push('학년: 1학년·4학년·7학년·그 외 중 선택해주세요.');
  if (!Number.isFinite(c.createdAt)) errors.push('등록 시간 정보가 올바르지 않습니다. 등록 창을 다시 열어주세요.');
  if (c.height !== undefined && (!Number.isFinite(c.height) || c.height < 1 || c.height > 300)) errors.push('키: 1~300cm 범위로 입력해주세요.');
  if (c.weight !== undefined && (!Number.isFinite(c.weight) || c.weight < 1 || c.weight > 500)) errors.push('몸무게: 1~500kg 범위로 입력해주세요.');
  for (const [key, label] of [['personality', '성격 키워드'], ['trivia', '기타 설정']] as const) {
    const items = c[key];
    if (!Array.isArray(items)) errors.push(`${label}: 목록 형식이 올바르지 않습니다.`);
    else if (items.length > 100) errors.push(`${label}: 최대 100개까지 입력해주세요.`);
    else if (!items.every(item => typeof item === 'string' && item.length <= 5000)) errors.push(`${label}: 각 항목을 5,000자 이하로 입력해주세요.`);
  }
  for (const [key, label] of [['wood', '목재'], ['core', '심'], ['length', '길이'], ['flexibility', '유연함']] as const) {
    if (!c.wand || typeof c.wand[key] !== 'string' || c.wand[key].length > 1000) errors.push(`지팡이 ${label}: 1,000자 이하의 올바른 값을 입력해주세요.`);
  }
  if (c.positionOrClub !== undefined && (typeof c.positionOrClub !== 'string' || c.positionOrClub.length > 1000)) errors.push('동아리 / 직책: 1,000자 이하로 입력해주세요.');
  const storageImage = (image: string) => /^https:\/\/[a-z0-9.-]+(?::\d+)?\/storage\/v1\/object\/public\/character-images\/[\w/-]+\.(png|jpg|webp)$/.test(image);
  if (typeof c.image !== 'string' || !(/^(\/src\/assets\/images\/|\/assets\/)[\w.-]+$/.test(c.image) || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(c.image) || storageImage(c.image))) errors.push('캐릭터 이미지: PNG 파일을 선택해주세요. 잘못된 파일 형식 또는 이미지 주소입니다.');
  else if (c.image.length > MAX_IMAGE_DATA_URL_LENGTH) errors.push('캐릭터 이미지가 너무 큽니다. 20MB 이하의 파일을 선택해주세요.');
  for (const url of [c.imageOriginal, c.imageThumbnail]) {
    if (url !== undefined && (typeof url !== 'string' || url.length > 2000 || !storageImage(url))) errors.push('이미지 주소 형식이 올바르지 않습니다. PNG 파일을 다시 선택해주세요.');
  }
  if (c.portraitCrop && (!Number.isFinite(c.portraitCrop.zoom) || c.portraitCrop.zoom < .5 || c.portraitCrop.zoom > 3 || !Number.isFinite(c.portraitCrop.x) || Math.abs(c.portraitCrop.x) > 100 || !Number.isFinite(c.portraitCrop.y) || Math.abs(c.portraitCrop.y) > 100)) errors.push('이미지 크롭: 확대는 0.5~3배, 위치는 -100~100 범위여야 합니다.');
  return errors;
}
