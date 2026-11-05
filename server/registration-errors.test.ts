import { MAX_IMAGE_DATA_URL_LENGTH } from '../src/utils/image-limits.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { characterErrors } from '../src/utils/character-validation.ts';
import { INITIAL_CHARACTERS } from '../src/data/initialCharacters.ts';
import { createSupabaseStore } from './supabase-store.ts';
import { createApi } from './api.ts';
import { storeError, type CharacterStore } from './character-store.ts';

test('registration errors identify invalid fields, file formats and array entries', () => {
  const character = INITIAL_CHARACTERS[0];
  assert.deepEqual(characterErrors(character), []);
  assert.deepEqual(characterErrors({ ...character, image: `data:image/png;base64,${'a'.repeat(8_000_000)}` }), []);
  const errors = characterErrors({ ...character, age: 201, nameKo: ' ', image: 'data:image/gif;base64,R0lGODlh', personality: ['a'.repeat(5001)] });
  assert.ok(errors.some(message => message.includes('나이')));
  assert.ok(errors.some(message => message.includes('한글 이름')));
  assert.ok(errors.some(message => message.includes('PNG')));
  assert.ok(errors.some(message => message.includes('성격 키워드')));
  assert.ok(characterErrors({ ...character, image: `data:image/png;base64,${'a'.repeat(MAX_IMAGE_DATA_URL_LENGTH)}` }).some(message => message.includes('너무 큽니다')));
});

test('database error categories produce actionable messages without raw server details', async () => {
  for (const [status, code, expected] of [[401, '', '인증 실패'], [403, '42501', '권한 부족'], [404, 'PGRST205', '테이블을 찾지'], [400, 'PGRST204', '테이블 구조'], [400, '23514', '저장 조건']] as const) {
    const store = createSupabaseStore({ url: 'https://test.supabase.co', key: 'sb_secret_test', fetch: async () => Response.json({ code, message: 'private internal detail' }, { status }) });
    await assert.rejects(store.list(), (error: Error) => error.message.includes(expected) && !error.message.includes('private internal detail'));
  }
});

test('API exposes controlled store diagnostics but hides unexpected internal errors', async () => {
  let controlled = true;
  const store = { list: async () => { throw controlled ? storeError(503, 'Supabase 권한 부족: 설정을 확인해주세요.') : new Error('private-secret-detail'); } } as unknown as CharacterStore;
  const server = createApi({ username: '', passwordHash: '', dataDirectory: 'unused', store }).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.on('listening', resolve));
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/characters`;
  try {
    const response = await fetch(url);
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /Supabase 권한 부족/);
    controlled = false;
    const unexpected = await fetch(url);
    assert.equal(unexpected.status, 500);
    assert.ok(!(await unexpected.json()).error.includes('private-secret-detail'));
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});
