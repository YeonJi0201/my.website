import express, { type Request, type Response } from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { INITIAL_CHARACTERS } from '../src/data/initialCharacters.ts';
import type { Character } from '../src/types/character.ts';

const asyncRoute = (handler: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: express.NextFunction) => { Promise.resolve(handler(req, res)).catch(next); };
type Options = { username: string; passwordHash: string; dataDirectory: string; secureCookie?: boolean };
const SESSION_LIFETIME = 8 * 60 * 60 * 1000;
const COOKIE = 'once_admin_session';

function validCharacter(value: unknown): value is Character {
  if (!value || typeof value !== 'object') return false;
  const c = value as Character;
  const strings = ['id', 'nameKo', 'nameEn', 'gender', 'birthday', 'patronus', 'boggart', 'appearanceSummary', 'appearanceDetail', 'personalityDetail', 'background', 'quote', 'specialty'] as const;
  if (!strings.every(k => typeof c[k] === 'string' && c[k].length <= 20000)) return false;
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(c.id) || !c.nameKo.trim() || !c.nameEn.trim()) return false;
  if (!['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'].includes(c.house) || !['순수혈통', '혼혈', '머글태생'].includes(c.bloodStatus)) return false;
  if (!Number.isInteger(c.age) || c.age < 1 || c.age > 200 || !Number.isInteger(c.year) || c.year < 1 || c.year > 7 || !Number.isFinite(c.createdAt)) return false;
  if (c.height !== undefined && (!Number.isFinite(c.height) || c.height < 1 || c.height > 300)) return false;
  if (c.weight !== undefined && (!Number.isFinite(c.weight) || c.weight < 1 || c.weight > 500)) return false;
  if (![c.personality, c.trivia].every(a => Array.isArray(a) && a.length <= 100 && a.every(s => typeof s === 'string' && s.length <= 5000))) return false;
  if (!c.wand || !['wood', 'core', 'length', 'flexibility'].every(k => typeof c.wand[k as keyof Character['wand']] === 'string' && c.wand[k as keyof Character['wand']].length <= 1000)) return false;
  if (c.positionOrClub !== undefined && (typeof c.positionOrClub !== 'string' || c.positionOrClub.length > 1000)) return false;
  if (typeof c.image !== 'string' || c.image.length > 7_000_000 || !(/^(\/src\/assets\/images\/|\/assets\/)[\w.-]+$/.test(c.image) || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(c.image))) return false;
  if (c.portraitCrop && (!Number.isFinite(c.portraitCrop.zoom) || c.portraitCrop.zoom < .5 || c.portraitCrop.zoom > 3 || !Number.isFinite(c.portraitCrop.x) || Math.abs(c.portraitCrop.x) > 100 || !Number.isFinite(c.portraitCrop.y) || Math.abs(c.portraitCrop.y) > 100)) return false;
  return true;
}

