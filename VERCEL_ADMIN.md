# Vercel 관리자 운영

공개 명부와 관리자 API를 같은 Vercel 프로젝트에서 실행합니다. 관리자 페이지는 `https://운영주소/admin`입니다.

## 최초 설정

1. Supabase SQL Editor에서 `supabase/migrations/202611050002_admin_auth.sql`의 **전체 내용**을 실행합니다. 관리자 세션과 로그인 시도 제한 테이블을 추가하며 기존 캐릭터 데이터는 변경하지 않습니다.
2. Vercel 프로젝트 → Settings → Environment Variables에 다음 값을 저장합니다. Production과 사용하는 Preview 환경에 모두 적용합니다.

| Key | Value |
| --- | --- |
| `SUPABASE_URL` | `.env.local`의 같은 변수에서 `=` 뒤의 값 |
| `SUPABASE_SECRET_KEY` | `.env.local`의 같은 변수에서 `=` 뒤의 값 |
| `ADMIN_USERNAME` | `.env.local`의 관리자 아이디 값 |
| `ADMIN_PASSWORD_HASH` | `.env.local`의 같은 변수에서 `=` 뒤의 긴 문자열 전체 |

`ADMIN_PASSWORD_HASH`에는 평문 비밀번호를 넣지 않습니다. 해시의 `:`도 포함해야 합니다. 따옴표와 변수 이름은 Value에 넣지 마세요. 비밀번호·해시·키를 GitHub나 채팅에 올리지 않습니다. 새 환경 변수에 `VITE_` 접두어를 붙이지 마세요.

3. 최신 커밋을 배포합니다. 기존 배포를 Redeploy하면 그 배포의 예전 코드가 다시 배포될 수 있으므로 최신 소스 커밋인지 확인하세요.
4. Vercel 프로젝트의 고정 Production 도메인으로 접속합니다. 운영 주소를 공유하려면 Deployment Protection도 확인합니다.

## 로그인과 등록 테스트

1. `https://운영주소/api/admin/session`에 접속하면 비로그인 시 `{"authenticated":false}`가 표시되어야 합니다.
2. `https://운영주소/admin`에서 기존 로컬 관리자 아이디·비밀번호로 로그인합니다. 실제 비밀번호는 `.env.local`의 해시가 아니라 `.admin-access.local.txt`에 안내된 값입니다.
3. PNG를 선택하고 테스트 캐릭터를 등록합니다. 저장 완료 후 공개 명부를 새로고침해 확인합니다.
4. 수정·이미지 교체·삭제를 확인한 뒤 로그아웃합니다. 테스트 후에는 테스트 캐릭터만 삭제하세요.

## 구현 방식

- `api/admin.ts` 한 함수가 `/api/admin/*`를 Express로 전달합니다. 공개 조회는 기존 `api/characters.ts`를 사용합니다.
- 관리자 세션은 Supabase에 토큰의 SHA-256 해시와 만료 시간만 저장합니다. 서버 인스턴스가 달라져도 로그인이 유지되며, 로그아웃은 저장된 세션을 삭제합니다. 세션은 8시간 뒤 만료됩니다.
- 로그인 시도 제한은 DB 함수에서 원자적으로 갱신합니다. 같은 접속 주소에서 15분 동안 최대 5회 시도할 수 있습니다. 인증용 테이블과 함수는 서버용 `service_role`만 사용합니다.
- PNG 바이트는 브라우저에서 서명된 임시 URL로 Supabase Storage에 직접 업로드합니다. 서버용 Secret key는 브라우저에 전달하지 않습니다.
- 업로드 완료 요청에는 경로만 전달합니다. 서버가 파일을 읽어 형식·용량·해상도를 검증하고 원본·WebP를 저장한 후 URL만 반환합니다. 이후 캐릭터 저장 요청에는 이미지 바이트가 포함되지 않습니다.
- 20MB PNG도 Vercel 함수의 요청 본문을 통과하지 않습니다. 변환은 Node `sharp`를 사용합니다. 서명 발급·변환·저장 API는 모두 관리자 인증과 같은 출처 검사를 거칩니다.
- 기존 로컬 파일 저장 모드와 로그인 흐름은 유지됩니다. 로컬 Supabase 모드에서는 동일한 직접 업로드 흐름을 사용합니다.

## 문제 해결

- `관리자 환경 변수가 필요합니다`: 네 변수의 이름·값·Production/Preview 적용 범위를 확인하고 최신 소스로 재배포합니다.
- `인증 저장소 설정이 필요합니다`: 위의 인증 SQL을 같은 Supabase 프로젝트에서 실행했는지 확인합니다.
- `로그인 시도가 많습니다`: 15분 후 다시 로그인합니다.
- 로그인 직후 다시 비로그인: 같은 고정 운영 도메인인지 확인합니다. 다른 배포 도메인끼리는 쿠키가 공유되지 않습니다.
- 이미지 업로드 거부: 20MB 이하의 정지 PNG인지, `character-images` 공개 버킷과 서버 키 권한이 올바른지 확인합니다.
- HTTPS 배포에서는 Secure·HttpOnly·SameSite 쿠키를 사용하므로 HTTP 주소로 바꾸지 마세요.

검증 명령:

```sh
npm run lint
npm run test:api
npm run build
node --import tsx scripts/check-hosted-admin.ts
```

마지막 명령은 실제 Supabase에 작은 임시 캐릭터·이미지·세션을 생성해 전체 흐름을 검사한 뒤 이번 검사 데이터만 삭제합니다. 기존 캐릭터는 수정하지 않습니다. 실제 Vercel의 라우팅·환경 변수·쿠키 확인은 배포 후 위의 로그인 테스트를 별도로 수행해야 합니다.
