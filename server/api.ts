import { memoryAdminAuth, type AdminAuth } from './admin-auth.ts';
import type { createImageStorage } from './image-storage.ts';
import { characterErrors } from '../src/utils/character-validation.ts';
import express, { type Request, type Response } from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createFileStore, type CharacterStore } from './character-store.ts';
import type { Character } from '../src/types/character.ts';

const asyncRoute = (handler: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: express.NextFunction) => { Promise.resolve(handler(req, res)).catch(next); };
type Options = { username: string; passwordHash: string; dataDirectory: string; secureCookie?: boolean; store?: CharacterStore; auth?: AdminAuth; images?: ReturnType<typeof createImageStorage>; clientAddress?: (req: Request) => string };
const SESSION_LIFETIME = 8 * 60 * 60 * 1000;
const COOKIE = 'once_admin_session';

// 외부 입력이 캐릭터 데이터 계약과 이미지·범위 제한을 만족하는지 서버에서 검증한다.
export function validCharacter(value: unknown): value is Character {
  return characterErrors(value).length === 0;
}

export function createApi(options: Options) {
  // 저장소 경로, 직렬화된 파일 갱신, 메모리 세션과 로그인 시도 제한을 API 인스턴스별로 관리한다.
  const api = express();
  api.disable('x-powered-by');
  const auth = options.auth ?? memoryAdminAuth();
  const store = options.store ?? createFileStore(options.dataDirectory);
  const token = (req: Request) => req.headers.cookie?.split(';').map(c => c.trim()).find(c => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || '';
  const authenticated = (req: Request) => auth.valid(token(req));
  const cookieOptions = (req: Request) => ({ httpOnly: true, sameSite: 'strict' as const, secure: options.secureCookie || req.secure, path: '/api' });
  api.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      let sameOrigin = false;
      try { sameOrigin = new URL(req.get('origin') || '').host === req.get('host'); } catch {}
      if (!sameOrigin) { res.status(403).json({ error: '허용되지 않은 요청입니다.' }); return; }
      if (!req.is('application/json')) { res.status(415).json({ error: 'JSON 형식으로 요청해주세요.' }); return; }
    }
    next();
  });
  api.use(express.json({ limit: '45mb' }));
  api.get('/api/characters', (_req, res, next) => { store.list().then(value => res.json(value)).catch(next); });
  api.get('/api/admin/session', asyncRoute(async (req, res) => { res.json({ authenticated: await authenticated(req) }); }));
  // 관리자 로그인은 원본 비밀번호를 비교하고 제한된 세션 쿠키를 발급한다.
  api.post('/api/admin/login', asyncRoute(async (req, res) => {
    if (!options.passwordHash) { res.status(503).json({ error: '관리자 계정이 설정되지 않았습니다. 서버에서 계정을 설정해주세요.' }); return; }
    const address = options.clientAddress?.(req) || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const attempt = await auth.attempt(address);
    if (!attempt.allowed) { res.set('Retry-After', String(attempt.retryAfter)); res.status(429).json({ error: '로그인 시도가 많습니다. 15분 후 다시 시도해주세요.' }); return; }
    const { username, password } = req.body || {};
    const [salt, encoded] = options.passwordHash.split(':');
    let matches = false;
    if (typeof password === 'string' && password.length <= 512 && salt && /^[a-f0-9]{128}$/.test(encoded || '')) {
      const actual = scryptSync(password, salt, 64);
      matches = timingSafeEqual(actual, Buffer.from(encoded, 'hex'));
    }
    if (!matches || username !== options.username) { res.status(401).json({ error: '아이디 또는 비밀번호를 확인해주세요.' }); return; }
    await auth.reset(address);
    await auth.revoke(token(req));
    const session = randomBytes(32).toString('hex');
    await auth.issue(session, now + SESSION_LIFETIME);
    res.cookie(COOKIE, session, { ...cookieOptions(req), maxAge: SESSION_LIFETIME }).json({ authenticated: true });
  }));
  api.post('/api/admin/logout', asyncRoute(async (req, res) => {
    await auth.revoke(token(req));
    res.clearCookie(COOKIE, cookieOptions(req)).json({ authenticated: false });
  }));
  // 이후 모든 관리자 경로에서 세션 인증을 강제한다.
  api.use('/api/admin', (req, res, next) => {
    authenticated(req).then(valid => {
      if (!valid) { res.status(401).json({ error: '관리자 로그인이 필요합니다.' }); return; }
      next();
    }).catch(next);
  });
  api.post('/api/admin/image-upload/sign', asyncRoute(async (req, res) => {
    if (!options.images) { res.json({ direct: false }); return; }
    const { id, size, contentType } = req.body || {};
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(id) || contentType !== 'image/png' || !Number.isInteger(size) || size < 1 || size > 20 * 1024 * 1024) {
      res.status(400).json({ error: '20MB 이하의 PNG 이미지와 올바른 캐릭터 ID가 필요합니다.' }); return;
    }
    res.json({ direct: true, ...await options.images.signUpload(id) });
  }));
  api.post('/api/admin/image-upload/complete', asyncRoute(async (req, res) => {
    if (!options.images) { res.status(503).json({ error: '이미지 저장소가 설정되지 않았습니다.' }); return; }
    const { id, path } = req.body || {};
    if (typeof id !== 'string' || typeof path !== 'string') { res.status(400).json({ error: '이미지 업로드 정보가 올바르지 않습니다.' }); return; }
    const result = await options.images.completeUpload(id, path);
    res.json({ image: result.image, imageOriginal: result.imageOriginal, imageThumbnail: result.imageThumbnail });
  }));
  // 인증된 관리자만 캐릭터 등록·수정·삭제와 기존 데이터 병합을 수행한다.
  api.post('/api/admin/characters', asyncRoute(async (req, res) => {
    const errors = characterErrors(req.body);
    if (errors.length) { res.status(400).json({ error: errors.join('\n') }); return; }
    await store.create(req.body);
    res.status(201).json(await store.list());
  }));
  api.put('/api/admin/characters/:id', asyncRoute(async (req, res) => {
    const errors = characterErrors(req.body);
    if (errors.length) { res.status(400).json({ error: errors.join('\n') }); return; }
    if (req.body.id !== req.params.id) { res.status(400).json({ error: '수정할 캐릭터 ID가 일치하지 않습니다. 명부를 새로고침해주세요.' }); return; }
    await store.update(req.body);
    res.json(await store.list());
  }));
  api.delete('/api/admin/characters/:id', asyncRoute(async (req, res) => {
    await store.remove(String(req.params.id));
    res.json(await store.list());
  }));
  api.post('/api/admin/import', asyncRoute(async (req, res) => {
    if (!Array.isArray(req.body) || !req.body.length || req.body.length > 200 || !req.body.every(validCharacter) || new Set(req.body.map(c => c.id)).size !== req.body.length) { res.status(400).json({ error: '가져올 기록 형식을 확인해주세요.' }); return; }
    await store.import(req.body);
    res.json(await store.list());
  }));
  api.use('/api', (_req, res) => { res.status(404).json({ error: '존재하지 않는 요청입니다.' }); });
  api.use((error: Error & { status?: number; type?: string; expose?: boolean }, _req: Request, res: Response, _next: express.NextFunction) => {
    // 모든 비동기 라우트의 오류를 상태 코드와 한국어 JSON 응답으로 변환한다.
    const status = error.status || 500;
    if (status >= 500) console.error('Archive API error:', { status, category: error.expose ? 'storage' : 'internal' });
    res.status(status).json({ error: status === 413 ? '파일이 너무 큽니다.' : status >= 500 ? (error.expose ? error.message : '서버에서 기록을 처리하지 못했습니다. 잠시 후 다시 시도해주세요. 계속되면 서버 로그를 확인해주세요.') : error.type === 'entity.parse.failed' ? '올바른 JSON 형식이 아닙니다.' : error.message });
  });
  return api;
}
