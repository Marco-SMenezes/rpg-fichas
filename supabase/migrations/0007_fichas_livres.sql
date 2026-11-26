-- Tomo · fichas livres (do construtor universal) nas campanhas.
-- Modelos e fichas livres moram na mesma tabela personagens, com dados.sistema
-- = 'modelo' ou 'livre'. As regras de acesso são as mesmas das fichas de D&D;
-- aqui só a mesa passa a dizer de que tipo é cada ficha.

drop function if exists public.mesa_da_campanha(uuid);
create function public.mesa_da_campanha(c uuid)
returns table (
  usuario uuid, apelido text, personagem_id text, personagem_nome text,
  raca text, classe text, nivel int,
  sistema text, modelo_nome text
)
language sql stable security definer set search_path = '' as $$
  select m.usuario, m.apelido, p.id,
         coalesce(p.dados ->> 'nome', p.dados -> 'ficha' ->> 'nome'),
         p.dados ->> 'racaId', p.dados ->> 'classeId',
         case when p.dados ->> 'nivel' ~ '^\d+$' then (p.dados ->> 'nivel')::int end,
         case when p.id is null then null else coalesce(p.dados ->> 'sistema', 'dnd5e') end,
         p.dados -> 'modelo' ->> 'nome'
  from public.membros m
  left join public.personagens p on p.id = m.personagem_id and not p.excluido
  where m.campanha_id = c and privado.eh_da_mesa(c)
  order by m.entrou_em
$$;

revoke execute on function public.mesa_da_campanha(uuid) from public, anon;
grant execute on function public.mesa_da_campanha(uuid) to authenticated;
