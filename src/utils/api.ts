import type { Character } from '../types/character';

// HTTP 오류 응답의 상태 코드를 호출 화면이 분기할 수 있도록 보존한다.
// HTTP 오류 응답의 상태 코드를 호출 화면이 분기할 수 있도록 보존한다.
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
// 같은 출처의 세션 쿠키를 포함해 JSON API를 호출하고 서버 오류를 명시적으로 전달한다.
// 같은 출처의 세션 쿠키를 포함해 JSON API를 호출하고 서버 오류를 명시적으로 전달한다.
export async function api<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: method === 'GET' ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(result.error || '요청을 완료하지 못했습니다.', response.status);
  return result;
}
export const getCharacters = () => api<Character[]>('/api/characters');
