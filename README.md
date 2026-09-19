# Park Sang-deuk V12 CMS — Supabase 운영형

## 이번 버전
- 방문자 사이트는 Supabase의 `site_published`만 읽습니다.
- `/admin/`은 Supabase Auth 로그인 + `cms_admins` 허용목록을 통과해야 합니다.
- 초안은 `site_drafts`, 공개본은 `site_published`에 분리 저장됩니다.
- 사진은 `site-assets` Storage에 업로드되고 URL만 콘텐츠 데이터에 저장됩니다.
- 공개할 때 이전 공개본을 `site_revisions`에 자동 보관합니다.
- 버전관리 화면에서 이전 공개본을 초안으로 복원할 수 있습니다.
- Supabase 미설정 시 방문자 사이트는 기존 로컬/기본 데이터로 폴백합니다.

## 최초 설정
1. Supabase 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase-schema.sql` 전체를 실행합니다.
3. Authentication > Users에서 관리자 계정을 만듭니다.
4. SQL Editor에서 아래처럼 관리자 이메일을 등록합니다.
   `insert into public.cms_admins(email) values ('YOUR_EMAIL');`
5. `/admin/` 접속 후 Supabase Project URL, anon public key, 이메일, 비밀번호로 로그인합니다.
6. 기존 기본 데이터를 검토한 뒤 `임시저장` → `미리보기` → `공개` 순서로 운영합니다.

## 보안 원칙
- 브라우저에는 **anon public key만** 사용합니다.
- service_role key는 절대 HTML/JS에 넣지 않습니다.
- 초안 테이블은 익명 사용자에게 공개되지 않습니다.
- 공개 사이트는 `site_published`만 읽습니다.

## GitHub Pages
전체 폴더를 저장소 루트에 업로드하면 됩니다. Supabase URL/key는 관리자 로그인 화면에서 브라우저에 저장할 수 있으므로 소스에 직접 넣지 않아도 됩니다.
