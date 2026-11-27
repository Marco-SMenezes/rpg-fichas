-- Tomo · ataque com alvo no combate.
-- O mestre conhece as CAs (dos monstros no segredo, dos jogadores na linha) e aplica o dano.
-- O jogador não vê a CA nem a vida do monstro: o banco confere o acerto (atacar) e, se acertou,
-- aceita o dano uma vez só (causar_dano). Tudo vai para o histórico.
-- Pode rodar mais de uma vez.
alter table public.participantes add column if not exists ca int;
alter table public.participantes drop constraint if exists participantes_monstro_sem_ca;
alter table public.participantes add constraint participantes_monstro_sem_ca check (tipo = 'jogador' or ca is null);

alter table public.historico_do_combate drop constraint if exists historico_do_combate_tipo_check;
alter table public.historico_do_combate add constraint historico_do_combate_tipo_check
  check (tipo in ('rodada', 'vez', 'entrou', 'saiu', 'vida', 'condicao', 'morte', 'ataque'));
-- Ataque: nome = quem atacou, detalhe = "alvo · arma", de = 1 acertou / 0 errou, para = dano.

-- Acerto conferido pelo banco que espera o dano do jogador (uma vez, por pouco tempo).
create table if not exists public.ataques_pendentes (
  id bigint generated always as identity primary key,
  alvo uuid not null references public.participantes (id) on delete cascade,
  usuario uuid not null,
  entrada bigint,
  usado boolean not null default false,
  criado_em timestamptz not null default now()
);
alter table public.ataques_pendentes enable row level security; -- sem regras: só as funções abaixo mexem

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
    iniciativa = case when campos ? 'iniciativa' then (campos ->> 'iniciativa')::int else iniciativa end,
    morte_sucessos = case when campos ? 'morte_sucessos' then (campos ->> 'morte_sucessos')::int else morte_sucessos end,
    morte_falhas = case when campos ? 'morte_falhas' then (campos ->> 'morte_falhas')::int else morte_falhas end,
    condicoes = case when jsonb_typeof(campos -> 'condicoes') = 'array'
      then array(select left(x, 40) from jsonb_array_elements_text(campos -> 'condicoes') x) else condicoes end,
    ca = case when campos ? 'ca' then (campos ->> 'ca')::int else ca end
  where id = p;
end;
$$;

-- Grava a entrada de ataque e devolve o id.
create or replace function privado.registrar_ataque(atacante public.participantes, alvo public.participantes, arma text, acertou boolean, dano int)
returns bigint language plpgsql volatile security definer set search_path = '' as $$
declare
  r int;
  novo bigint;
begin
  select rodada into r from public.combates where id = atacante.combate_id;
  insert into public.historico_do_combate (combate_id, rodada, tipo, participante_id, nome, de, para, detalhe)
  values (atacante.combate_id, coalesce(r, 1), 'ataque', atacante.id, atacante.nome, case when acertou then 1 else 0 end, dano,
          left(alvo.nome || ' · ' || coalesce(nullif(trim(arma), ''), 'ataque'), 160))
  returning id into novo;
  return novo;
end;
$$;

-- Jogador ataca um monstro: o banco compara com a CA secreta. Devolve {acertou, ataque}.
create or replace function public.atacar(atacante uuid, alvo uuid, arma text, total int, dado int)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  a public.participantes;
  b public.participantes;
  ca_alvo int;
  acertou boolean;
  entrada bigint;
  pendente bigint;
begin
  select * into a from public.participantes where id = atacante;
  select * into b from public.participantes where id = alvo;
  if not privado.aprovado(auth.uid()) or not privado.dono_do_participante(atacante)
     or b.id is null or b.combate_id <> a.combate_id or b.tipo <> 'monstro' then
    raise exception 'ataque não permitido' using errcode = '42501';
  end if;
  select s.ca into ca_alvo from public.segredos_do_combate s where s.participante_id = alvo;
  acertou := dado <> 1 and (dado = 20 or total >= coalesce(ca_alvo, 10));
  entrada := privado.registrar_ataque(a, b, arma, acertou, null);
  if acertou then
    insert into public.ataques_pendentes (alvo, usuario, entrada) values (alvo, auth.uid(), entrada) returning id into pendente;
  end if;
  return jsonb_build_object('acertou', acertou, 'ataque', pendente);
end;
$$;

-- O dano de um acerto conferido: tira do temporário e depois da vida do monstro. Uma vez só, em até 10 minutos.
create or replace function public.causar_dano(ataque bigint, dano int)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  p public.ataques_pendentes;
  d int := greatest(0, least(coalesce(dano, 0), 999));
begin
  update public.ataques_pendentes set usado = true
  where id = ataque and not usado and usuario = auth.uid() and criado_em > now() - interval '10 minutes'
  returning * into p;
  if p.id is null or not privado.aprovado(auth.uid()) then
    raise exception 'esse ataque não vale mais' using errcode = '42501';
  end if;
  update public.segredos_do_combate set
    pv = greatest(0, pv - greatest(0, d - pv_temp)),
    pv_temp = greatest(0, pv_temp - d)
  where participante_id = p.alvo;
  update public.historico_do_combate set para = d where id = p.entrada;
end;
$$;

-- O mestre registra no histórico um ataque que ele resolveu (ele já aplicou o dano).
create or replace function public.registrar_ataque_do_mestre(atacante uuid, alvo uuid, arma text, acertou boolean, dano int)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  a public.participantes;
  b public.participantes;
begin
  select * into a from public.participantes where id = atacante;
  select * into b from public.participantes where id = alvo;
  if not privado.aprovado(auth.uid()) or a.id is null or b.id is null or b.combate_id <> a.combate_id
     or not privado.eh_mestre(privado.campanha_do_combate(a.combate_id)) then
    raise exception 'só o mestre registra' using errcode = '42501';
  end if;
  perform privado.registrar_ataque(a, b, arma, acertou, case when acertou then greatest(0, dano) end);
end;
$$;

revoke execute on function privado.registrar_ataque(public.participantes, public.participantes, text, boolean, int) from public, anon, authenticated;
revoke execute on function public.atacar(uuid, uuid, text, int, int), public.causar_dano(bigint, int),
  public.registrar_ataque_do_mestre(uuid, uuid, text, boolean, int), public.atualizar_meu_participante(uuid, jsonb) from public, anon;
grant execute on function public.atacar(uuid, uuid, text, int, int), public.causar_dano(bigint, int),
  public.registrar_ataque_do_mestre(uuid, uuid, text, boolean, int), public.atualizar_meu_participante(uuid, jsonb) to authenticated;
