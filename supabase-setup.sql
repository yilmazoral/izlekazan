-- İzleKazan kalıcı veritabanı tablosu
-- Supabase > SQL Editor > New Query bölümünde çalıştırın.

create table if not exists public.izlekazan_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.izlekazan_state enable row level security;

-- Bu tabloya sadece backend tarafındaki service role / secret key erişmelidir.
-- Tarayıcı tarafına service role key kesinlikle yazılmamalıdır.
