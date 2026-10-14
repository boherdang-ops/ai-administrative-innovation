begin;
create table public.practice_feedback (
 submission_id uuid primary key references public.practice_submissions(id) on delete cascade,
 outcome text not null check(outcome in ('resolved','needs_help')),
 note text not null default '' check(length(note)<=2000 and (outcome<>'needs_help' or length(trim(note))>0)),
 answer_updated_at timestamptz not null,
 updated_at timestamptz not null default now()
);
alter table public.practice_feedback enable row level security;
revoke all on public.practice_feedback from anon,authenticated;
grant select on public.practice_feedback to authenticated;
grant insert(submission_id,outcome,note,answer_updated_at),update(submission_id,outcome,note,answer_updated_at) on public.practice_feedback to authenticated;
create policy feedback_read on public.practice_feedback for select to authenticated using(
 exists(select 1 from public.practice_submissions s where s.id=practice_feedback.submission_id
 and (s.owner=(select auth.uid()) or exists(select 1 from public.practice_educators where user_id=(select auth.uid())))));
create policy feedback_insert on public.practice_feedback for insert to authenticated with check(
 exists(select 1 from public.practice_submissions s join public.practice_replies r on r.submission_id=s.id
 where s.id=practice_feedback.submission_id and s.owner=(select auth.uid()) and s.category='request'
 and length(trim(r.answer))>0 and r.updated_at=practice_feedback.answer_updated_at));
create policy feedback_update on public.practice_feedback for update to authenticated
 using(exists(select 1 from public.practice_submissions s where s.id=practice_feedback.submission_id and s.owner=(select auth.uid())))
 with check(exists(select 1 from public.practice_submissions s join public.practice_replies r on r.submission_id=s.id
 where s.id=practice_feedback.submission_id and s.owner=(select auth.uid()) and s.category='request'
 and length(trim(r.answer))>0 and r.updated_at=practice_feedback.answer_updated_at));
create schema if not exists practice_internal;
create function practice_internal.feedback_timestamp() returns trigger language plpgsql security invoker set search_path='' as $$
begin new.updated_at=clock_timestamp();return new;end $$;
revoke all on function practice_internal.feedback_timestamp() from public;
create trigger feedback_timestamp before insert or update on public.practice_feedback for each row execute function practice_internal.feedback_timestamp();
-- Bring old requests back into the operator's recent queue, without changing answers or consent.
create function practice_internal.feedback_touch_request() returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.practice_submissions set updated_at=new.updated_at
 where id=new.submission_id and owner=(select auth.uid()) and category='request';
 return new;
end $$;
revoke all on function practice_internal.feedback_touch_request() from public;
create trigger feedback_touch_request after insert or update on public.practice_feedback for each row execute function practice_internal.feedback_touch_request();
commit;
