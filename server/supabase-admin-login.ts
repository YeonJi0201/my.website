import { storeError } from './character-store.ts';

export type VerifyAdmin = (email: unknown, password: unknown) => Promise<boolean>;

/**
 * Supabase Authentication > Users에 등록되고 이메일 확인이 끝난 사용자를 관리자로 인정한다.
 * 누구나 가입해 관리자가 되는 일을 막기 위해, 프로젝트의 공개 가입이 꺼져 있을 때만 로그인을 허용한다.
 * Supabase가 발급한 토큰은 확인 직후 폐기하며, 사이트 세션은 기존 archive_admin_sessions가 담당한다.
 */
export function supabaseAdminLogin(options: { url: string; key: string; fetch?: typeof fetch }): VerifyAdmin {
  const fetcher = options.fetch ?? fetch;
  const base = new URL('/', options.url);
  const serviceHeaders: Record<string, string> = { apikey: options.key, 'Content-Type': 'application/json' };
  if (!options.key.startsWith('sb_secret_')) serviceHeaders.Authorization = `Bearer ${options.key}`;
  const call = async (path: string, init: RequestInit) => {
    try { return await fetcher(new URL(path, base).href, { ...init, signal: AbortSignal.timeout(15_000), redirect: 'error' }); }
    catch { throw storeError(503, '관리자 인증 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.'); }
  };
  return async (email, password) => {
    if (typeof email !== 'string' || typeof password !== 'string') return false;
    const address = email.trim();
    if (!/^[^\s@]{1,128}@[^\s@]{1,255}$/.test(address) || !password || password.length > 512) return false;
    const settings = await call('/auth/v1/settings', { headers: serviceHeaders });
    const config = settings.ok ? await settings.json().catch(() => null) as { disable_signup?: boolean } | null : null;
    if (config?.disable_signup !== true) {
      throw storeError(503, 'Supabase 공개 가입이 켜져 있어 관리자 로그인을 막았습니다. Authentication > Sign In / Providers에서 "Allow new users to sign up"을 꺼주세요.');
    }
    const signIn = await call('/auth/v1/token?grant_type=password', { method: 'POST', headers: serviceHeaders, body: JSON.stringify({ email: address, password }) });
    if (signIn.status === 400 || signIn.status === 401 || signIn.status === 422) return false;
    if (!signIn.ok) throw storeError(503, '관리자 인증 서버 설정을 확인해주세요.');
    const session = await signIn.json().catch(() => null) as { access_token?: string; user?: { id?: string; email_confirmed_at?: string | null } } | null;
    if (session?.access_token) {
      // 사이트는 Supabase 세션을 쓰지 않으므로 발급된 refresh token을 즉시 폐기한다.
      await call('/auth/v1/logout', { method: 'POST', headers: { apikey: options.key, Authorization: `Bearer ${session.access_token}` } }).catch(() => undefined);
    }
    return typeof session?.user?.id === 'string' && Boolean(session.user.email_confirmed_at);
  };
}

/** Supabase가 설정되어 있으면 이메일 로그인을 사용한다. 파일 저장소 모드에서는 기존 로컬 계정을 유지한다. */
export function adminLoginFromEnvironment(env: Record<string, string | undefined>): VerifyAdmin | undefined {
  const url = env.SUPABASE_URL?.trim();
  const key = (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  if (env.ARCHIVE_STORAGE?.trim() === 'file' || !url || !key) return undefined;
  return supabaseAdminLogin({ url, key });
}
