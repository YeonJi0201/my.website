import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from './api.ts';
import { supabaseAdminLogin } from './supabase-admin-login.ts';
import type { CharacterStore } from './character-store.ts';

const users: Record<string, { id: string; password: string; confirmed: boolean }> = {
  'keeper@example.com': { id: '11111111-1111-4111-8111-111111111111', password: 'test-only-admin-password', confirmed: true },
  'pending@example.com': { id: '22222222-2222-4222-8222-222222222222', password: 'test-only-pending-password', confirmed: false },
};
const supabase = (signupDisabled: boolean, loggedOut: string[] = []): typeof fetch => async (input, init) => {
  const url = new URL(String(input));
  if (url.pathname === '/auth/v1/settings') return Response.json({ disable_signup: signupDisabled });
  if (url.pathname === '/auth/v1/token') {
    const { email, password } = JSON.parse(String(init?.body));
    const user = users[email];
    if (!user || user.password !== password) return Response.json({ error: 'invalid_grant' }, { status: 400 });
    return Response.json({ access_token: `access-${user.id}`, user: { id: user.id, email_confirmed_at: user.confirmed ? '2026-11-16T00:00:00Z' : null } });
  }
  if (url.pathname === '/auth/v1/logout') { loggedOut.push(String((init?.headers as Record<string, string>).Authorization)); return new Response(null, { status: 204 }); }
  return new Response(null, { status: 404 });
};

test('confirmed Supabase Auth users can log in by email and password', async () => {
  const loggedOut: string[] = [];
  const verify = supabaseAdminLogin({ url: 'https://test.supabase.co', key: 'sb_secret_test', fetch: supabase(true, loggedOut) });
  assert.equal(await verify('keeper@example.com', 'test-only-admin-password'), true);
  assert.equal(await verify(' keeper@example.com ', 'test-only-admin-password'), true);
  assert.equal(await verify('keeper@example.com', 'wrong'), false);
  assert.equal(await verify('pending@example.com', 'test-only-pending-password'), false);
  assert.equal(await verify('stranger@example.com', 'anything'), false);
  assert.equal(await verify('not-an-email', 'x'), false);
  assert.ok(loggedOut.includes('Bearer access-11111111-1111-4111-8111-111111111111'));

  const server = createApi({ username: '', passwordHash: '', verifyAdmin: verify, dataDirectory: 'unused', store: { list: async () => [] } as unknown as CharacterStore }).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.on('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const login = (body: unknown) => fetch(base + '/api/admin/login', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.equal((await login({ email: 'stranger@example.com', password: 'anything' })).status, 401);
    const ok = await login({ email: 'keeper@example.com', password: 'test-only-admin-password' });
    assert.equal(ok.status, 200);
    assert.match(ok.headers.get('set-cookie') || '', /once_admin_session=[a-f0-9]{64}/);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('login fails closed while public sign-up is enabled', async () => {
  const verify = supabaseAdminLogin({ url: 'https://test.supabase.co', key: 'sb_secret_test', fetch: supabase(false) });
  await assert.rejects(verify('keeper@example.com', 'test-only-admin-password'), { status: 503 });
});

test('five attempts are allowed, then login is locked for five minutes', async () => {
  const { memoryAdminAuth } = await import('./admin-auth.ts');
  const auth = memoryAdminAuth();
  for (let i = 0; i < 5; i++) assert.equal((await auth.attempt('client')).allowed, true);
  const blocked = await auth.attempt('client');
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfter > 290 && blocked.retryAfter <= 300);
  await auth.reset('client');
  assert.equal((await auth.attempt('client')).allowed, true);
});
