-- Tomo · Etapa 3: campanhas.
-- Rode depois do 0001. Cole no Supabase em SQL Editor > New query > Run. Pode rodar mais de uma vez.
--
-- O mestre cria a campanha e compartilha o código. O jogador entra pelo código,
-- escolhe qual ficha dele participa, e o mestre passa a ver essa ficha (só leitura).
-- Rolagens feitas na ficha vinculada aparecem ao vivo para a mesa.

create extension if not exists pgcrypto;

-- Código de convite: 6 letras/números sem os que confundem (0/O, 1/I/L).
create or replace function public.gerar_codigo_campanha() returns text
language sql volatile set search_path = '' as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, 6)
$$;

create table if not exists public.campanhas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 1 and 80),
  mestre uuid not null default auth.uid() references auth.users (id) on delete cascade,
  codigo text not null unique default public.gerar_codigo_campanha(),
  -- Anotações do mestre que toda a mesa lê.
  notas text not null default '',
  criado_em timestamptz not null default now()
);
create index if not exists campanhas_mestre_idx on public.campanhas (mestre);

create table if not exists public.membros (
  campanha_id uuid not null references public.campanhas (id) on delete cascade,
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  apelido text not null default '' check (char_length(apelido) <= 40),
  personagem_id text references public.personagens (id) on delete set null,
  entrou_em timestamptz not null default now(),
  primary key (campanha_id, usuario)
);
create index if not exists membros_usuario_idx on public.membros (usuario);
create index if not exists membros_personagem_idx on public.membros (personagem_id);

