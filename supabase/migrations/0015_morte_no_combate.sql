-- Tomo · testes contra a morte no combate.
-- A linha do jogador mostra para a mesa as marcas de sucessos e falhas; a ficha dele
-- continua sendo a fonte (a ponte manda as marcas junto com a vida).
alter table public.participantes add column if not exists morte_sucessos int check (morte_sucessos between 0 and 3);
alter table public.participantes add column if not exists morte_falhas int check (morte_falhas between 0 and 3);

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
    morte_falhas = case when campos ? 'morte_falhas' then (campos ->> 'morte_falhas')::int else morte_falhas end
  where id = p;
end;
$$;
revoke execute on function public.atualizar_meu_participante(uuid, jsonb) from public, anon;
grant execute on function public.atualizar_meu_participante(uuid, jsonb) to authenticated;
