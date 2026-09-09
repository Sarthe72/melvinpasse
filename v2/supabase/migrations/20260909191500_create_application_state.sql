create table if not exists public.application_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  applications jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.application_state enable row level security;

revoke all on table public.application_state from anon, authenticated;
grant select, insert, update, delete on table public.application_state to authenticated;

create policy "application_state_select_own"
on public.application_state for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "application_state_insert_own"
on public.application_state for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "application_state_update_own"
on public.application_state for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "application_state_delete_own"
on public.application_state for delete
to authenticated
using ((select auth.uid()) = user_id);
