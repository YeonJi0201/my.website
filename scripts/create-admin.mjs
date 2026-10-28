import { randomBytes, scryptSync } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const envFile = path.join(root, '.env.local');
let existing = '';
try { existing = await readFile(envFile, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
if (/^ADMIN_PASSWORD_HASH=.+$/m.test(existing) && !process.argv.includes('--reset')) {
  console.log('관리자 계정이 이미 설정되어 있습니다. 재설정: npm run admin:setup -- --reset');
  process.exit(0);
}
const username = 'admin';
const password = randomBytes(18).toString('base64url');
const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');
const preserved = existing.split(/\r?\n/).filter(line => !/^ADMIN_(USERNAME|PASSWORD_HASH)=/.test(line)).join('\n').trimEnd();
await writeFile(envFile, `${preserved}\nADMIN_USERNAME=${username}\nADMIN_PASSWORD_HASH=${salt}:${hash}\n`, { mode: 0o600 });
const accessFile = path.join(root, '.admin-access.local.txt');
await writeFile(accessFile, `Once Upon a time... 관리자 접속 정보\n\n경로: http://localhost:3000/admin\n아이디: ${username}\n비밀번호: ${password}\n\n이 파일은 공유하거나 배포하지 마세요.\n비밀번호 재설정: npm run admin:setup -- --reset\n재설정 후 서버를 다시 시작해주세요.\n`, { mode: 0o600 });
console.log(`관리자 계정을 생성했습니다. 접속 정보: ${accessFile}`);
