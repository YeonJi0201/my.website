# Supabase 최초 설정

프론트엔드와 관리자 화면은 기존 것을 사용합니다. 브라우저 → Express API → Supabase PostgreSQL 순서로 동작합니다. 관리자 인증은 기존 서버 로그인과 HttpOnly 쿠키를 사용하며, Supabase Auth의 회원가입은 필요하지 않습니다.

## 1. 프로젝트 만들기

1. https://supabase.com/dashboard 에서 로그인합니다.
2. **New project**로 프로젝트를 만듭니다. 조직과 프로젝트 이름을 선택하고 DB 비밀번호를 설정합니다. DB 비밀번호는 개인 비밀번호 관리자 등에 보관하세요. 이 앱의 환경 변수에는 DB 비밀번호가 필요하지 않습니다.
3. 프로젝트 생성이 끝나면 **Connect** 또는 프로젝트 설정에서 프로젝트 URL을 확인합니다. `https://프로젝트ID.supabase.co` 형식의 기본 URL을 사용합니다.
4. **Settings → API Keys**에서 서버용 **Secret key**를 확인하거나 만듭니다. `sb_secret_`으로 시작하는 키를 사용하세요. 이 키는 채팅이나 GitHub에 올리지 않습니다.

화면 위치는 Supabase 대시보드 변경에 따라 달라질 수 있습니다. 공식 키 안내: https://supabase.com/docs/guides/getting-started/api-keys

## 2. 테이블 만들기

프로젝트의 **SQL Editor → New query**에서 다음 파일의 내용을 붙여 넣고 실행합니다.

`supabase/migrations/202611050001_characters.sql`

이 SQL은 `public.characters` 테이블, 수정 시간 트리거, 인덱스를 만듭니다. RLS를 활성화하고 `anon`과 `authenticated`의 직접 접근을 차단합니다. 서버 전용 `service_role`만 읽기와 쓰기가 가능합니다. Supabase Auth에 가입했다는 이유만으로 관리자가 되지 않습니다.

프로필은 기존 `Character` 구조를 보존한 JSONB로 저장하며 캐릭터 ID가 기본 키입니다. 이미지와 크롭 정보도 기존 형식 그대로 저장합니다. 이번 구현은 이미지 파일을 별도 Supabase Storage 버킷으로 옮기지 않습니다.

## 3. 로컬 연결 설정

기존 `.env.local`에 다음 항목을 추가하거나 갱신합니다. 기존 `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`는 보존하세요.

```dotenv
ARCHIVE_STORAGE=supabase
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
```

`VITE_` 접두어를 붙이지 마세요. 프론트엔드에는 Supabase 키가 필요하지 않습니다. 예전 프로젝트의 `service_role` JWT 키가 있다면 `SUPABASE_SERVICE_ROLE_KEY`도 지원합니다. 두 키를 동시에 설정하면 `SUPABASE_SECRET_KEY`를 우선합니다.

`ARCHIVE_STORAGE=file`이면 기존 로컬 파일 저장을 사용합니다. 저장소 설정을 생략하고 Supabase 연결값만 넣으면 Supabase를 선택합니다. URL이나 키가 일부만 설정되면 서버 시작 시 실패하며, Supabase 오류가 나더라도 로컬 저장으로 자동 전환하지 않습니다.

관리자 계정이 아직 없다면:

```sh
npm run admin:setup
```

접속 정보는 Git에서 제외된 `.admin-access.local.txt`에 생성됩니다. 계정이 이미 있으면 유지됩니다.

## 4. 연결 확인과 기존 기록 이전

프로젝트 루트에서 실행합니다. `db:check`는 조회만 합니다.

```sh
npm run db:check
```

빈 DB는 캐릭터 0개를 반환합니다. 예시 인물을 자동으로 넣지 않으므로 모든 인물을 삭제한 후에도 예시 인물이 되살아나지 않습니다.

기존 `data/characters.json`이 있다면 먼저 검증합니다.

```sh
npm run db:migrate
```

검증이 성공하고 같은 ID의 원격 기록을 갱신해도 되는 경우에만 실제 이전을 실행합니다.

```sh
node --import tsx scripts/migrate-supabase.ts --apply
```

로컬 기록 파일이 없고 예시 인물을 넣고 싶다면:

```sh
node --import tsx scripts/migrate-supabase.ts --seed
node --import tsx scripts/migrate-supabase.ts --seed --apply
```

`--apply`가 없으면 DB를 변경하지 않습니다. 이전은 같은 ID를 갱신하고 다른 원격 기록은 보존합니다. 원본 로컬 파일도 유지합니다. `--seed`는 기존 로컬 기록 대신 예시 인물을 사용하므로 운영 기록 이전 시에는 붙이지 마세요.

이전 브라우저 localStorage 기록은 기존 `/admin` 화면의 **기존 브라우저 기록 가져오기**로 옮길 수 있습니다.

## 5. 실행 및 확인

```sh
npm run dev
```

서버를 이미 실행 중이라면 환경 변수 적용을 위해 재시작합니다.

- `/admin`에서 기존 관리자 계정으로 로그인합니다.
- 캐릭터를 등록하고 공개 명부에서 조회합니다.
- 이름·이미지·크롭을 수정한 후 새로고침해 확인합니다.
- 테스트 캐릭터를 삭제하고 명부에서도 사라졌는지 확인합니다.
- 로그아웃한 상태에서는 관리자 변경 API가 `401`을 반환해야 합니다.

## 운영 배포

```sh
npm run build
npm start
```

Node 서버가 실행되는 호스팅을 사용해야 합니다. GitHub 저장소에 푸시하거나 정적 GitHub Pages만 켜는 것으로 API가 실행되지는 않습니다. 호스팅 환경 변수에도 Supabase URL·서버 키와 관리자 설정을 넣고, HTTPS에서는 `COOKIE_SECURE=true`를 사용합니다. 세션과 로그인 시도 제한은 아직 서버 메모리에 있어 단일 인스턴스 기준이며 재시작 시 다시 로그인합니다.

## 문제 확인

- 연결 설정 누락: `.env.local`의 변수 이름과 서버 재시작 여부를 확인합니다.
- `Supabase 저장소에 접근하지 못했습니다`: 프로젝트 실행 상태, URL, secret 키, SQL 적용 여부와 Data API 활성화를 확인합니다. publishable/anon 키를 서버 키 대신 사용하지 마세요.
- 최초 명부가 비어 있음: 빈 DB는 정상입니다. 관리자에서 캐릭터를 등록하거나 명시적으로 기록을 이전하세요.
- 다른 기기에서 보이지 않음: 같은 Supabase 프로젝트를 바라보는 서버에 접속했는지 확인합니다.

테스트는 `npm run test:api`, 타입 검사는 `npm run lint`로 실행합니다. Supabase 어댑터의 자동 테스트는 모의 HTTP 응답을 사용하므로 실제 프로젝트 연결 검증은 `npm run db:check`로 별도로 수행합니다.
