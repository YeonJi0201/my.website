import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { scryptSync } from 'node:crypto';
import { createApi } from './api.ts';
import type { Character } from '../src/types/character.ts';

test('administrator authentication, protected writes and shared persistence', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'once-api-test-'));
  const password = 'test-only-password-with-enough-entropy';
  const salt = 'test-only-salt';
  const options = { username: 'admin', passwordHash: `${salt}:${scryptSync(password, salt, 64).toString('hex')}`, dataDirectory: directory };
  const server = createApi(options).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.on('listening', resolve));
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}`;
  let cookie = '';
  const request = (url: string, method = 'GET', body?: unknown, origin = base) => fetch(`${base}${url}`, {
    method, headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  try {
    const original: Character[] = await (await request('/api/characters')).json();
    assert.ok(original.length > 0);
    assert.equal((await (await request('/api/admin/session')).json()).authenticated, false);
    for (const [url, method, body] of [
      ['/api/admin/characters', 'POST', original[0]],
      [`/api/admin/characters/${original[0].id}`, 'PUT', original[0]],
      [`/api/admin/characters/${original[0].id}`, 'DELETE', {}],
      ['/api/admin/import', 'POST', original],
    ] as const) assert.equal((await request(url, method, body)).status, 401);
    assert.equal((await request('/api/admin/login', 'POST', { username: 'admin', password: 'incorrect' })).status, 401);
    const login = await request('/api/admin/login', 'POST', { username: 'admin', password });
    assert.equal(login.status, 200);
    const setCookie = login.headers.get('set-cookie') || '';
    assert.match(setCookie, /HttpOnly/i); assert.match(setCookie, /SameSite=Strict/i); assert.match(setCookie, /Path=\/api/i);
    cookie = setCookie.split(';')[0];
    assert.equal((await (await request('/api/admin/session')).json()).authenticated, true);
    assert.equal((await request('/api/admin/characters', 'POST', original[0], 'https://other-site.invalid')).status, 403);
    assert.equal((await request('/api/admin/characters', 'POST', { id: 'invalid' })).status, 400);
    const created = { ...original[0], id: 'test-character', nameKo: '테스트 인물', height: 172, weight: 60, portraitCrop: { zoom: 1.4, x: 12, y: -10 } };
    assert.equal((await request('/api/admin/characters', 'POST', created)).status, 201);
    assert.equal((await request('/api/admin/characters', 'POST', created)).status, 409);
    const updated = { ...created, nameKo: '수정한 인물', image: 'data:image/png;base64,iVBORw0KGgo=' };
    assert.equal((await request(`/api/admin/characters/${created.id}`, 'PUT', updated)).status, 200);
    const publicRecords: Character[] = await (await request('/api/characters')).json();
    assert.equal(publicRecords.find(c => c.id === created.id)?.nameKo, updated.nameKo);
    assert.deepEqual(publicRecords.find(c => c.id === created.id)?.portraitCrop, created.portraitCrop);
    assert.equal(JSON.parse(await readFile(path.join(directory, 'characters.json'), 'utf8')).length, original.length + 1);
    assert.equal((await request('/api/admin/import', 'POST', [{ ...updated, nameKo: '이전 기록' }])).status, 200);
    assert.equal((await request(`/api/admin/characters/${created.id}`, 'DELETE', {})).status, 200);
    assert.equal((await request('/api/admin/characters/missing-id', 'DELETE', {})).status, 404);
    assert.equal((await request('/api/admin/logout', 'POST', {})).status, 200);
    assert.equal((await request('/api/admin/characters', 'POST', created)).status, 401);
    assert.equal((await (await request('/api/admin/session')).json()).authenticated, false);
    for (let i = 0; i < 5; i++) assert.equal((await request('/api/admin/login', 'POST', { username: 'admin', password: 'wrong' })).status, 401);
    assert.equal((await request('/api/admin/login', 'POST', { username: 'admin', password })).status, 429);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    assert.ok(path.resolve(directory).startsWith(`${path.resolve(tmpdir())}${path.sep}`));
    assert.ok(path.basename(directory).startsWith('once-api-test-'));
    await rm(directory, { recursive: true, force: true });
  }
});
