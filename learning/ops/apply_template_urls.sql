-- Learning Hub Workbook Pack v1.2
-- assets.template의 title/url만 업데이트합니다.

begin;

with template_pack(content_code, template_title, template_url) as (
values
  ('01-01', 'AI 업무 적용 진단표', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/01-01_ai-work-diagnostic.xlsx'),
  ('01-02', 'AI 도구 비교표', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/01-02_ai-tool-comparison.xlsx'),
  ('01-03', 'STC 표준 프롬프트 카드', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/01-03_stc-prompt-card.docx'),
  ('01-04', '공무원 표준 프롬프트 6칸 템플릿', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/01-04_public-prompt-6box.docx'),
  ('01-05', 'AI 결과 검증 체크리스트', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/01-05_ai-result-verification.xlsx'),
  ('01-06', '공공업무 AI 안전점검표', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/01-06_public-ai-safety-check.xlsx'),
  ('02-01', '1쪽 간부보고서 템플릿', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/02-01_one-page-brief.docx'),
  ('02-02', '사업계획서 로직체인 템플릿', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/02-02_project-logic-chain.docx'),
  ('02-03', '보도자료 팩트체크 템플릿', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/02-03_press-release-factcheck.docx'),
  ('02-04', '3단계 간부요약 템플릿', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/02-04_three-level-executive-summary.docx'),
  ('03-01', '정책문제 정의 Canvas', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/03-01_policy-problem-canvas.docx'),
  ('03-02', '원인구조 분석표', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/03-02_cause-analysis.xlsx'),
  ('03-03', '정책사례 벤치마킹 비교표', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/03-03_policy-benchmarking.xlsx'),
  ('03-04', '정책 아이디어 발산 매트릭스', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/03-04_policy-idea-matrix.xlsx'),
  ('03-05', '정책대안 5요소 평가표', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/03-05_policy-alternative-score.xlsx'),
  ('03-06', '정책사업 Logic Model Canvas', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/03-06_logic-model-canvas.docx'),
  ('03-07', '정책기획서 완성 템플릿', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/03-07_policy-proposal.docx'),
  ('04-01', '행정데이터 분석 체크시트', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/04-01_admin-data-analysis-check.xlsx'),
  ('04-02', '데이터→시사점 4단계 템플릿', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/04-02_data-to-insight.xlsx'),
  ('04-03', '1쪽 데이터 보고서 템플릿', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/04-03_one-page-data-report.xlsx'),
  ('05-01', '공공보고 PPT 스토리보드', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/05-01_ppt-storyboard.docx'),
  ('05-02', '행정 홍보 콘텐츠 기획서', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/05-02_public-content-brief.docx'),
  ('06-01', 'AI 업무 적용점 매트릭스', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/06-01_ai-opportunity-matrix.xlsx'),
  ('06-02', 'AI 업무 프로세스 재설계 Canvas', 'https://boherdang-ops.github.io/ai-administrative-innovation/learning/resources/templates/06-02_ai-process-redesign.docx')
)
update public.learning_contents c
set assets = jsonb_set(
               jsonb_set(c.assets, '{template,title}', to_jsonb(t.template_title), true),
               '{template,url}', to_jsonb(t.template_url), true
             ),
    updated_at = now()
from template_pack t
where c.content_code = t.content_code;

commit;
