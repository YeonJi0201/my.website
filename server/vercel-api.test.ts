import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { IncomingMessage, ServerResponse } from 'node:http';
import handler from '../api/characters.ts';
import { INITIAL_CHARACTERS } from '../src/data/initialCharacters.ts';

test('Vercel public endpoint reports missing config, returns JSON, supports HEAD and rejects writes', async () => {
  const saved = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SECRET_KEY, legacy: process.env.SUPABASE_SERVICE_ROLE_KEY, fetch: globalThis.fetch };
  const request = async (method: string) => {
    const headers = new Map();
    let payload = '';
    const res = { statusCode: 0, setHeader: (key: string, value: string) => headers.set(key, value), end: (value?: string) => { payload = value ?? ''; } };
    await handler({ method } as IncomingMessage, res as unknown as ServerResponse);
    return { status: res.statusCode, headers, payload };
  };
  try {
    delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SECRET_KEY; delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const missing = await request('GET');
    assert.equal(missing.status, 503);
    assert.match(JSON.parse(missing.payload).error, /Vercel 환경 변수/);
    assert.equal((await request('POST')).status, 405);
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_test';
    let count = 0;
    globalThis.fetch = async () => Response.json(count++ % 2 === 0 ? [{ id: INITIAL_CHARACTERS[0].id, profile: INITIAL_CHARACTERS[0] }] : []);
    const result = await request('GET');
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('Content-Type'), 'application/json; charset=utf-8');
    assert.deepEqual(JSON.parse(result.payload), [INITIAL_CHARACTERS[0]]);
    assert.equal((await request('HEAD')).payload, '');
    globalThis.fetch = async () => Response.json({ message: 'private database detail' }, { status: 403 });
    const denied = await request('GET');
    assert.equal(denied.status, 503);
    assert.match(JSON.parse(denied.payload).error, /권한 부족/);
    assert.ok(!denied.payload.includes('private database detail'));
  } finally {
    globalThis.fetch = saved.fetch;
    for (const [name, value] of [['SUPABASE_URL', saved.url], ['SUPABASE_SECRET_KEY', saved.key], ['SUPABASE_SERVICE_ROLE_KEY', saved.legacy]] as const) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});
