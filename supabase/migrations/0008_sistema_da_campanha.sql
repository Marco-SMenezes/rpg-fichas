-- Tomo · campanha com sistema, tema e descrição.
-- O sistema é escolhido ao criar e não muda: 'dnd5e' só aceita fichas de D&D 5e,
-- 'personalizada' só aceita fichas do construtor (dados.sistema = 'livre').

alter table public.campanhas add column if not exists sistema text not null default 'dnd5e';
alter table public.campanhas add column if not exists tema text not null default '';
alter table public.campanhas add column if not exists descricao text not null default '';

alter table public.campanhas drop constraint if exists campanhas_sistema_valido;
alter table public.campanhas add constraint campanhas_sistema_valido check (sistema in ('dnd5e', 'personalizada'));
alter table public.campanhas drop constraint if exists campanhas_tema_tamanho;
alter table public.campanhas add constraint campanhas_tema_tamanho check (char_length(tema) <= 80);
alter table public.campanhas drop constraint if exists campanhas_descricao_tamanho;
alter table public.campanhas add constraint campanhas_descricao_tamanho check (char_length(descricao) <= 2000);

create or replace function privado.manter_sistema() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.sistema is distinct from old.sistema then
    raise exception 'O sistema da campanha não muda depois de criada.';
  end if;
  return new;
end;
$$;
drop trigger if exists manter_sistema on public.campanhas;
create trigger manter_sistema before update on public.campanhas
  for each row execute function privado.manter_sistema();

-- A ficha é minha, existe e é do sistema da campanha?
create or replace function privado.ficha_serve(c uuid, p text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.campanhas ca join public.personagens pe on pe.id = p
    where ca.id = c and pe.dono = auth.uid() and not pe.excluido
      and case ca.sistema
            when 'personalizada' then pe.dados ->> 'sistema' = 'livre'
            else coalesce(pe.dados ->> 'sistema', 'dnd5e') = 'dnd5e'
          end
  )
$$;
revoke execute on function privado.ficha_serve(uuid, text) from public, anon;
grant execute on function privado.ficha_serve(uuid, text) to authenticated;

drop policy if exists "jogador troca o próprio vínculo" on public.membros;
create policy "jogador troca o próprio vínculo" on public.membros
  for update to authenticated
  using (usuario = auth.uid())
  with check (usuario = auth.uid() and (personagem_id is null or privado.ficha_serve(campanha_id, personagem_id)));
