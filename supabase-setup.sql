create table if not exists public.izlekazan_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.izlekazan_state enable row level security;

drop policy if exists "service_role_full_access" on public.izlekazan_state;
create policy "service_role_full_access"
on public.izlekazan_state
for all
to service_role
using (true)
with check (true);
