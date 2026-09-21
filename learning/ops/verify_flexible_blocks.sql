-- Learning Hub Flexible Content Blocks v1.5.0 검증
-- SELECT 전용. DB 구조/데이터를 변경하지 않습니다.

select
  count(*) as content_count,
  count(*) filter (where jsonb_typeof(coalesce(assets->'blocks','[]'::jsonb)) = 'array') as block_array_compatible,
  sum(jsonb_array_length(coalesce(assets->'blocks','[]'::jsonb))) as total_blocks
from public.learning_contents
where content_code ~ '^(01|02|03|04|05|06)-';

select
  c.content_code,
  b.value->>'section' as section,
  b.value->>'type' as type,
  b.value->>'title' as title,
  b.value->>'url' as url,
  b.value->>'order' as sort_order
from public.learning_contents c
cross join lateral jsonb_array_elements(coalesce(c.assets->'blocks','[]'::jsonb)) b(value)
where c.content_code ~ '^(01|02|03|04|05|06)-'
order by c.content_code, coalesce((b.value->>'order')::int,9999);
