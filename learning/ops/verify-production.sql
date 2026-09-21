-- Learning Hub v0.9.0 production baseline verification (read-only)
select
  (select count(*) from public.learning_tracks) as track_count,
  (select count(*) from public.learning_contents) as content_count,
  (select count(*) from public.learning_contents where status='public') as public_count,
  (select count(*) from public.learning_content_revisions) as revision_count;

select
  count(*) filter (where c.track_code is null) as orphan_contents,
  count(*) filter (where c.content_code = c.flow->>'prev' or c.content_code = c.flow->>'next') as self_links
from public.learning_contents c;

select content_code,title,status,updated_at
from public.learning_contents
order by content_code;
