select
  count(*) as content_count,
  count(*) filter (where coalesce(assets #>> '{template,url}','') <> '') as template_url_filled
from public.learning_contents
where content_code ~ '^(01|02|03|04|05|06)-';

select content_code, title, assets #>> '{template,title}' as template_title, assets #>> '{template,url}' as template_url
from public.learning_contents
where content_code ~ '^(01|02|03|04|05|06)-'
order by content_code;
