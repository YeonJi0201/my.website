import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import { createSupabaseStore } from './supabase-store.ts';
import { storeFromEnvironment } from './store-config.ts';
import { createApi } from './api.ts';
import { INITIAL_CHARACTERS } from '../src/data/initialCharacters.ts';

test('Supabase adapter: headers, pagination, CRUD conflicts, missing records and atomic import', async () => {
  const records = new Map(INITIAL_CHARACTERS.map(c => [c.id, structuredClone(c)]));
  const calls: { method: string; prefer: string | null }[] = [];
  const store = createSupabaseStore({
    url: 'https://test.supabase.co', key: 'sb_secret_test_only',
    fetch: async (input, init) => {
      const url = new URL(String(input));
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('apikey'), 'sb_secret_test_only');
      assert.equal(headers.get('authorization'), null);
      const method = init?.method || 'GET';
      calls.push({ method, prefer: headers.get('prefer') });
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      const id = url.searchParams.get('id')?.slice(3);
      if (method === 'GET') {
        // Emulate a project row cap smaller than the requested page size.
        const offset = Number(url.searchParams.get('offset'));
        return Response.json([...records.values()].slice(offset, offset + 2).map(profile => ({ id: profile.id, profile })));
      }
      if (method === 'POST') {
        if (Array.isArray(body)) {
          assert.equal(url.searchParams.get('on_conflict'), 'id');
          assert.match(headers.get('prefer') || '', /resolution=merge-duplicates/);
          for (const row of body) records.set(row.id, row.profile);
        } else {
          if (records.has(body.id)) return Response.json({ code: '23505' }, { status: 409 });
          records.set(body.id, body.profile);
        }
        return new Response(null, { status: 201 });
      }
      if (!id || !records.has(id)) return Response.json([]);
      if (method === 'PATCH') records.set(id, body.profile);
      if (method === 'DELETE') records.delete(id);
      return Response.json([{ id }]);
    },
  });
  assert.equal((await store.list()).length, INITIAL_CHARACTERS.length);
  assert.ok(calls.filter(c => c.method === 'GET').length > 1);
  const character = { ...INITIAL_CHARACTERS[0], id: 'supabase-test-record' };
  await store.create(character);
  await assert.rejects(store.create(character), { status: 409 });
  await store.update({ ...character, nameEn: 'Updated name' });
  assert.equal((await store.list()).find(c => c.id === character.id)?.nameEn, 'Updated name');
  await store.import([{ ...character, nameEn: 'Imported name' }]);
  assert.equal((await store.list()).length, INITIAL_CHARACTERS.length + 1);
  assert.equal(records.get(character.id)?.nameEn, 'Imported name');
  await store.remove(character.id);
  await assert.rejects(store.remove(character.id), { status: 404 });
  await assert.rejects(store.update(character), { status: 404 });
});

test('Supabase credentials and upstream failures fail closed without leaking details', async () => {
  assert.throws(() => storeFromEnvironment({ ARCHIVE_STORAGE: 'supabase' }, 'unused'));
  assert.throws(() => storeFromEnvironment({ SUPABASE_URL: 'https://test.supabase.co' }, 'unused'));
  assert.throws(() => createSupabaseStore({ url: 'http://remote.invalid', key: 'sb_secret_test' }));
  assert.throws(() => createSupabaseStore({ url: 'https://test.supabase.co', key: 'sb_publishable_test' }));
  const store = createSupabaseStore({ url: 'https://test.supabase.co', key: 'sb_secret_test', fetch: async () => Response.json({ message: 'private database detail' }, { status: 401 }) });
  await assert.rejects(store.list(), (error: Error & { status?: number }) => error.status === 503 && !error.message.includes('private database detail'));
  const offline = createSupabaseStore({ url: 'https://test.supabase.co', key: 'sb_secret_test', fetch: async () => { throw new Error('sensitive transport detail'); } });
  await assert.rejects(offline.list(), { status: 503 });
  let authorized = false;
  const legacy = createSupabaseStore({ url: 'https://test.supabase.co', key: 'test-legacy-jwt', fetch: async (_input, init) => {
    authorized = new Headers(init?.headers).get('authorization') === 'Bearer test-legacy-jwt';
    return Response.json([]);
  } });
  await legacy.list();
  assert.ok(authorized);
});

test('Supabase-backed API requires admin session before any database write', async () => {
  let writes = 0;
  const store = createSupabaseStore({ url: 'https://test.supabase.co', key: 'sb_secret_test', fetch: async (_input, init) => {
    if (init?.method !== 'GET') { writes++; return new Response(null, { status: 201 }); }
    return Response.json([]);
  } });
  const password = 'test-password-only';
  const salt = 'test-salt';
  const app = createApi({ username: 'admin', passwordHash: `${salt}:${scryptSync(password, salt, 64).toString('hex')}`, dataDirectory: 'unused', store });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.on('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  let cookie = '';
  const request = (route: string, method = 'GET', body?: unknown) => fetch(`${base}${route}`, {
    method, headers: { Origin: base, Cookie: cookie, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  try {
    assert.equal((await request('/api/characters')).status, 200);
    for (const [route, method, body] of [
      ['/api/admin/characters', 'POST', INITIAL_CHARACTERS[0]],
      [`/api/admin/characters/${INITIAL_CHARACTERS[0].id}`, 'PUT', INITIAL_CHARACTERS[0]],
      [`/api/admin/characters/${INITIAL_CHARACTERS[0].id}`, 'DELETE', {}],
      ['/api/admin/import', 'POST', INITIAL_CHARACTERS],
    ] as const) assert.equal((await request(route, method, body)).status, 401);
    assert.equal(writes, 0);
    const login = await request('/api/admin/login', 'POST', { username: 'admin', password });
    assert.equal(login.status, 200);
    cookie = (login.headers.get('set-cookie') || '').split(';')[0];
    assert.equal((await request('/api/admin/characters', 'POST', INITIAL_CHARACTERS[0])).status, 201);
    assert.equal(writes, 1);
    await request('/api/admin/logout', 'POST', {});
    assert.equal((await request('/api/admin/characters', 'POST', INITIAL_CHARACTERS[0])).status, 401);
    assert.equal(writes, 1);
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});
