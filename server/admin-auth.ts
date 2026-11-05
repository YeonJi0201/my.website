import { createHash } from 'node:crypto';
import { storeError } from './character-store.ts';
export interface AdminAuth {
  valid(token: string): Promise<boolean>;
  issue(token: string, expires: number): Promise<void>;
  revoke(token: string): Promise<void>;
  attempt(address: string): Promise<{ allowed: boolean; retryAfter: number }>;
  reset(address: string): Promise<void>;
}
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export function memoryAdminAuth(): AdminAuth {
  const sessions = new Map<string, number>();
  const attempts = new Map<string, { count: number; expires: number }>();
  return {
    async valid(token) { const expiry = sessions.get(token); if (!expiry || expiry <= Date.now()) { sessions.delete(token); return false; } return true; },
    async issue(token, expiry) { for (const [key, value] of sessions) if (value <= Date.now()) sessions.delete(key); sessions.set(token, expiry); },
    async revoke(token) { sessions.delete(token); },
    async attempt(address) {
      const now = Date.now();
      for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
      const record = attempts.get(address) ?? { count: 0, expires: now + 15 * 60 * 1000 };
      const allowed = record.count < 5; record.count++; attempts.set(address, record);
      return { allowed, retryAfter: Math.max(1, Math.ceil((record.expires - now) / 1000)) };
    },
    async reset(address) { attempts.delete(address); },
  };
}

/** Supabase stores only hashes of session tokens and rate-limit identifiers. */
export function supabaseAdminAuth(options: { url: string; key: string; fetch?: typeof fetch }): AdminAuth {
  const endpoint = new URL('/rest/v1/', options.url).href;
  const headers: Record<string, string> = { apikey: options.key, 'Content-Type': 'application/json' };
  if (!options.key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${options.key}`;
  const request = async (path: string, method = 'GET', body?: unknown) => {
    let response: Response;
    try { response = await (options.fetch ?? fetch)(endpoint + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15_000), redirect: 'error' }); }
    catch { throw storeError(503, '관리자 인증 저장소에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.'); }
    if (!response.ok) throw storeError(503, '관리자 인증 저장소 설정이 필요합니다. 202611050002_admin_auth.sql 적용 여부와 서버용 Secret key를 확인해주세요.');
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  };
  return {
    async valid(token) {
      if (!/^[a-f0-9]{64}$/.test(token)) return false;
      const rows = await request(`archive_admin_sessions?token_hash=eq.${digest(token)}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=token_hash&limit=1`);
      return Array.isArray(rows) && rows.length === 1;
    },
    async issue(token, expires) { await request('archive_admin_sessions', 'POST', { token_hash: digest(token), expires_at: new Date(expires).toISOString() }); },
    async revoke(token) { if (token) await request(`archive_admin_sessions?token_hash=eq.${digest(token)}`, 'DELETE'); },
    async attempt(address) {
      const result = await request('rpc/archive_admin_login_attempt', 'POST', { p_key: digest(address) });
      if (!result || typeof result.allowed !== 'boolean' || !Number.isFinite(result.retryAfter)) throw storeError(503, '관리자 로그인 제한 설정을 확인해주세요.');
      return result as { allowed: boolean; retryAfter: number };
    },
    async reset(address) { await request(`archive_admin_login_attempts?key_hash=eq.${digest(address)}`, 'DELETE'); },
  };
}
