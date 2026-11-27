-- Tomo · histórico do combate: quem tomou dano, quanto, condições, turnos e rodadas.
-- Escrito só pelo banco (gatilhos), então ninguém forja nem apaga entradas. O que vem
-- dos segredos (vida e condições dos monstros e das fichas escondidas) é só do mestre.
-- Pode rodar mais de uma vez.
create table if not exists public.historico_do_combate (
  id bigint generated always as identity primary key,
  combate_id uuid not null references public.combates (id) on delete cascade,
  rodada int not null default 1,
  tipo text not null check (tipo in ('rodada', 'vez', 'entrou', 'saiu', 'vida', 'condicao', 'morte')),
  participante_id uuid, -- sem chave estrangeira: a entrada fica mesmo se a linha sair do combate
  nome text not null default '',
  de int,
  para int,
  detalhe text not null default '',
  so_mestre boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists historico_combate_idx on public.historico_do_combate (combate_id, id);

alter table public.historico_do_combate enable row level security;
drop policy if exists "mesa lê o histórico" on public.historico_do_combate;
create policy "mesa lê o histórico" on public.historico_do_combate
  for select to authenticated
  using (
    privado.eh_da_mesa(privado.campanha_do_combate(combate_id))
    and (not so_mestre or privado.eh_mestre(privado.campanha_do_combate(combate_id)))
  );
drop policy if exists "só contas aprovadas" on public.historico_do_combate;
create policy "só contas aprovadas" on public.historico_do_combate as restrictive for all to authenticated
  using (privado.aprovado(auth.uid())) with check (privado.aprovado(auth.uid()));

-- Registra uma entrada. Mudanças de vida seguidas na mesma linha (cliques no −) viram uma só.
create or replace function privado.registrar_no_combate(
  c uuid, t text, p uuid, n text, de_ int, para_ int, det text, segredo boolean
) returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  r int;
  ultima public.historico_do_combate;
begin
  select rodada into r from public.combates where id = c;
  if not found then return; end if; -- o combate está sendo encerrado
  if t = 'vida' then
    select * into ultima from public.historico_do_combate where combate_id = c order by id desc limit 1;
    if found and ultima.tipo = 'vida' and ultima.participante_id = p and ultima.so_mestre = segredo
       and ultima.criado_em > now() - interval '20 seconds' then
      if ultima.de = para_ then
        delete from public.historico_do_combate where id = ultima.id; -- voltou ao que era
      else
        update public.historico_do_combate set para = para_, criado_em = now() where id = ultima.id;
      end if;
      return;
    end if;
  end if;
  insert into public.historico_do_combate (combate_id, rodada, tipo, participante_id, nome, de, para, detalhe, so_mestre)
  values (c, r, t, p, coalesce(n, ''), de_, para_, coalesce(det, ''), segredo);
end;
$$;

create or replace function privado.historico_de_combates() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.rodada <> old.rodada then
    perform privado.registrar_no_combate(new.id, 'rodada', null, null, old.rodada, new.rodada, '', false);
  end if;
  if new.vez is distinct from old.vez and new.vez is not null then
    perform privado.registrar_no_combate(new.id, 'vez', new.vez, (select nome from public.participantes where id = new.vez), null, null, '', false);
  end if;
  return null;
end;
$$;

create or replace function privado.historico_de_participantes() returns trigger
language plpgsql security definer set search_path = '' as $$
declare x text;
begin
  if tg_op = 'INSERT' then
    perform privado.registrar_no_combate(new.combate_id, 'entrou', new.id, new.nome, null, null, '', false);
  elsif tg_op = 'DELETE' then
    perform privado.registrar_no_combate(old.combate_id, 'saiu', old.id, old.nome, null, null, '', false);
  elsif new.tipo = 'jogador' then
    if old.pv is not null and new.pv is not null
       and new.pv + coalesce(new.pv_temp, 0) <> old.pv + coalesce(old.pv_temp, 0) then
      perform privado.registrar_no_combate(new.combate_id, 'vida', new.id, new.nome,
        old.pv + coalesce(old.pv_temp, 0), new.pv + coalesce(new.pv_temp, 0), '', false);
    end if;
    foreach x in array new.condicoes loop
      if not x = any (old.condicoes) then
        perform privado.registrar_no_combate(new.combate_id, 'condicao', new.id, new.nome, null, 1, x, false);
      end if;
    end loop;
    foreach x in array old.condicoes loop
      if not x = any (new.condicoes) then
        perform privado.registrar_no_combate(new.combate_id, 'condicao', new.id, new.nome, null, 0, x, false);
      end if;
    end loop;
    if coalesce(new.morte_sucessos, 0) > coalesce(old.morte_sucessos, 0) then
      perform privado.registrar_no_combate(new.combate_id, 'morte', new.id, new.nome, null, new.morte_sucessos, 'sucesso', false);
    end if;
    if coalesce(new.morte_falhas, 0) > coalesce(old.morte_falhas, 0) then
      perform privado.registrar_no_combate(new.combate_id, 'morte', new.id, new.nome, null, new.morte_falhas, 'falha', false);
    end if;
  end if;
  return null;
end;
$$;

create or replace function privado.historico_de_segredos() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  x text;
  pa public.participantes;
begin
  select * into pa from public.participantes where id = new.participante_id;
  if not found then return null; end if;
  if new.pv + new.pv_temp <> old.pv + old.pv_temp then
    perform privado.registrar_no_combate(pa.combate_id, 'vida', pa.id, pa.nome, old.pv + old.pv_temp, new.pv + new.pv_temp, '', true);
  end if;
  foreach x in array new.condicoes loop
    if not x = any (old.condicoes) then
      perform privado.registrar_no_combate(pa.combate_id, 'condicao', pa.id, pa.nome, null, 1, x, true);
    end if;
  end loop;
  foreach x in array old.condicoes loop
    if not x = any (new.condicoes) then
      perform privado.registrar_no_combate(pa.combate_id, 'condicao', pa.id, pa.nome, null, 0, x, true);
    end if;
  end loop;
  return null;
end;
$$;

drop trigger if exists historico on public.combates;
create trigger historico after update on public.combates for each row execute function privado.historico_de_combates();
drop trigger if exists historico on public.participantes;
create trigger historico after insert or update or delete on public.participantes for each row execute function privado.historico_de_participantes();
drop trigger if exists historico on public.segredos_do_combate;
create trigger historico after update on public.segredos_do_combate for each row execute function privado.historico_de_segredos();

revoke execute on function privado.registrar_no_combate(uuid, text, uuid, text, int, int, text, boolean) from public, anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.historico_do_combate;
exception when duplicate_object then null; when undefined_object then null;
end $$;
