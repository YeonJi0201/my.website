# Vercel에서 공개 명부 배포

Vite의 개발 API 미들웨어와 `npm start`의 Express 서버는 Vercel의 정적 프론트엔드 배포에서 자동 실행되지 않습니다. `api/characters.ts`는 공개 학생 조회만 처리하는 Vercel Function입니다. API가 프론트엔드 HTML로 연결되지 않도록 `/api/*`까지 `/index.html`로 보내는 재작성 규칙을 추가하지 마세요.

## 환경 변수

Vercel 프로젝트 → Settings → Environment Variables에서 다음 값을 설정합니다. 로컬 `.env.local`은 Git에 올라가지 않으므로 Vercel에도 자동 전달되지 않습니다.

| 이름 | 값 |
| --- | --- |
| `SUPABASE_URL` | 로컬에서 사용하는 Supabase 프로젝트 URL |
| `SUPABASE_SECRET_KEY` | 같은 프로젝트의 서버용 Secret key |

운영에는 Production, 미리보기 주소에도 쓰려면 Preview 환경을 선택합니다. 변수명에 `VITE_`를 붙이지 마세요. 서버 키와 관리자 해시는 GitHub나 채팅에 올리지 않습니다.

## 재배포

1. 수정한 `api/characters.ts`, `vercel.json`과 관련 서버 코드를 GitHub 저장소에 반영합니다.
2. Vercel 프로젝트의 Framework Preset은 Vite, Build Command는 `npm run build`, Output Directory는 `dist`로 설정합니다. Root Directory는 이 프로젝트의 `package.json`이 있는 폴더입니다.
3. 환경 변수 저장 후 새 배포를 만듭니다. 기존 배포는 환경 변수를 저장한 것만으로 바뀌지 않습니다.
4. 배포 주소 뒤에 `/api/characters`를 붙여 확인합니다. 정상 응답은 JSON 배열이며, 캐릭터가 없으면 `[]`입니다. HTML이 나오면 함수 배포·라우팅·Deployment Protection을 확인하세요.
5. JSON 오류가 나오면 오류 문구와 Vercel Logs를 확인합니다. 비밀 값 자체는 공유하지 마세요.

알려주신 미리보기 배포 주소는 외부 요청을 Vercel SSO 로그인으로 이동시키고 있습니다. 공개 방문자에게 공유하려면 Production 주소와 Deployment Protection 설정을 확인하세요. 보호 설정 변경은 이 코드가 수행하지 않습니다.

## Vercel 관리자 기능

관리자 로그인·캐릭터 CRUD·20MB PNG 직접 업로드를 추가했습니다. 최초 인증 SQL과 관리자 환경 변수가 필요합니다. [VERCEL_ADMIN.md](./VERCEL_ADMIN.md)에 따라 설정하세요. 이전의 로컬/Node 관리자 화면도 계속 사용할 수 있습니다.
