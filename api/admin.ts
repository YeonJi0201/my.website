import type { Request, Response } from 'express';
import { createApi } from '../server/api.ts';
import { createSupabaseStore } from '../server/supabase-store.ts';
import { supabaseAdminAuth } from '../server/admin-auth.ts';
import { createImageStorage } from '../server/image-storage.ts';

let app: ReturnType<typeof createApi> | undefined;
export default function handler(req: Request, res: Response) {
  try {
    const url = process.env.SUPABASE_URL?.trim();
    const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
    const username = process.env.ADMIN_USERNAME?.trim();
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!url || !key || !username || !passwordHash || !/^[^:\r\n]{1,256}:[a-f0-9]{128}$/.test(passwordHash)) {
      res.status(503).json({ error: 'Vercel 관리자 환경 변수가 필요합니다. SUPABASE_URL·SUPABASE_SECRET_KEY·ADMIN_USERNAME·ADMIN_PASSWORD_HASH를 설정한 뒤 재배포해주세요.' });
      return;
    }
    if (!app) app = createApi({ username, passwordHash, dataDirectory: '/tmp/unused', secureCookie: true,
      store: createSupabaseStore({ url, key }), auth: supabaseAdminAuth({ url, key }), images: createImageStorage({ url, key }),
      clientAddress: request => String(request.headers['x-vercel-forwarded-for'] || request.socket.remoteAddress || 'unknown').split(',')[0].trim(),
    });
    // The rewrite supplies the nested admin route. Never use this value for authorization.
    const parsed = new URL(req.url || '/', 'http://localhost');
    const queryRoute = parsed.searchParams.get('route') ?? (req.query?.route as string | undefined);
    const route = queryRoute ?? parsed.pathname.replace(/^\/api\/admin\/?/, '');
    if (typeof route !== 'string' || !/^[a-zA-Z0-9_/-]*$/.test(route) || route.includes('..')) { res.status(400).json({ error: '관리자 API 경로가 올바르지 않습니다.' }); return; }
    req.url = `/api/admin/${route}`;
    app(req, res);
  } catch {
    res.status(503).json({ error: 'Vercel 관리자 서버 설정을 확인해주세요.' });
  }
}
