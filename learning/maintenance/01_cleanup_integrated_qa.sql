-- Learning Hub v0.8.2 · 통합 QA 테스트 데이터 정리
-- 대상: 01-01 생성형 AI, 무엇이 다른가
-- 원래 Seed 상태로 되돌립니다. Track/Content 구조는 변경하지 않습니다.

begin;

update public.learning_contents
set
  summary = '내용은 향후 CMS에서 보완·확장합니다.',
  status = 'draft',
  learning = '{"learn":"","example":"","check":""}'::jsonb,
  assets = '{"prompt":{"title":"","body":""},"template":{"title":"","url":""},"app":{"title":"","url":""}}'::jsonb,
  external_links = '[]'::jsonb,
  flow = '{"prev":"","next":""}'::jsonb,
  published_at = null,
  updated_at = now()
where content_code = '01-01';

-- 통합 QA 문자열이 들어간 테스트 revision만 정리합니다.
delete from public.learning_content_revisions
where content_code = '01-01'
  and snapshot::text like '%[통합QA]%';

commit;
