-- Tomo · funções auxiliares das regras de acesso num esquema privado.
-- O esquema "public" é exposto pela API do Supabase (/rest/v1/rpc/...); estas
-- funções só servem às políticas de RLS, então ficam fora dele.
-- Pode rodar mais de uma vez.

create schema if not exists privado;
revoke all on schema privado from public, anon;
grant usage on schema privado to authenticated;

create or replace function privado.eh_mestre(c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.campanhas where id = c and mestre = auth.uid())
$$;

create or replace function privado.eh_da_mesa(c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select privado.eh_mestre(c)
      or exists (select 1 from public.membros where campanha_id = c and usuario = auth.uid())
$$;

create or replace function privado.mestre_ve_personagem(p text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.membros m join public.campanhas c on c.id = m.campanha_id
    where m.personagem_id = p and c.mestre = auth.uid()
  )
$$;

revoke execute on all functions in schema privado from public, anon;
grant execute on all functions in schema privado to authenticated;

-- Políticas passam a usar as funções privadas.
drop policy if exists "mesa lê a campanha" on public.campanhas;
create policy "mesa lê a campanha" on public.campanhas
  for select to authenticated using (privado.eh_da_mesa(id));

drop policy if exists "só o mestre" on public.notas_mestre;
create policy "só o mestre" on public.notas_mestre
  for all to authenticated using (privado.eh_mestre(campanha_id)) with check (privado.eh_mestre(campanha_id));

drop policy if exists "mesa vê quem está nela" on public.membros;
create policy "mesa vê quem está nela" on public.membros
  for select to authenticated using (privado.eh_da_mesa(campanha_id));

drop policy if exists "jogador sai, mestre remove" on public.membros;
create policy "jogador sai, mestre remove" on public.membros
  for delete to authenticated using (usuario = auth.uid() or privado.eh_mestre(campanha_id));

drop policy if exists "mesa vê as rolagens" on public.rolagens;
create policy "mesa vê as rolagens" on public.rolagens
  for select to authenticated using (privado.eh_da_mesa(campanha_id));

drop policy if exists "mesa rola" on public.rolagens;
create policy "mesa rola" on public.rolagens
  for insert to authenticated with check (autor = auth.uid() and privado.eh_da_mesa(campanha_id));

drop policy if exists "mestre limpa" on public.rolagens;
create policy "mestre limpa" on public.rolagens
  for delete to authenticated using (privado.eh_mestre(campanha_id));

drop policy if exists "mestre lê fichas da mesa" on public.personagens;
create policy "mestre lê fichas da mesa" on public.personagens
  for select to authenticated using (privado.mestre_ve_personagem(id));

-- As funções que o site chama de verdade também passam a usar as privadas.
create or replace function public.trocar_codigo(c uuid) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  novo text;
begin
  if not privado.eh_mestre(c) then
    raise exception 'só o mestre troca o código';
  end if;
  update public.campanhas set codigo = public.gerar_codigo_campanha() where id = c returning codigo into novo;
  return novo;
end;
$$;

create or replace function public.mesa_da_campanha(c uuid)
returns table (usuario uuid, apelido text, personagem_id text, personagem_nome text, raca text, classe text, nivel int)
language sql stable security definer set search_path = '' as $$
  select m.usuario, m.apelido, p.id, p.dados ->> 'nome', p.dados ->> 'racaId', p.dados ->> 'classeId', (p.dados ->> 'nivel')::int
  from public.membros m
  left join public.personagens p on p.id = m.personagem_id and not p.excluido
  where m.campanha_id = c and privado.eh_da_mesa(c)
  order by m.entrou_em
$$;

-- Versões antigas, expostas na API.
drop function if exists public.eh_da_mesa(uuid);
drop function if exists public.eh_mestre(uuid);
drop function if exists public.mestre_ve_personagem(text);

-- O gerador de código é usado como valor padrão ao criar campanha (com a
-- permissão de quem cria), então só quem está conectado pode usá-lo.
revoke execute on function public.gerar_codigo_campanha() from public, anon;
grant execute on function public.gerar_codigo_campanha() to authenticated;
