import type { Character } from '../types/character';

// HTTP 오류 응답의 상태 코드를 호출 화면이 분기할 수 있도록 보존한다.
// HTTP 오류 응답의 상태 코드를 호출 화면이 분기할 수 있도록 보존한다.
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
// 같은 출처의 세션 쿠키를 포함해 JSON API를 호출하고 서버 오류를 명시적으로 전달한다.
// 같은 출처의 세션 쿠키를 포함해 JSON API를 호출하고 서버 오류를 명시적으로 전달한다.
export async function api<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try { response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: method === 'GET' ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }); } catch { throw new ApiError('서버에 연결하지 못했습니다. 인터넷 연결과 개발 서버 실행 여부를 확인해주세요.', 0); }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) throw new ApiError('서버가 API 대신 HTML 화면을 반환했습니다. Vercel API 배포·라우팅·로그인 보호 설정을 확인해주세요.', response.status);
  const result = await response.json();
  if (!response.ok) throw new ApiError(response.status === 401 ? '관리자 로그인이 만료되었거나 로그인되지 않았습니다. 다시 로그인한 뒤 저장해주세요.' : result.error || `요청을 완료하지 못했습니다. (HTTP ${response.status})`, response.status);
  return result;
}
export const getCharacters = () => api<Character[]>('/api/characters');
