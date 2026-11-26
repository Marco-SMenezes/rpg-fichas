-- Tomo · adicionar monstros ao combate de uma vez (tudo ou nada).
-- Antes eram duas gravações (participantes e depois segredos); se a segunda falhasse,
-- ficavam monstros sem vida nem CA. Roda com as regras de quem chama (security invoker),
-- então só o mestre consegue.
create or replace function public.adicionar_monstros(c uuid, monstros jsonb)
returns void language plpgsql volatile security invoker set search_path = '' as $$
declare
  m jsonb;
  novo uuid;
begin
  for m in select * from jsonb_array_elements(monstros) loop
    insert into public.participantes (combate_id, tipo, nome, resumo, foto, desempate)
    values (c, 'monstro', m ->> 'nome', coalesce(m ->> 'resumo', ''), m ->> 'foto', coalesce((m ->> 'desempate')::int, 0))
    returning id into novo;
    insert into public.segredos_do_combate (participante_id, pv, pv_max, pv_temp, ca, monstro)
    values (novo, (m ->> 'pv')::int, (m ->> 'pv_max')::int, 0, coalesce((m ->> 'ca')::int, 10), coalesce(m -> 'monstro', '{}'::jsonb));
  end loop;
end;
$$;
revoke execute on function public.adicionar_monstros(uuid, jsonb) from public, anon;
grant execute on function public.adicionar_monstros(uuid, jsonb) to authenticated;
