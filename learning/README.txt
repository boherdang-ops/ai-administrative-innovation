Learning Hub Workbook / Template Pack v1.2
기준일: 2026-09-21

구성
- 개별 편집용 워크시트 24개: DOCX 12개 + XLSX 12개
- 인쇄/교육용 통합 PDF: LearningHub_24_Workbook.pdf (24개 워크시트)
- MANIFEST.csv
- ops/apply_template_urls.sql
- ops/verify_template_urls.sql

GitHub 배포
1. 이 패키지의 resources 폴더를 GitHub /learning/ 아래에 업로드합니다.
2. 최종 경로는 /learning/resources/templates/*.docx 또는 *.xlsx, /learning/resources/workbooks/LearningHub_24_Workbook.pdf 입니다.
3. 업로드 완료 후 Supabase SQL Editor에서 ops/apply_template_urls.sql을 실행합니다.
4. ops/verify_template_urls.sql 실행 결과 content_count=24, template_url_filled=24인지 확인합니다.
5. CMS Ctrl+F5 후 01-01, 02-01, 03-05, 05-01, 06-02를 샘플 확인합니다.

주의
- SQL은 assets.template.title/url만 수정합니다.
- Prompt, App, 외부자료, 본문, 공개상태, RLS, Auth, Storage는 변경하지 않습니다.
