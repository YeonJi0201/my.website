import { createImageStorage } from './server/image-storage.ts';
import { storeFromEnvironment } from './server/store-config.ts';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { createApi } from './server/api.ts';

// 개발·미리보기 서버에 동일한 API 미들웨어를 연결하고 민감 파일의 정적 노출을 차단한다.
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const api = createApi({ username: env.ADMIN_USERNAME || 'admin', passwordHash: env.ADMIN_PASSWORD_HASH || '', dataDirectory: path.resolve(process.cwd(), env.ARCHIVE_DATA_DIR || 'data'), images: env.ARCHIVE_STORAGE !== 'file' && env.SUPABASE_URL && (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY) ? createImageStorage({ url: env.SUPABASE_URL, key: env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY! }) : undefined, secureCookie: env.COOKIE_SECURE === 'true', store: storeFromEnvironment(env, path.resolve(process.cwd(), env.ARCHIVE_DATA_DIR || 'data')) });
  return {
    plugins: [react(), tailwindcss(), {
      name: 'archive-api',
      configureServer(server) { server.middlewares.use((req, res, next) => req.url?.startsWith('/api/') ? api(req as import('express').Request, res as import('express').Response, next) : next()); },
      configurePreviewServer(server) { server.middlewares.use((req, res, next) => req.url?.startsWith('/api/') ? api(req as import('express').Request, res as import('express').Response, next) : next()); },
    }],
    resolve: {
      alias: {
        '@': process.cwd(),
      },
    },
    server: {
      fs: { deny: ['.env', '.env.*', '**/.git/**', '**/.admin-access.local.txt', '**/data/**'] },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
