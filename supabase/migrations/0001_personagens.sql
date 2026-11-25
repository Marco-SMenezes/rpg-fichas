-- Tomo · Etapa 2: fichas na nuvem.
-- Cole no Supabase em SQL Editor > New query > Run. Pode rodar mais de uma vez.

create table if not exists public.personagens (
  id text primary key,
  dono uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dados jsonb not null,
  -- Data da última alteração feita no aparelho (vem da própria ficha).
  atualizado_em timestamptz not null,
  -- Exclusão "suave", para os outros aparelhos também apagarem a ficha.
  excluido boolean not null default false,
  criado_em timestamptz not null default now()
);

create index if not exists personagens_dono_idx on public.personagens (dono);

-- Row Level Security: cada pessoa só enxerga e altera as próprias fichas.
alter table public.personagens enable row level security;

drop policy if exists "ler as próprias fichas" on public.personagens;
create policy "ler as próprias fichas" on public.personagens
  for select to authenticated using (dono = auth.uid());

drop policy if exists "criar as próprias fichas" on public.personagens;
create policy "criar as próprias fichas" on public.personagens
  for insert to authenticated with check (dono = auth.uid());

drop policy if exists "alterar as próprias fichas" on public.personagens;
create policy "alterar as próprias fichas" on public.personagens
  for update to authenticated using (dono = auth.uid()) with check (dono = auth.uid());

drop policy if exists "apagar as próprias fichas" on public.personagens;
create policy "apagar as próprias fichas" on public.personagens
  for delete to authenticated using (dono = auth.uid());
