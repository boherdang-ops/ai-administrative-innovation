# AI 행정혁신 연구원 홈페이지 CMS v10

v9를 기반으로 실제 온라인 운영을 위한 서버측 Draft/Revision 구조를 추가한 버전입니다.

## v10 핵심
- Supabase `site_state`에 공개본과 임시저장본을 함께 저장
- Supabase `site_revisions`에 공개 직전 공개본을 서버측 버전으로 보관
- 관리자 로그인 후 임시저장/공개/변경이력 기능을 클라우드 기준으로 사용
- 서버 변경이력에서 이전 버전을 작업본으로 복구 가능
- 기존 LocalStorage fallback 유지
- 기존 홈페이지 직접 편집, 이미지 Storage, 관리자 대시보드 유지

## Supabase 적용
1. Supabase 프로젝트 생성
2. `supabase-schema.sql` 전체 실행
3. Supabase Auth에서 관리자 사용자를 생성
4. 관리자 페이지의 `클라우드 운영`에 Project URL과 anon public key 입력
5. 관리자 이메일/비밀번호로 로그인
6. `공개본 불러오기`로 연결 확인

`service_role` 키는 브라우저에 넣지 마세요.

## 중요한 보안 참고
현재 스키마는 `authenticated` 사용자를 관리자 역할로 취급하는 단순한 운영형 프로토타입 정책입니다. 실제 외부 공개 운영에서는 별도의 관리자 allowlist/role 테이블과 정책으로 제한하는 것을 권장합니다.


## v11 보안 설정

v11은 CMS 쓰기 권한을 `cms_admins` 허용목록으로 제한합니다. Supabase Auth에서 관리자 사용자를 만든 뒤 SQL Editor에서 다음처럼 이메일을 등록하세요.

```sql
insert into public.cms_admins(email) values ('관리자이메일@example.com')
on conflict (email) do nothing;
```

이후 그 이메일로 로그인한 사용자만 콘텐츠/Revision/Storage를 변경할 수 있습니다. 방문자 홈페이지는 계속 공개된 published 데이터만 읽습니다.

`service_role` 키는 절대 브라우저 코드에 넣지 마세요. 브라우저에는 Supabase URL과 anon/publishable key만 사용합니다.
