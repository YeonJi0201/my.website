import express from 'express';
import path from 'node:path';
import { loadEnv } from 'vite';
import { createApi } from './api';

const root = process.cwd();
const env = { ...loadEnv('production', root, ''), ...process.env };
const app = express();
app.disable('x-powered-by');
app.use(createApi({ username: env.ADMIN_USERNAME || 'admin', passwordHash: env.ADMIN_PASSWORD_HASH || '', dataDirectory: path.resolve(root, env.ARCHIVE_DATA_DIR || 'data'), secureCookie: env.COOKIE_SECURE === 'true' }));
app.use(express.static(path.join(root, 'dist'), { dotfiles: 'deny' }));
app.get(/.*/, (_req, res) => { res.sendFile(path.join(root, 'dist/index.html')); });
app.listen(Number(env.PORT || 3000), () => console.log(`Once Upon a time... http://localhost:${env.PORT || 3000}`));
