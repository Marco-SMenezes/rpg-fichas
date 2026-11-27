-- Tomo · condições dos jogadores no combate.
-- Como a vida: a ficha do jogador é a fonte e a ponte manda as condições para a linha
-- (que a mesa vê). O mestre marca uma condição num jogador pedindo um ajuste, que o
-- aparelho do jogador aplica na ficha. Monstros continuam com as condições no segredo.
-- Pode rodar mais de uma vez.
alter table public.participantes add column if not exists condicoes text[] not null default '{}';
alter table public.participantes drop constraint if exists participantes_condicoes_limite;
alter table public.participantes add constraint participantes_condicoes_limite check (cardinality(condicoes) <= 20);
alter table public.participantes drop constraint if exists participantes_monstro_sem_condicoes;
alter table public.participantes add constraint participantes_monstro_sem_condicoes check (tipo = 'jogador' or condicoes = '{}');

-- Ajuste de condição: em vez do delta de vida, a condição e se liga ou desliga.
alter table public.ajustes_de_vida add column if not exists condicao text;
alter table public.ajustes_de_vida add column if not exists ligar boolean;
alter table public.ajustes_de_vida alter column delta drop not null;
alter table public.ajustes_de_vida drop constraint if exists ajustes_de_vida_delta_check;
alter table public.ajustes_de_vida drop constraint if exists ajustes_de_vida_um_tipo;
alter table public.ajustes_de_vida add constraint ajustes_de_vida_um_tipo check (
  (delta is not null and delta <> 0 and condicao is null and ligar is null)
  or (delta is null and char_length(condicao) between 1 and 40 and ligar is not null)
);

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
      then array(select left(x, 40) from jsonb_array_elements_text(campos -> 'condicoes') x) else condicoes end
  where id = p;
end;
$$;

-- A versão antiga só pega ajustes de vida (um site desatualizado não engole um ajuste de condição).
create or replace function public.pegar_ajuste(a bigint)
returns int language plpgsql volatile security definer set search_path = '' as $$
declare d int;
begin
  update public.ajustes_de_vida set aplicado = true
  where id = a and delta is not null and not aplicado and privado.aprovado(auth.uid()) and privado.dono_do_participante(participante_id)
  returning delta into d;
  return d;
end;
$$;

-- Pega qualquer ajuste: {delta} ou {condicao, ligar}; null se outro aparelho já pegou.
create or replace function public.pegar_ajuste_completo(a bigint)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare r jsonb;
begin
  update public.ajustes_de_vida set aplicado = true
  where id = a and not aplicado and privado.aprovado(auth.uid()) and privado.dono_do_participante(participante_id)
  returning jsonb_build_object('delta', delta, 'condicao', condicao, 'ligar', ligar) into r;
  return r;
end;
$$;

revoke execute on function public.atualizar_meu_participante(uuid, jsonb), public.pegar_ajuste(bigint), public.pegar_ajuste_completo(bigint) from public, anon;
grant execute on function public.atualizar_meu_participante(uuid, jsonb), public.pegar_ajuste(bigint), public.pegar_ajuste_completo(bigint) to authenticated;
