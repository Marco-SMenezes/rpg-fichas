-- Tomo · a linha do combate só é "minha" enquanto eu estiver na mesa.
-- Quem saiu da campanha deixa de atualizar a própria linha antiga e de pegar ajustes.
create or replace function privado.dono_do_participante(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.participantes pa join public.combates cb on cb.id = pa.combate_id
    where pa.id = p and pa.tipo = 'jogador' and pa.usuario = auth.uid() and privado.eh_da_mesa(cb.campanha_id)
  )
$$;
