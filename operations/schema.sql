create table public.operations_items (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id),
 kind text not null check (kind in ('task','course','asset','change')),
 title text not null check (length(trim(title)) between 1 and 200),
 scope text not null default 'corporate' check (scope in ('corporate','personal')),
 status text not null default 'draft' check (status in ('draft','working','review','ready','done','blocked','archived')),
 data jsonb not null default '{}'::jsonb check (jsonb_typeof(data)='object' and octet_length(data::text)<=100000),
 version integer not null default 1 check (version>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index operations_items_owner_updated on public.operations_items(owner_id,updated_at desc);
alter table public.operations_items enable row level security;
revoke all on public.operations_items from anon, authenticated;
grant select,insert,update on public.operations_items to authenticated;
create policy operations_read on public.operations_items for select to authenticated
 using (owner_id=(select auth.uid()) and exists(select 1 from public.cms_admins where lower(email)=lower((select auth.jwt()->>'email'))));
create policy operations_insert on public.operations_items for insert to authenticated
 with check (owner_id=(select auth.uid()) and exists(select 1 from public.cms_admins where lower(email)=lower((select auth.jwt()->>'email'))));
create policy operations_update on public.operations_items for update to authenticated
 using (owner_id=(select auth.uid()) and exists(select 1 from public.cms_admins where lower(email)=lower((select auth.jwt()->>'email'))))
 with check (owner_id=(select auth.uid()) and exists(select 1 from public.cms_admins where lower(email)=lower((select auth.jwt()->>'email'))));
create function public.operations_version_guard() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  if new.owner_id<>old.owner_id or new.id<>old.id or new.version<>old.version+1 then
   raise exception 'Invalid owner or revision';
  end if;
  new.created_at:=old.created_at;
 else
  new.version:=1;
  new.created_at:=now();
 end if;
 new.updated_at:=now();
 return new;
end; $$;
revoke all on function public.operations_version_guard() from public,anon,authenticated;
create trigger operations_version_guard before insert or update on public.operations_items
 for each row execute function public.operations_version_guard();