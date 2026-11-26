-- Tomo · o mestre põe personagens dele no combate como "escondidos" (vida só para ele).
-- adicionar_monstros passa a aceitar a ficha (personagem_id) e o dono (usuario), que só
-- pode ser o próprio mestre. A ficha dele continua sendo a fonte da verdade da vida.
create or replace function public.adicionar_monstros(c uuid, monstros jsonb)
returns void language plpgsql volatile security invoker set search_path = '' as $$
declare
  m jsonb;
  novo uuid;
begin
  for m in select * from jsonb_array_elements(monstros) loop
    if m ? 'usuario' and (m ->> 'usuario')::uuid is distinct from auth.uid() then
      raise exception 'a ficha escondida precisa ser do próprio mestre' using errcode = '42501';
    end if;
    insert into public.participantes (combate_id, tipo, nome, resumo, foto, desempate, personagem_id, usuario)
    values (c, 'monstro', m ->> 'nome', coalesce(m ->> 'resumo', ''), m ->> 'foto', coalesce((m ->> 'desempate')::int, 0),
            m ->> 'personagem_id', (m ->> 'usuario')::uuid)
    returning id into novo;
    insert into public.segredos_do_combate (participante_id, pv, pv_max, pv_temp, ca, monstro)
    values (novo, (m ->> 'pv')::int, (m ->> 'pv_max')::int, coalesce((m ->> 'pv_temp')::int, 0), coalesce((m ->> 'ca')::int, 10),
            coalesce(m -> 'monstro', '{}'::jsonb));
  end loop;
end;
$$;
revoke execute on function public.adicionar_monstros(uuid, jsonb) from public, anon;
grant execute on function public.adicionar_monstros(uuid, jsonb) to authenticated;