create table if not exists public.rolagens (
  id bigint generated always as identity primary key,
  campanha_id uuid not null references public.campanhas (id) on delete cascade,
  autor uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Nome mostrado (personagem ou apelido) e o que foi rolado.
  quem text not null check (char_length(quem) <= 80),
  rotulo text not null default '' check (char_length(rotulo) <= 120),
  expressao text not null check (char_length(expressao) <= 60),
  total int not null,
  -- Dados individuais, modo (vantagem…) e crítico, para mostrar o detalhe.
  detalhe jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists rolagens_campanha_idx on public.rolagens (campanha_id, criado_em desc);

-- Funções auxiliares. "security definer" evita que as regras de uma tabela
-- consultem outra tabela com RLS e entrem em laço.
create or replace function public.eh_mestre(c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.campanhas where id = c and mestre = auth.uid())
$$;

create or replace function public.eh_da_mesa(c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.eh_mestre(c)
      or exists (select 1 from public.membros where campanha_id = c and usuario = auth.uid())
$$;

create or replace function public.mestre_ve_personagem(p text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.membros m join public.campanhas c on c.id = m.campanha_id
    where m.personagem_id = p and c.mestre = auth.uid()
  )
$$;

-- RLS: campanhas
alter table public.campanhas enable row level security;
drop policy if exists "mesa lê a campanha" on public.campanhas;
create policy "mesa lê a campanha" on public.campanhas
  for select to authenticated using (public.eh_da_mesa(id));
drop policy if exists "qualquer um cria campanha própria" on public.campanhas;
create policy "qualquer um cria campanha própria" on public.campanhas
  for insert to authenticated with check (mestre = auth.uid());
drop policy if exists "mestre altera" on public.campanhas;
create policy "mestre altera" on public.campanhas
  for update to authenticated using (mestre = auth.uid()) with check (mestre = auth.uid());
drop policy if exists "mestre apaga" on public.campanhas;
create policy "mestre apaga" on public.campanhas
  for delete to authenticated using (mestre = auth.uid());

-- Anotações só do mestre, numa tabela à parte que os jogadores não leem.
create table if not exists public.notas_mestre (
  campanha_id uuid primary key references public.campanhas (id) on delete cascade,
  texto text not null default '',
  atualizado_em timestamptz not null default now()
);
alter table public.notas_mestre enable row level security;
drop policy if exists "só o mestre" on public.notas_mestre;
create policy "só o mestre" on public.notas_mestre
  for all to authenticated using (public.eh_mestre(campanha_id)) with check (public.eh_mestre(campanha_id));

-- RLS: membros
alter table public.membros enable row level security;
drop policy if exists "mesa vê quem está nela" on public.membros;
create policy "mesa vê quem está nela" on public.membros
  for select to authenticated using (public.eh_da_mesa(campanha_id));
-- Entrar é só pela função entrar_na_campanha (precisa do código).
drop policy if exists "jogador troca o próprio vínculo" on public.membros;
create policy "jogador troca o próprio vínculo" on public.membros
  for update to authenticated
  using (usuario = auth.uid())
  with check (
    usuario = auth.uid()
    and (personagem_id is null
      or exists (select 1 from public.personagens p where p.id = personagem_id and p.dono = auth.uid() and not p.excluido))
  );
drop policy if exists "jogador sai, mestre remove" on public.membros;
create policy "jogador sai, mestre remove" on public.membros
  for delete to authenticated using (usuario = auth.uid() or public.eh_mestre(campanha_id));

-- RLS: rolagens
alter table public.rolagens enable row level security;
drop policy if exists "mesa vê as rolagens" on public.rolagens;
create policy "mesa vê as rolagens" on public.rolagens
  for select to authenticated using (public.eh_da_mesa(campanha_id));
drop policy if exists "mesa rola" on public.rolagens;
create policy "mesa rola" on public.rolagens
  for insert to authenticated with check (autor = auth.uid() and public.eh_da_mesa(campanha_id));
drop policy if exists "mestre limpa" on public.rolagens;
create policy "mestre limpa" on public.rolagens
  for delete to authenticated using (public.eh_mestre(campanha_id));

-- O mestre lê (sem alterar) as fichas vinculadas às campanhas dele.
drop policy if exists "mestre lê fichas da mesa" on public.personagens;
create policy "mestre lê fichas da mesa" on public.personagens
  for select to authenticated using (public.mestre_ve_personagem(id));

-- Entrar pelo código. Devolve o id da campanha (ou erro se o código não existe).
create or replace function public.entrar_na_campanha(p_codigo text, p_apelido text default '')
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare
  c public.campanhas%rowtype;
begin
  if auth.uid() is null then
    raise exception 'precisa estar conectado';
  end if;
  select * into c from public.campanhas where codigo = upper(trim(p_codigo));
  if not found then
    raise exception 'código não encontrado' using errcode = 'P0002';
  end if;
  if c.mestre = auth.uid() then
    return c.id;
  end if;
  insert into public.membros (campanha_id, usuario, apelido)
  values (c.id, auth.uid(), left(coalesce(p_apelido, ''), 40))
  on conflict (campanha_id, usuario) do nothing;
  return c.id;
end;
$$;

-- Mestre gera um código novo (o antigo para de funcionar).
create or replace function public.trocar_codigo(c uuid) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  novo text;
begin
  if not public.eh_mestre(c) then
    raise exception 'só o mestre troca o código';
  end if;
  update public.campanhas set codigo = public.gerar_codigo_campanha() where id = c returning codigo into novo;
  return novo;
end;
$$;

-- Mesa: quem está, com o resumo da ficha vinculada (nome, raça, classe, nível),
-- sem expor a ficha inteira para os outros jogadores.
create or replace function public.mesa_da_campanha(c uuid)
returns table (usuario uuid, apelido text, personagem_id text, personagem_nome text, raca text, classe text, nivel int)
language sql stable security definer set search_path = '' as $$
  select m.usuario, m.apelido, p.id, p.dados ->> 'nome', p.dados ->> 'racaId', p.dados ->> 'classeId', (p.dados ->> 'nivel')::int
  from public.membros m
  left join public.personagens p on p.id = m.personagem_id and not p.excluido
  where m.campanha_id = c and public.eh_da_mesa(c)
  order by m.entrou_em
$$;

revoke execute on function public.entrar_na_campanha(text, text), public.trocar_codigo(uuid), public.mesa_da_campanha(uuid)
  from public, anon;
grant execute on function public.entrar_na_campanha(text, text), public.trocar_codigo(uuid), public.mesa_da_campanha(uuid)
  to authenticated;

-- Rolagens ao vivo (Supabase Realtime respeita o RLS acima).
do $$ begin
  alter publication supabase_realtime add table public.rolagens;
exception when duplicate_object then null; when undefined_object then null; end $$;
