-- Tomo · limites contra abuso (cadastro aberto).
-- Mesmo que alguém crie contas em massa, cada conta tem teto de uso, e o
-- banco recusa o excesso. Valores folgados para uma mesa normal.
-- Pode rodar mais de uma vez.

-- Tamanho: ficha (com foto) até ~2 MB; anotações até 20 mil caracteres; detalhe de rolagem pequeno.
alter table public.personagens drop constraint if exists personagens_tamanho;
alter table public.personagens add constraint personagens_tamanho check (octet_length(dados::text) <= 2000000);
alter table public.campanhas drop constraint if exists campanhas_notas_tamanho;
alter table public.campanhas add constraint campanhas_notas_tamanho check (char_length(notas) <= 20000);
alter table public.notas_mestre drop constraint if exists notas_mestre_tamanho;
alter table public.notas_mestre add constraint notas_mestre_tamanho check (char_length(texto) <= 20000);
alter table public.rolagens drop constraint if exists rolagens_detalhe_tamanho;
alter table public.rolagens add constraint rolagens_detalhe_tamanho check (octet_length(detalhe::text) <= 10000);

-- Fichas: até 50 ativas por pessoa (e 200 linhas contando as excluídas, que ficam para sincronizar).
create or replace function privado.limitar_personagens() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.personagens where dono = new.dono and not excluido) >= 50 then
    raise exception 'Limite de 50 fichas por conta.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.personagens where dono = new.dono) >= 200 then
    raise exception 'Limite de fichas da conta atingido.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists limitar_personagens on public.personagens;
create trigger limitar_personagens before insert on public.personagens
  for each row execute function privado.limitar_personagens();

-- Campanhas: até 20 criadas por pessoa.
create or replace function privado.limitar_campanhas() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.campanhas where mestre = new.mestre) >= 20 then
    raise exception 'Limite de 20 campanhas por conta.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists limitar_campanhas on public.campanhas;
create trigger limitar_campanhas before insert on public.campanhas
  for each row execute function privado.limitar_campanhas();

-- Participação: até 30 campanhas como jogador.
create or replace function privado.limitar_membros() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.membros where usuario = new.usuario) >= 30 then
    raise exception 'Limite de 30 campanhas como jogador.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists limitar_membros on public.membros;
create trigger limitar_membros before insert on public.membros
  for each row execute function privado.limitar_membros();

-- Rolagens: até 60 por minuto por pessoa; cada campanha guarda as 200 mais recentes.
create or replace function privado.limitar_rolagens() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.rolagens where autor = new.autor and criado_em > now() - interval '1 minute') >= 60 then
    raise exception 'Muitas rolagens em pouco tempo. Espere um pouco.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists limitar_rolagens on public.rolagens;
create trigger limitar_rolagens before insert on public.rolagens
  for each row execute function privado.limitar_rolagens();

create or replace function privado.podar_rolagens() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.rolagens
  where campanha_id = new.campanha_id
    and id not in (select id from public.rolagens where campanha_id = new.campanha_id order by id desc limit 200);
  return null;
end;
$$;
drop trigger if exists podar_rolagens on public.rolagens;
create trigger podar_rolagens after insert on public.rolagens
  for each row execute function privado.podar_rolagens();

-- Gatilhos não são chamados pela API; ninguém precisa executá-los diretamente.
revoke execute on function privado.limitar_personagens(), privado.limitar_campanhas(), privado.limitar_membros(),
  privado.limitar_rolagens(), privado.podar_rolagens() from public, anon, authenticated;
