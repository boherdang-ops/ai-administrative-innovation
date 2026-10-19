-- Existing corporate CMS, courses, learning and practice tables are not modified.
create table public.diagnosis_cms_published (
 id text primary key check(id='main'), content jsonb not null,
 version bigint not null default 1, updated_at timestamptz not null default now());
create table public.diagnosis_cms_drafts (
 id text primary key check(id='main'), content jsonb not null,
 version bigint not null default 1, updated_at timestamptz not null default now());
create table public.diagnosis_cms_revisions (
 id bigint generated always as identity primary key, content jsonb not null,
 kind text not null check(kind in ('draft','publish')), version bigint not null,
 created_at timestamptz not null default now(), created_by uuid default auth.uid());
alter table public.diagnosis_cms_published enable row level security;
alter table public.diagnosis_cms_drafts enable row level security;
alter table public.diagnosis_cms_revisions enable row level security;
grant select on public.diagnosis_cms_published to anon,authenticated;
grant update on public.diagnosis_cms_published to authenticated;
grant select,update on public.diagnosis_cms_drafts to authenticated;
grant select,insert on public.diagnosis_cms_revisions to authenticated;
grant usage on sequence public.diagnosis_cms_revisions_id_seq to authenticated;
create policy diagnosis_public_read on public.diagnosis_cms_published for select to anon,authenticated using(id='main');
create policy diagnosis_public_admin_update on public.diagnosis_cms_published for update to authenticated using((select public.course_catalog_is_admin())) with check((select public.course_catalog_is_admin()));
create policy diagnosis_draft_read on public.diagnosis_cms_drafts for select to authenticated using((select public.course_catalog_is_admin()));
create policy diagnosis_draft_update on public.diagnosis_cms_drafts for update to authenticated using((select public.course_catalog_is_admin())) with check((select public.course_catalog_is_admin()));
create policy diagnosis_revision_read on public.diagnosis_cms_revisions for select to authenticated using((select public.course_catalog_is_admin()));
create policy diagnosis_revision_insert on public.diagnosis_cms_revisions for insert to authenticated with check((select public.course_catalog_is_admin()) and created_by=auth.uid());

