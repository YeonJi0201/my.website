# Once Upon a time...

Supabase setup: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md). Existing admin UI and API routes are preserved. Set `ARCHIVE_STORAGE=supabase` to use PostgreSQL; the local file-storage instructions below apply to `ARCHIVE_STORAGE=file`.

호그와트 기반 캐릭터 커뮤니티. 공개 명부와 인물 소개, 관리자 전용 기록 관리 페이지를 제공합니다.

## 로컬 실행

```sh
npm install
npm run admin:setup
npm run dev
```

- 공개 사이트: http://localhost:3000/
- 관리자 로그인: http://localhost:3000/admin
- 생성한 관리자 아이디와 비밀번호: 프로젝트 폴더의 `.admin-access.local.txt`

`admin:setup`은 임의의 비밀번호를 만들고, 서버 설정인 `.env.local`에는 scrypt 해시만 저장합니다. 기존 계정이 있으면 그대로 유지합니다. 접속 정보 파일과 환경 파일은 Git과 개발 서버의 파일 제공 대상에서 제외됩니다.

비밀번호 재설정: `npm run admin:setup -- --reset` 실행 후 서버를 다시 시작하세요. 캐릭터 기록은 유지됩니다.

## 관리자 기능

로그인 후 캐릭터 등록, 프로필 수정(키·몸무게·이미지 크롭 포함), 이미지 교체, 기록 삭제를 사용할 수 있습니다. 공개 페이지에는 관리 기능이 없습니다. 변경 API는 서버가 로그인 세션을 확인하며, 세션은 HttpOnly·SameSite 쿠키로 유지되고 8시간 뒤 만료됩니다. 서버를 재시작하면 다시 로그인해야 합니다.

기록은 `data/characters.json`에 저장되며 모든 방문자가 같은 명부를 읽습니다. 처음에는 예시 캐릭터로 시작합니다. 이전 버전의 브라우저 저장 기록은 로그인 후 표시되는 **기존 브라우저 기록 가져오기**로 옮길 수 있습니다. 가져오기는 같은 ID의 내용을 갱신하고 다른 서버 기록은 유지합니다.

## 빌드와 운영 실행

```sh
npm run build
npm start
```

Node 서버가 화면과 인증 API를 함께 제공합니다. 정적 파일만 배포하면 로그인과 기록 관리는 동작하지 않습니다. 운영 서버에서는 `.env.local` 또는 서버 환경 변수에 `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`를 설정하고, HTTPS에서는 `COOKIE_SECURE=true`를 설정하세요. 이 값에 `VITE_` 접두어를 붙이지 마세요.

`PORT`로 포트(기본 3000), `ARCHIVE_DATA_DIR`로 저장 폴더(기본 `data`)를 바꿀 수 있습니다. 저장 폴더는 영구 디스크에 두고 백업하세요. 현재 파일 저장과 세션은 단일 서버 인스턴스 기준입니다.

## 검사

```sh
npm run lint
npm run test:api
npm run build
```

API 검사는 별도 임시 폴더에서 비로그인 변경 차단, 로그인, 쿠키 속성, 외부 출처 차단, 입력 검증, 등록·수정·삭제·가져오기, 저장, 로그아웃 및 로그인 시도 제한을 확인합니다.
