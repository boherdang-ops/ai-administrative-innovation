# AI 행정혁신 연구원 홈페이지 CMS v12

v11의 임시저장 → 미리보기 → 공개 3단계 구조를 걷어내고, **저장 즉시 공개**되는 1인 운영 구조로 단순화한 버전입니다.

## v12 핵심
- 관리자 버튼을 `[저장 및 즉시 반영]` 하나로 통합 (임시저장·공개·미리보기 분리 폐지)
- 저장할 때마다 직전 상태를 로컬 `백업 이력`에 최근 20건 보관, 언제든 롤백 가능
- 로그인 상태면 저장과 동시에 Supabase에 자동 동기화, 실패 시 상태창에 경고 표시
- 클라우드 패널에 `서버 백업 이력` 추가 (Supabase 공개본 조회·복구)
- 관리자 초기 데이터를 `data/site-default.json`에서 직접 읽도록 변경
  (하드코딩 기본값과 어긋나 저장 시 옛 내용으로 되돌아가던 문제 해결)
- 실적 수치 자리에 문장이 들어가도 레이아웃이 깨지지 않도록 자동 축소(`.n.is-text`)
- 기존 LocalStorage fallback, 홈페이지 직접 편집, 이미지 Storage, 대시보드 유지

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
