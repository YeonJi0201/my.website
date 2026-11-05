import type { Character } from '../src/types/character.ts';
import { type CharacterStore, storeError } from './character-store.ts';

type Options = { url: string; key: string; fetch?: typeof fetch };
type Row = { id: string; profile: Character };

/** Server-only PostgREST adapter. Never import this module into src/. */
export function createSupabaseStore(options: Options): CharacterStore {
  const url = new URL(options.url);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
    throw new Error('SUPABASE_URL은 HTTPS 주소여야 합니다.');
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('SUPABASE_URL에는 프로젝트의 기본 URL만 입력해주세요.');
  if (!options.key.trim() || options.key.startsWith('sb_publishable_')) throw new Error('Supabase 서버용 secret 키를 설정해주세요.');
  const endpoint = new URL('/rest/v1/characters', url);
  const fetcher = options.fetch ?? fetch;
  const headers: Record<string, string> = { apikey: options.key, 'Content-Type': 'application/json' };
  // New sb_secret keys are not JWTs; legacy service_role JWTs also need Authorization.
  if (!options.key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${options.key}`;

  const request = async (query: string, method = 'GET', body?: unknown, prefer?: string): Promise<Row[]> => {
    let response: Response;
    try {
      response = await fetcher(`${endpoint}${query}`, {
        method, headers: { ...headers, ...(prefer ? { Prefer: prefer } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15_000), redirect: 'error',
      });
    } catch { throw storeError(503, 'Supabase 연결을 확인해주세요.'); }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 409 && error.code === '23505') throw storeError(409, '이미 등록된 캐릭터입니다.');
      // Do not expose database errors, request headers or keys to logs/clients.
      throw storeError(503, 'Supabase 저장소에 접근하지 못했습니다. 연결 설정과 SQL 적용 여부를 확인해주세요.');
    }
    if (response.status === 204) return [];
    const text = await response.text();
    if (!text) return [];
    let result: unknown;
    try { result = JSON.parse(text); }
    catch { throw storeError(503, 'Supabase 응답 형식을 확인해주세요.'); }
    if (!Array.isArray(result)) throw storeError(503, 'Supabase 응답 형식을 확인해주세요.');
    return result as Row[];
  };
  const row = (character: Character) => ({ id: character.id, profile: character });
  const byId = (id: string) => `?id=eq.${encodeURIComponent(id)}&select=id`;
  return {
    async list() {
      const characters: Character[] = [];
      // Paginate independently of the project's configured maximum row limit.
      for (let offset = 0; ; ) {
        const rows = await request(`?select=id,profile&order=created_at.desc,id.asc&limit=100&offset=${offset}`);
        if (!rows.length) return characters;
        characters.push(...rows.map(record => record.profile));
        offset += rows.length;
      }
    },
    async create(character) { await request('', 'POST', row(character), 'return=minimal'); },
    async update(character) {
      const rows = await request(byId(character.id), 'PATCH', { profile: character }, 'return=representation');
      if (!rows.length) throw storeError(404, '캐릭터를 찾을 수 없습니다.');
    },
    async remove(id) {
      const rows = await request(byId(id), 'DELETE', undefined, 'return=representation');
      if (!rows.length) throw storeError(404, '캐릭터를 찾을 수 없습니다.');
    },
    async import(characters) {
      if (!characters.length) return;
      // One SQL upsert statement: merge by ID atomically, preserving other rows.
      await request('?on_conflict=id', 'POST', characters.map(row), 'resolution=merge-duplicates,return=minimal');
    },
  };
}
