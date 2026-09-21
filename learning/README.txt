Learning Hub Flexible Content Blocks v1.5.0

목적
- 공개 학습페이지의 빈 TEXT / EXAMPLE placeholder를 조건부로 완전히 숨깁니다.
- 실제 데이터가 있을 때만 학습자료 카드/블록을 표시합니다.
- 관리자가 콘텐츠별로 확장자료를 자유롭게 추가/수정/정렬/삭제할 수 있습니다.

지원 자료 유형 (10종)
TEXT, IMAGE, VIDEO, LINK, FILE, APP, NOTICE, CHECKLIST, TABLE, PROMPT

표시 영역 (4개)
LEARN, UNDERSTAND, PRACTICE, REVIEW

핵심 설계
- 기존 learning_contents.assets JSONB 안에 `blocks` 배열을 추가합니다.
- 새 테이블/컬럼/RLS/Storage 정책 변경이 없습니다.
- 기존 prompt/template/app 및 external_links는 그대로 유지합니다.
- 기존 콘텐츠에 blocks가 없어도 완전 호환됩니다.

관리자 사용
1. CMS > 학습자산 > 확장 자료 > + 자료 추가
2. 표시 영역과 자료 유형 선택
3. 제목 + 필요한 내용/URL 입력
4. IMAGE/FILE은 파일 업로드 버튼으로 기존 site-assets/learning/{contentId}/ 경로 사용 가능
5. ↑ ↓ 버튼으로 순서 조정
6. 삭제 버튼으로 블록 연결 삭제
7. 변경사항 임시 저장(공개상태이면 게시) 실행

공개페이지 표시 원칙
- 블록에 유효한 실제 데이터가 없으면 아무 박스도 만들지 않습니다.
- LEARN/UNDERSTAND의 기존 빈 placeholder는 제거되었습니다.
- PRACTICE의 기존 Prompt/Template/App, REVIEW의 기존 외부자료는 실제 데이터가 있을 때 계속 표시됩니다.
- 확장블록은 해당 섹션의 기존 자료 아래에 순서대로 표시됩니다.

TABLE 입력
첫 줄을 헤더로 사용합니다.
열은 | 또는 탭으로 구분합니다.
예:
항목|확인
문제정의|완료
원인분석|확인

CHECKLIST 입력
한 줄에 한 항목을 입력합니다.

VIDEO
- YouTube 링크: 안전한 youtube-nocookie 임베드
- 직접 mp4/webm/ogg URL: HTML5 video
- 그 외 URL: 영상 열기 링크

보안
- raw HTML/JavaScript 입력 기능을 제공하지 않습니다.
- 공개 URL은 http/https만 허용합니다.
- 파일은 기존 관리자 인증과 site-assets 정책을 그대로 사용합니다.

배포
GitHub `/learning/` 폴더에서 이 패키지 안의 파일/폴더 구조 그대로 업로드하여 동일 파일을 교체합니다.
DB SQL migration은 필요 없습니다.

권장 검증
A. 기존 03-01 공개페이지: LEARN/UNDERSTAND 빈 박스가 사라졌는지 확인
B. CMS 03-01 > 학습자산 > 확장자료
   - LEARN / NOTICE 추가
   - UNDERSTAND / IMAGE 추가
   - PRACTICE / CHECKLIST 추가
   - REVIEW / TABLE 추가
   - 순서 ↑↓ 확인
   - 저장/게시
C. 공개 03-01에서 4개 자료가 해당 섹션에만 표시되는지 확인
D. 블록 하나 삭제 후 공개화면에서 사라지는지 확인
E. ops/verify_flexible_blocks.sql 실행

롤백
배포 전 GitHub 커밋 또는 기존 v0.9.0 Production Baseline으로 파일만 되돌리면 됩니다.
blocks 데이터는 JSONB에 남아 있어도 구버전은 이를 무시하므로 기존 기능에 영향을 주지 않습니다.
