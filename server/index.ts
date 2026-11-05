import { storeFromEnvironment } from './store-config.ts';
import express from 'express';
import path from 'node:path';
import { loadEnv } from 'vite';
import { createApi } from './api';

// 실행 환경에서 서버 옵션을 읽고 API·빌드 자산·SPA fallback 순으로 운영 앱을 구성한다.
const root = process.cwd();
const env = { ...loadEnv('production', root, ''), ...process.env };
const app = express();
app.disable('x-powered-by');
app.use(createApi({ username: env.ADMIN_USERNAME || 'admin', passwordHash: env.ADMIN_PASSWORD_HASH || '', dataDirectory: path.resolve(root, env.ARCHIVE_DATA_DIR || 'data'), secureCookie: env.COOKIE_SECURE === 'true', store: storeFromEnvironment(env, path.resolve(root, env.ARCHIVE_DATA_DIR || 'data')) }));
app.use(express.static(path.join(root, 'dist'), { dotfiles: 'deny' }));
app.get(/.*/, (_req, res) => { res.sendFile(path.join(root, 'dist/index.html')); });
app.listen(Number(env.PORT || 3000), () => console.log(`Once Upon a time... http://localhost:${env.PORT || 3000}`));