-- Trigger enforces structure even for direct REST writes and records every save.
create function public.diagnosis_cms_guard() returns trigger language plpgsql security invoker set search_path='' as $$
declare a jsonb; b jsonb; i integer;
begin
 if not public.course_catalog_is_admin() then raise exception '관리자 권한이 필요합니다' using errcode='42501'; end if;
 if new.id<>old.id or new.version<>old.version+1 then raise exception '콘텐츠 버전 충돌: 새로 불러온 뒤 저장하세요'; end if;
 if new.content->>'schemaVersion'<>'1' or pg_column_size(new.content)>1500000
 or jsonb_typeof(new.content->'site')<>'object' or jsonb_typeof(new.content->'copy')<>'object'
 or jsonb_typeof(new.content->'domains')<>'object' or jsonb_typeof(new.content->'advice')<>'object'
 then raise exception '콘텐츠 형식 오류'; end if;
 a=(old.content#>'{definition,personal}')||(old.content#>'{definition,organization}');
 b=(new.content#>'{definition,personal}')||(new.content#>'{definition,organization}');
 if jsonb_array_length(old.content#>'{definition,courses}')<>jsonb_array_length(new.content#>'{definition,courses}') then raise exception '과정 구조 변경 불가'; end if;
 for i in 0..4 loop
  if old.content#>>array['definition','courses',i::text,'id'] is distinct from new.content#>>array['definition','courses',i::text,'id'] then raise exception '과정 ID 변경 불가';end if;
  a=a||(old.content#>array['definition','courses',i::text,'requirements']);
  b=b||(new.content#>array['definition','courses',i::text,'requirements']);
 end loop;
 if jsonb_array_length(a)<>47 or jsonb_array_length(b)<>47 then raise exception '문항 수 변경 불가'; end if;
 for i in 0..46 loop
  if (a->i)-array['text','version','options','purpose','criteria','hint','topic','task','doneWhen','owner','evidence','action','source','effect','unknown','operatorNote'] is distinct from (b->i)-array['text','version','options','purpose','criteria','hint','topic','task','doneWhen','owner','evidence','action','source','effect','unknown','operatorNote']
  or (select jsonb_agg(x->0 order by n) from jsonb_array_elements(a->i->'options') with ordinality t(x,n)) is distinct from (select jsonb_agg(x->0 order by n) from jsonb_array_elements(b->i->'options') with ordinality t(x,n)) then raise exception '문항 ID·응답 의미·판정 구조 변경 불가';end if;
 end loop;
 new.updated_at=now();
 insert into public.diagnosis_cms_revisions(content,kind,version) values(new.content,case when tg_table_name='diagnosis_cms_published' then 'publish' else 'draft' end,new.version);
 return new;
end $$;
create trigger diagnosis_guard_draft before update on public.diagnosis_cms_drafts for each row execute function public.diagnosis_cms_guard();
create trigger diagnosis_guard_public before update on public.diagnosis_cms_published for each row execute function public.diagnosis_cms_guard();

create function public.diagnosis_cms_save(payload jsonb,expected_version bigint) returns jsonb language plpgsql security invoker set search_path='' as $$
declare d public.diagnosis_cms_drafts;
begin
 if not public.course_catalog_is_admin() then raise exception '관리자 권한이 필요합니다' using errcode='42501'; end if;
 select * into d from public.diagnosis_cms_drafts where id='main' for update;
 if d.version is distinct from expected_version then raise exception '다른 창에서 변경되었습니다. 백업 후 다시 불러오세요.' using errcode='40001';end if;
 update public.diagnosis_cms_drafts set content=payload,version=version+1 where id='main' returning * into d;
 return jsonb_build_object('version',d.version,'updated_at',d.updated_at);
end $$;
create function public.diagnosis_cms_publish(expected_version bigint,expected_published_version bigint) returns jsonb language plpgsql security invoker set search_path='' as $$
declare d public.diagnosis_cms_drafts;p public.diagnosis_cms_published;
begin
 if not public.course_catalog_is_admin() then raise exception '관리자 권한이 필요합니다' using errcode='42501';end if;
 select * into d from public.diagnosis_cms_drafts where id='main' for update;
 select * into p from public.diagnosis_cms_published where id='main' for update;
 if d.version is distinct from expected_version or p.version is distinct from expected_published_version then raise exception '다른 창에서 변경되었습니다. 다시 불러오세요.' using errcode='40001';end if;
 update public.diagnosis_cms_published set content=d.content,version=version+1 where id='main' returning * into p;
 return jsonb_build_object('version',p.version,'updated_at',p.updated_at);
end $$;
revoke all on function public.diagnosis_cms_guard() from public,anon;
revoke all on function public.diagnosis_cms_save(jsonb,bigint) from public,anon;
revoke all on function public.diagnosis_cms_publish(bigint,bigint) from public,anon;
grant execute on function public.diagnosis_cms_guard() to authenticated;
grant execute on function public.diagnosis_cms_save(jsonb,bigint) to authenticated;
grant execute on function public.diagnosis_cms_publish(bigint,bigint) to authenticated;

-- Explicit grants override project default privileges.
revoke all on public.diagnosis_cms_drafts,public.diagnosis_cms_revisions,public.diagnosis_cms_published from anon,authenticated;
revoke all on sequence public.diagnosis_cms_revisions_id_seq from anon,authenticated;
grant select on public.diagnosis_cms_published to anon,authenticated;
grant update on public.diagnosis_cms_published to authenticated;
grant select,update on public.diagnosis_cms_drafts to authenticated;
grant select,insert on public.diagnosis_cms_revisions to authenticated;
grant usage on sequence public.diagnosis_cms_revisions_id_seq to authenticated;
