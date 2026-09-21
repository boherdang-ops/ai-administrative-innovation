-- Learning Hub v0.8.2 · 운영 상태 최종 확인
select
  (select count(*) from public.learning_tracks) as track_count,
  (select count(*) from public.learning_contents) as content_count,
  c.content_code,
  c.status,
  c.published_at,
  c.summary,
  c.learning,
  c.assets,
  c.external_links,
  c.flow
from public.learning_contents c
where c.content_code = '01-01';