export function createApi(options: Options) {
  const api = express();
  api.disable('x-powered-by');
  const sessions = new Map<string, number>();
  const attempts = new Map<string, { count: number; expires: number }>();
  const dataFile = path.join(options.dataDirectory, 'characters.json');
  let queue: Promise<unknown> = Promise.resolve();
  const readCharacters = async (): Promise<Character[]> => {
    try { return JSON.parse(await readFile(dataFile, 'utf8')); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return structuredClone(INITIAL_CHARACTERS); throw error; }
  };
  const mutate = (update: (characters: Character[]) => Character[]) => {
    const operation = queue.then(async () => {
      const result = update(await readCharacters());
      await mkdir(options.dataDirectory, { recursive: true });
      await writeFile(`${dataFile}.tmp`, JSON.stringify(result, null, 2), { mode: 0o600 });
      await rename(`${dataFile}.tmp`, dataFile);
      return result;
    });
    queue = operation.catch(() => {});
    return operation;
  };
  const token = (req: Request) => req.headers.cookie?.split(';').map(c => c.trim()).find(c => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || '';
  const authenticated = (req: Request) => {
    const key = token(req), expiry = sessions.get(key);
    if (!expiry || expiry <= Date.now()) { sessions.delete(key); return false; }
    return true;
  };
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
  api.get('/api/characters', (_req, res, next) => { readCharacters().then(value => res.json(value)).catch(next); });
  api.get('/api/admin/session', (req, res) => { res.json({ authenticated: authenticated(req) }); });
  api.post('/api/admin/login', (req, res) => {
    if (!options.passwordHash) { res.status(503).json({ error: '관리자 계정이 설정되지 않았습니다. 서버에서 계정을 설정해주세요.' }); return; }
    const address = req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    for (const [key, value] of attempts) if (value.expires < now) attempts.delete(key);
    const attempt = attempts.get(address) || { count: 0, expires: now + 15 * 60 * 1000 };
    if (attempt.count >= 5) { res.set('Retry-After', String(Math.ceil((attempt.expires - now) / 1000))); res.status(429).json({ error: '로그인 시도가 많습니다. 잠시 후 다시 시도해주세요.' }); return; }
    attempt.count++; attempts.set(address, attempt);
    const { username, password } = req.body || {};
    const [salt, encoded] = options.passwordHash.split(':');
    let matches = false;
    if (typeof password === 'string' && password.length <= 512 && salt && /^[a-f0-9]{128}$/.test(encoded || '')) {
      const actual = scryptSync(password, salt, 64);
      matches = timingSafeEqual(actual, Buffer.from(encoded, 'hex'));
    }
    if (!matches || username !== options.username) { res.status(401).json({ error: '아이디 또는 비밀번호를 확인해주세요.' }); return; }
    attempts.delete(address);
    for (const [key, expiry] of sessions) if (expiry <= now) sessions.delete(key);
    sessions.delete(token(req));
    const session = randomBytes(32).toString('hex');
    sessions.set(session, now + SESSION_LIFETIME);
    res.cookie(COOKIE, session, { ...cookieOptions(req), maxAge: SESSION_LIFETIME }).json({ authenticated: true });
  });
  api.post('/api/admin/logout', (req, res) => {
    sessions.delete(token(req));
    res.clearCookie(COOKIE, cookieOptions(req)).json({ authenticated: false });
  });
  api.use('/api/admin', (req, res, next) => {
    if (!authenticated(req)) { res.status(401).json({ error: '관리자 로그인이 필요합니다.' }); return; }
    next();
  });
  api.post('/api/admin/characters', asyncRoute(async (req, res) => {
    if (!validCharacter(req.body)) { res.status(400).json({ error: '캐릭터 입력값과 이미지 형식을 확인해주세요.' }); return; }
    const result = await mutate(characters => {
      if (characters.some(c => c.id === req.body.id)) throw Object.assign(new Error('이미 등록된 캐릭터입니다.'), { status: 409 });
      return [req.body, ...characters];
    });
    res.status(201).json(result);
  }));
  api.put('/api/admin/characters/:id', asyncRoute(async (req, res) => {
    if (!validCharacter(req.body) || req.body.id !== req.params.id) { res.status(400).json({ error: '캐릭터 입력값과 이미지 형식을 확인해주세요.' }); return; }
    res.json(await mutate(characters => {
      if (!characters.some(c => c.id === req.params.id)) throw Object.assign(new Error('캐릭터를 찾을 수 없습니다.'), { status: 404 });
      return characters.map(c => c.id === req.params.id ? req.body : c);
    }));
  }));
  api.delete('/api/admin/characters/:id', asyncRoute(async (req, res) => {
    res.json(await mutate(characters => {
      if (!characters.some(c => c.id === req.params.id)) throw Object.assign(new Error('캐릭터를 찾을 수 없습니다.'), { status: 404 });
      return characters.filter(c => c.id !== req.params.id);
    }));
  }));
  api.post('/api/admin/import', asyncRoute(async (req, res) => {
    if (!Array.isArray(req.body) || !req.body.length || req.body.length > 200 || !req.body.every(validCharacter) || new Set(req.body.map(c => c.id)).size !== req.body.length) { res.status(400).json({ error: '가져올 기록 형식을 확인해주세요.' }); return; }
    res.json(await mutate(characters => [...req.body, ...characters.filter(c => !req.body.some((old: Character) => old.id === c.id))]));
  }));
  api.use('/api', (_req, res) => { res.status(404).json({ error: '존재하지 않는 요청입니다.' }); });
  api.use((error: Error & { status?: number; type?: string }, _req: Request, res: Response, _next: express.NextFunction) => {
    const status = error.status || 500;
    if (status >= 500) console.error('Archive API error:', error.message);
    res.status(status).json({ error: status === 413 ? '파일이 너무 큽니다.' : status >= 500 ? '기록을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.' : error.type === 'entity.parse.failed' ? '올바른 JSON 형식이 아닙니다.' : error.message });
  });
  return api;
}
