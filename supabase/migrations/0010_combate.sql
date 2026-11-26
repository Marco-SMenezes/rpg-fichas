-- Tomo · combate ao vivo na campanha.
-- A mesa vê a ordem de iniciativa e de quem é a vez; vida, CA e condições dos
-- monstros ficam em segredos_do_combate, que só o mestre lê (nem a API nem o
-- tempo real entregam isso a jogadores). A vida dos jogadores mora na ficha
-- deles: o jogador atualiza a própria linha e o mestre pede ajustes, que o
-- aparelho do jogador aplica na ficha (uma vez só).
-- Pode rodar mais de uma vez.

create table if not exists public.combates (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null unique references public.campanhas (id) on delete cascade,
  rodada int not null default 1 check (rodada >= 1),
  vez uuid,
  criado_em timestamptz not null default now()
);

create table if not exists public.participantes (
  id uuid primary key default gen_random_uuid(),
  combate_id uuid not null references public.combates (id) on delete cascade,
  tipo text not null check (tipo in ('jogador', 'monstro')),
  personagem_id text,
  usuario uuid references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 80),
  resumo text not null default '' check (char_length(resumo) <= 120),
  foto text check (foto is null or char_length(foto) <= 60000),
  iniciativa int,
  desempate int not null default 0,
  pv int,
  pv_max int,
  pv_temp int,
  criado_em timestamptz not null default now(),
  -- Monstro não guarda vida aqui (a mesa leria): só em segredos_do_combate.
  constraint participantes_monstro_sem_vida check (tipo = 'jogador' or (pv is null and pv_max is null and pv_temp is null))
);
create index if not exists participantes_combate_idx on public.participantes (combate_id);
create index if not exists participantes_usuario_idx on public.participantes (usuario);

create table if not exists public.segredos_do_combate (
  participante_id uuid primary key references public.participantes (id) on delete cascade,
  pv int not null,
  pv_max int not null,
  pv_temp int not null default 0,
  ca int not null default 10,
  condicoes text[] not null default '{}',
  monstro jsonb not null default '{}'::jsonb
);

create table if not exists public.ajustes_de_vida (
  id bigint generated always as identity primary key,
  participante_id uuid not null references public.participantes (id) on delete cascade,
  delta int not null check (delta <> 0),
  aplicado boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists ajustes_participante_idx on public.ajustes_de_vida (participante_id) where not aplicado;

-- De um combate ou participante até a campanha (para as regras de acesso).
create or replace function privado.campanha_do_combate(c uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select campanha_id from public.combates where id = c
$$;

create or replace function privado.campanha_do_participante(p uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select cb.campanha_id from public.participantes pa join public.combates cb on cb.id = pa.combate_id where pa.id = p
$$;

create or replace function privado.dono_do_participante(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.participantes where id = p and tipo = 'jogador' and usuario = auth.uid())
$$;

create or replace function privado.eh_jogador(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.participantes where id = p and tipo = 'jogador')
$$;

revoke execute on all functions in schema privado from public, anon;
grant execute on all functions in schema privado to authenticated;

-- RLS: combates
alter table public.combates enable row level security;
drop policy if exists "mesa vê o combate" on public.combates;
create policy "mesa vê o combate" on public.combates
  for select to authenticated using (privado.eh_da_mesa(campanha_id));
drop policy if exists "mestre conduz o combate" on public.combates;
create policy "mestre conduz o combate" on public.combates
  for all to authenticated using (privado.eh_mestre(campanha_id)) with check (privado.eh_mestre(campanha_id));

-- RLS: participantes
alter table public.participantes enable row level security;
drop policy if exists "mesa vê os participantes" on public.participantes;
create policy "mesa vê os participantes" on public.participantes
  for select to authenticated using (privado.eh_da_mesa(privado.campanha_do_combate(combate_id)));
drop policy if exists "mestre cuida dos participantes" on public.participantes;
create policy "mestre cuida dos participantes" on public.participantes
  for all to authenticated
  using (privado.eh_mestre(privado.campanha_do_combate(combate_id)))
  with check (privado.eh_mestre(privado.campanha_do_combate(combate_id)));

-- RLS: segredos (só o mestre)
alter table public.segredos_do_combate enable row level security;
drop policy if exists "só o mestre vê segredos" on public.segredos_do_combate;
create policy "só o mestre vê segredos" on public.segredos_do_combate
  for all to authenticated
  using (privado.eh_mestre(privado.campanha_do_participante(participante_id)))
  with check (privado.eh_mestre(privado.campanha_do_participante(participante_id)));

-- RLS: ajustes de vida
alter table public.ajustes_de_vida enable row level security;
drop policy if exists "mestre pede ajuste" on public.ajustes_de_vida;
create policy "mestre pede ajuste" on public.ajustes_de_vida
  for insert to authenticated
  with check (privado.eh_mestre(privado.campanha_do_participante(participante_id)) and privado.eh_jogador(participante_id) and not aplicado);
drop policy if exists "mestre e dono veem ajustes" on public.ajustes_de_vida;
create policy "mestre e dono veem ajustes" on public.ajustes_de_vida
  for select to authenticated
  using (privado.eh_mestre(privado.campanha_do_participante(participante_id)) or privado.dono_do_participante(participante_id));

-- Só contas aprovadas (como em 0005).
do $$
declare t text;
begin
  foreach t in array array['combates', 'participantes', 'segredos_do_combate', 'ajustes_de_vida'] loop
    execute format('drop policy if exists "só contas aprovadas" on public.%I', t);
    execute format(
      'create policy "só contas aprovadas" on public.%I as restrictive for all to authenticated
         using (privado.aprovado(auth.uid())) with check (privado.aprovado(auth.uid()))', t);
  end loop;
end $$;

-- O jogador atualiza a própria linha: só vida e iniciativa.
create or replace function public.atualizar_meu_participante(p uuid, campos jsonb)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not privado.aprovado(auth.uid()) or not privado.dono_do_participante(p) then
    raise exception 'só o dono da ficha mexe nela' using errcode = '42501';
  end if;
  update public.participantes set
    pv = case when campos ? 'pv' then (campos ->> 'pv')::int else pv end,
    pv_max = case when campos ? 'pv_max' then (campos ->> 'pv_max')::int else pv_max end,
    pv_temp = case when campos ? 'pv_temp' then (campos ->> 'pv_temp')::int else pv_temp end,
    iniciativa = case when campos ? 'iniciativa' then (campos ->> 'iniciativa')::int else iniciativa end
  where id = p;
end;
$$;

-- O dono pega um ajuste pendente: marca como aplicado e devolve o delta (null se outro aparelho pegou).
create or replace function public.pegar_ajuste(a bigint)
returns int language plpgsql volatile security definer set search_path = '' as $$
declare d int;
begin
  update public.ajustes_de_vida set aplicado = true
  where id = a and not aplicado and privado.aprovado(auth.uid()) and privado.dono_do_participante(participante_id)
  returning delta into d;
  return d;
end;
$$;

revoke execute on function public.atualizar_meu_participante(uuid, jsonb), public.pegar_ajuste(bigint) from public, anon;
grant execute on function public.atualizar_meu_participante(uuid, jsonb), public.pegar_ajuste(bigint) to authenticated;

-- Tempo real (respeita o RLS acima).
do $$
declare t text;
begin
  foreach t in array array['combates', 'participantes', 'segredos_do_combate', 'ajustes_de_vida'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null; when undefined_object then null;
    end;
  end loop;
end $$;
