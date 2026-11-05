import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scryptSync, randomBytes } from 'node:crypto';
import { createApi } from './api.ts';
import { supabaseAdminAuth } from './admin-auth.ts';
import type { CharacterStore } from './character-store.ts';
import { INITIAL_CHARACTERS } from '../src/data/initialCharacters.ts';
import { createImageStorage } from './image-storage.ts';
import sharp from 'sharp';

test('shared Supabase sessions work across API instances and logout revokes every instance', async () => {
  const sessions = new Map<string, string>();
  const counts = new Map<string, number>();
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (url.pathname.endsWith('/rpc/archive_admin_login_attempt')) {
      const count = (counts.get(body.p_key) || 0) + 1; counts.set(body.p_key, count);
      return Response.json({ allowed: count <= 5, retryAfter: 900 });
    }
    if (url.pathname.endsWith('/archive_admin_login_attempts')) { counts.delete(url.searchParams.get('key_hash')!.slice(3)); return new Response(null, { status: 204 }); }
    if (init?.method === 'POST') { assert.match(body.token_hash, /^[a-f0-9]{64}$/); sessions.set(body.token_hash, body.expires_at); return new Response(null, { status: 201 }); }
    const key = url.searchParams.get('token_hash')!.slice(3);
    if (init?.method === 'DELETE') { sessions.delete(key); return new Response(null, { status: 204 }); }
    return Response.json(sessions.has(key) ? [{ token_hash: key }] : []);
  };
  const records = structuredClone(INITIAL_CHARACTERS);
  const store = { list: async () => records, create: async (record: typeof records[number]) => { records.push(record); } } as CharacterStore;
  const password = 'test-only-admin-password';
  const hash = `test-salt:${scryptSync(password, 'test-salt', 64).toString('hex')}`;
  const servers = [1, 2].map(() => createApi({ username: 'admin', passwordHash: hash, dataDirectory: 'unused', store,
    auth: supabaseAdminAuth({ url: 'https://test.supabase.co', key: 'sb_secret_test', fetch: fetcher }),
  }).listen(0, '127.0.0.1'));
  await Promise.all(servers.map(server => new Promise<void>(resolve => server.on('listening', resolve))));
  let cookie = '';
  const request = (index: number, route: string, method = 'GET', body?: unknown) => {
    const base = `http://127.0.0.1:${(servers[index].address() as { port: number }).port}`;
    return fetch(base + route, { method, headers: { Origin: base, Cookie: cookie, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  };
  try {
    assert.equal((await request(0, '/api/admin/image-upload/sign', 'POST', {})).status, 401);
    const login = await request(0, '/api/admin/login', 'POST', { username: 'admin', password });
    assert.equal(login.status, 200);
    cookie = (login.headers.get('set-cookie') || '').split(';')[0];
    assert.ok(!sessions.has(cookie.split('=')[1]));
    assert.equal((await (await request(1, '/api/admin/session')).json()).authenticated, true);
    assert.equal((await request(1, '/api/admin/characters', 'POST', { ...records[0], id: 'shared-session-character' })).status, 201);
    await request(1, '/api/admin/logout', 'POST', {});
    assert.equal((await (await request(0, '/api/admin/session')).json()).authenticated, false);
    for (let i = 0; i < 5; i++) assert.equal((await request(i % 2, '/api/admin/login', 'POST', { username: 'admin', password: 'wrong' })).status, 401);
    assert.equal((await request(1, '/api/admin/login', 'POST', { username: 'admin', password })).status, 429);
  } finally { await Promise.all(servers.map(server => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())))); }
});

test('direct upload signs only its own Storage URL and finishes without a base64 DB record', async () => {
  const png = await sharp({ create: { width: 12, height: 16, channels: 4, background: '#aabbcc' } }).png().toBuffer();
  let path = '', stagingDeleted = false;
  const storage = createImageStorage({ url: 'https://test.supabase.co', key: 'sb_secret_test', fetch: async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname.includes('/bucket/')) return Response.json({ public: true });
    if (url.pathname.includes('/object/upload/sign/')) {
      path = url.pathname.split('/character-images/')[1];
      return Response.json({ url: `/object/upload/sign/character-images/${path}?token=test-only-token` });
    }
    if (!init?.method || init.method === 'GET') return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
    if (init?.method === 'DELETE') { stagingDeleted = true; assert.deepEqual(JSON.parse(String(init.body)).prefixes, [path]); }
    return Response.json({});
  } });
  const signed = await storage.signUpload('test-character');
  assert.equal(new URL(signed.signedUrl).hostname, 'test.supabase.co');
  const result = await storage.completeUpload('test-character', signed.path);
  assert.ok(result.image.startsWith('https://test.supabase.co/storage/v1/object/public/'));
  assert.ok(!JSON.stringify(result).includes('base64'));
  assert.ok(stagingDeleted);
  await assert.rejects(storage.completeUpload('different-character', signed.path), { status: 400 });
});

test('authentication store errors fail closed and token values never enter database URLs', async () => {
  const token = randomBytes(32).toString('hex');
  const auth = supabaseAdminAuth({ url: 'https://test.supabase.co', key: 'sb_secret_test', fetch: async (input, init) => {
    assert.ok(!String(input).includes(token));
    assert.ok(!String(init?.body).includes(token));
    return Response.json({}, { status: 404 });
  } });
  await assert.rejects(auth.valid(token), { status: 503 });
  await assert.rejects(auth.issue(token, Date.now() + 10000), { status: 503 });
});
