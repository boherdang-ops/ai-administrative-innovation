-- Additive migration: originals remain private; only an explicit reviewed projection is public.
begin;
create table public.practice_cases (
 id uuid primary key default gen_random_uuid(),
 submission_id uuid not null unique references public.practice_submissions(id) on delete cascade,
 title text not null check(length(trim(title)) between 1 and 180),
 situation text not null check(length(trim(situation)) between 1 and 2000),
 method text not null check(length(trim(method)) between 1 and 3000),
 result text not null check(length(trim(result)) between 1 and 2000),
 caution text not null check(length(trim(caution)) between 1 and 2000),
 learning_path text not null default '' check(learning_path in ('','report','research','excel')),
 education_note text not null default '' check(length(education_note)<=3000),
 published boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.practice_cases enable row level security;
revoke all on public.practice_cases from anon,authenticated;
grant select,insert,update on public.practice_cases to authenticated;
create policy case_operator_read on public.practice_cases for select to authenticated
 using(exists(select 1 from public.practice_educators where user_id=(select auth.uid())));
create policy case_operator_insert on public.practice_cases for insert to authenticated
 with check(exists(select 1 from public.practice_educators where user_id=(select auth.uid()))
 and exists(select 1 from public.practice_submissions s where s.id=submission_id and s.category='experience' and s.consent));
create policy case_operator_update on public.practice_cases for update to authenticated
 using(exists(select 1 from public.practice_educators where user_id=(select auth.uid())))
 with check(exists(select 1 from public.practice_educators where user_id=(select auth.uid()))
 and (not published or exists(select 1 from public.practice_submissions s where s.id=submission_id and s.category='experience' and s.consent)));
create index practice_cases_published_updated on public.practice_cases(updated_at desc,id) where published;
create schema if not exists practice_private;
revoke all on schema practice_private from public;
grant usage on schema practice_private to anon,authenticated;
-- Narrow read-only boundary: no source ID, author, raw submission, reply, or internal memo.
create function practice_private.case_feed() returns table (
 id uuid,title text,situation text,method text,result text,caution text,learning_path text,updated_at timestamptz
) language sql stable security definer set search_path='' as $$
 select c.id,c.title,c.situation,c.method,c.result,c.caution,c.learning_path,c.updated_at
 from public.practice_cases c join public.practice_submissions s on s.id=c.submission_id
 where c.published and s.consent and s.category='experience'
 order by c.updated_at desc,c.id limit 100
$$;
revoke all on function practice_private.case_feed() from public;
grant execute on function practice_private.case_feed() to anon,authenticated;
create function public.practice_public_cases() returns table (
 id uuid,title text,situation text,method text,result text,caution text,learning_path text,updated_at timestamptz
) language sql stable security invoker set search_path='' as $$select * from practice_private.case_feed()$$;
revoke all on function public.practice_public_cases() from public;
grant execute on function public.practice_public_cases() to anon,authenticated;
commit;
