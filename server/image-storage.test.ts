import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { createImageStorage, IMAGE_BUCKET } from './image-storage.ts';
import { createSupabaseStore } from './supabase-store.ts';
import { INITIAL_CHARACTERS } from '../src/data/initialCharacters.ts';
import { characterErrors } from '../src/utils/character-validation.ts';

test('PNG original preserved byte-for-byte, WebP variants resized with alpha, retries reuse paths', async () => {
  const original = await sharp({ create: { width: 1800, height: 2400, channels: 4, background: { r: 120, g: 60, b: 30, alpha: .5 } } }).png().toBuffer();
  const objects = new Map<string, Buffer>();
  let bucketCreations = 0;
  const storage = createImageStorage({ url: 'https://test.supabase.co', key: 'sb_secret_test', fetch: async (input, init) => {
    const path = new URL(String(input)).pathname;
    if (path === `/storage/v1/bucket/${IMAGE_BUCKET}`) return bucketCreations ? Response.json({ public: true }) : Response.json({}, { status: 404 });
    if (path === '/storage/v1/bucket') { bucketCreations++; assert.equal(JSON.parse(String(init?.body)).public, true); return Response.json({}); }
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('apikey'), 'sb_secret_test');
    assert.match(headers.get('cache-control') || '', /31536000/);
    if (objects.has(path)) return Response.json({ error: 'Duplicate' }, { status: 409 });
    objects.set(path, Buffer.from(init?.body as Uint8Array));
    return Response.json({});
  } });
  const character = { ...INITIAL_CHARACTERS[0], image: `data:image/png;base64,${original.toString('base64')}` };
  const prepared = await storage.prepare(character);
  assert.equal(objects.size, 3);
  assert.equal(bucketCreations, 1);
  assert.deepEqual(objects.get(new URL(prepared.imageOriginal!).pathname.replace('/object/public/', '/object/')), original);
  const profile = await sharp(objects.get(new URL(prepared.image).pathname.replace('/object/public/', '/object/'))!).metadata();
  const thumb = await sharp(objects.get(new URL(prepared.imageThumbnail!).pathname.replace('/object/public/', '/object/'))!).metadata();
  assert.equal(profile.format, 'webp'); assert.equal(profile.width, 1536); assert.equal(profile.height, 2048); assert.equal(profile.hasAlpha, true);
  assert.equal(thumb.width, 960); assert.equal(thumb.height, 1280); assert.equal(thumb.hasAlpha, true);
  assert.deepEqual(characterErrors(prepared), []);
  assert.deepEqual(await storage.prepare(character), prepared);
  assert.equal(objects.size, 3);
  assert.deepEqual(await storage.prepare(prepared), prepared);
});

test('invalid images and foreign storage URLs are rejected before any upload', async () => {
  let calls = 0;
  const storage = createImageStorage({ url: 'https://test.supabase.co', key: 'sb_secret_test', fetch: async () => { calls++; return Response.json({}); } });
  await assert.rejects(storage.prepare({ ...INITIAL_CHARACTERS[0], image: 'data:image/png;base64,aW52YWxpZA==' }), { status: 400 });
  await assert.rejects(storage.prepare({ ...INITIAL_CHARACTERS[0], image: 'https://foreign.supabase.co/storage/v1/object/public/character-images/a/b.png' }), { status: 400 });
  assert.equal(calls, 0);
});

test('Storage upload failure never writes a database row', async () => {
  const png = await sharp({ create: { width: 10, height: 10, channels: 4, background: '#ffffff' } }).png().toBuffer();
  let dbWrites = 0;
  const store = createSupabaseStore({ url: 'https://test.supabase.co', key: 'sb_secret_test', fetch: async (input, init) => {
    const path = new URL(String(input)).pathname;
    if (path.includes('/rest/v1/')) { dbWrites++; return new Response(null, { status: 201 }); }
    if (path.includes('/bucket/')) return Response.json({ public: true });
    return Response.json({}, { status: 403 });
  } });
  await assert.rejects(store.create({ ...INITIAL_CHARACTERS[0], image: `data:image/png;base64,${png.toString('base64')}` }), { status: 503 });
  assert.equal(dbWrites, 0);
});

test('Supabase character records contain URLs instead of image bytes after upload', async () => {
  const png = await sharp({ create: { width: 20, height: 30, channels: 4, background: '#aabbcc' } }).png().toBuffer();
  let saved: { profile: { image: string; imageOriginal: string; imageThumbnail: string } } | undefined;
  const store = createSupabaseStore({ url: 'https://test.supabase.co', key: 'sb_secret_test', fetch: async (input, init) => {
    const path = new URL(String(input)).pathname;
    if (path.includes('/rest/v1/')) { saved = JSON.parse(String(init?.body)); return new Response(null, { status: 201 }); }
    return Response.json({ public: true });
  } });
  await store.create({ ...INITIAL_CHARACTERS[0], image: `data:image/png;base64,${png.toString('base64')}` });
  assert.ok(saved);
  assert.ok(saved.profile.image.endsWith('/profile-v1.webp'));
  assert.ok(saved.profile.imageOriginal.endsWith('/original.png'));
  assert.ok(saved.profile.imageThumbnail.endsWith('/thumbnail-v2.webp'));
  assert.ok(!JSON.stringify(saved).includes('base64'));
});
