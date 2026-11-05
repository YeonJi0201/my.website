import { loadEnv } from 'vite';
import sharp from 'sharp';
import { createSupabaseStore } from '../server/supabase-store.ts';
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const url = env.SUPABASE_URL, key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Supabase 설정 누락');
const records = await createSupabaseStore({ url, key }).list();
for (let i = 0; i < records.length; i++) {
  const record = records[i];
  const summary: Record<string, unknown> = { record: i + 1, crop: record.portraitCrop };
  for (const field of ['image', 'imageThumbnail', 'imageOriginal'] as const) {
    const address = record[field];
    if (!address?.startsWith('https://')) { summary[field] = { remote: false, set: Boolean(address) }; continue; }
    const response = await fetch(address, { signal: AbortSignal.timeout(30_000) });
    const result: Record<string, unknown> = { status: response.status, type: response.headers.get('content-type') };
    if (response.ok && field === 'image') {
      const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
      result.width = metadata.width; result.height = metadata.height; result.alpha = metadata.hasAlpha;
    } else await response.body?.cancel();
    summary[field] = result;
  }
  console.log(JSON.stringify(summary));
}
