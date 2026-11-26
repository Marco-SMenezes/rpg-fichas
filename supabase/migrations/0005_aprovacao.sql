-- Tomo · contas precisam ser aprovadas pelo dono.
-- Qualquer pessoa pode criar conta, mas ela fica "pendente": não lê nem grava
-- nada no banco até o dono aprovar na página Contas do site.
-- O e-mail do dono NÃO fica aqui (o repositório é público): ele vai em
-- privado.config com um insert feito à parte, direto no banco:
--   insert into privado.config (chave, valor) values ('email_dono', 'seu@email')
--   on conflict (chave) do update set valor = excluded.valor;
-- Pode rodar mais de uma vez.

create table if not exists privado.config (
  chave text primary key,
  valor text not null
);
create table if not exists privado.admins (
  usuario uuid primary key references auth.users (id) on delete cascade
);
create table if not exists privado.aprovados (
  usuario uuid primary key references auth.users (id) on delete cascade,
  aprovado_em timestamptz not null default now()
);
revoke all on privado.config, privado.admins, privado.aprovados from public, anon, authenticated;

create or replace function privado.eh_admin(u uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from privado.admins where usuario = u)
$$;

create or replace function privado.aprovado(u uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select privado.eh_admin(u) or exists (select 1 from privado.aprovados where usuario = u)
$$;
grant execute on function privado.eh_admin(uuid), privado.aprovado(uuid) to authenticated;

-- A conta do dono vira administradora sozinha ao ser criada (pelo e-mail em privado.config).
create or replace function privado.nova_conta() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if lower(new.email) = lower((select valor from privado.config where chave = 'email_dono')) then
    insert into privado.admins (usuario) values (new.id) on conflict do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists tomo_nova_conta on auth.users;
create trigger tomo_nova_conta after insert on auth.users
  for each row execute function privado.nova_conta();

-- Se o dono já tiver conta quando isto rodar, vira administrador agora.
insert into privado.admins (usuario)
select id from auth.users where lower(email) = lower((select valor from privado.config where chave = 'email_dono'))
on conflict do nothing;

-- Trava geral: em todas as tabelas, só contas aprovadas passam (política restritiva,
-- soma-se às regras que já existem).
do $$
declare t text;
begin
  foreach t in array array['personagens', 'campanhas', 'membros', 'rolagens', 'notas_mestre'] loop
    execute format('drop policy if exists "só contas aprovadas" on public.%I', t);
    execute format(
      'create policy "só contas aprovadas" on public.%I as restrictive for all to authenticated
         using (privado.aprovado(auth.uid())) with check (privado.aprovado(auth.uid()))', t);
  end loop;
end $$;

-- Entrar em campanha também exige conta aprovada (a função passa por cima do RLS).
create or replace function public.entrar_na_campanha(p_codigo text, p_apelido text default '')
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare
  c public.campanhas%rowtype;
begin
  if auth.uid() is null then
    raise exception 'precisa estar conectado';
  end if;
  if not privado.aprovado(auth.uid()) then
    raise exception 'Conta aguardando aprovação.' using errcode = 'P0001';
  end if;
  select * into c from public.campanhas where codigo = upper(trim(p_codigo));
  if not found then
    raise exception 'código não encontrado' using errcode = 'P0002';
  end if;
  if c.mestre = auth.uid() then
    return c.id;
  end if;
  insert into public.membros (campanha_id, usuario, apelido)
  values (c.id, auth.uid(), left(coalesce(p_apelido, ''), 40))
  on conflict (campanha_id, usuario) do nothing;
  return c.id;
end;
$$;

-- Situação da própria conta (o site usa para mostrar "aguardando aprovação").
create or replace function public.minha_conta()
returns table (aprovado boolean, admin boolean, pendentes int)
language sql stable security definer set search_path = '' as $$
  select privado.aprovado(auth.uid()),
         privado.eh_admin(auth.uid()),
         case when privado.eh_admin(auth.uid()) then
           (select count(*)::int from auth.users u
             where not exists (select 1 from privado.aprovados a where a.usuario = u.id)
               and not exists (select 1 from privado.admins d where d.usuario = u.id))
         else 0 end
$$;

-- Página Contas (só administradores): pedidos e contas aprovadas.
create or replace function public.listar_contas()
returns table (usuario uuid, email text, nome text, criado_em timestamptz, aprovado boolean, admin boolean, fichas int, campanhas int)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not privado.eh_admin(auth.uid()) then
    raise exception 'Só o dono do Tomo vê as contas.' using errcode = 'P0001';
  end if;
  return query
    select u.id, u.email::text, coalesce(u.raw_user_meta_data ->> 'nome', ''), u.created_at,
           privado.aprovado(u.id), privado.eh_admin(u.id),
           (select count(*)::int from public.personagens p where p.dono = u.id and not p.excluido),
           (select count(*)::int from public.campanhas c where c.mestre = u.id)
    from auth.users u
    order by privado.aprovado(u.id), u.created_at desc;
end;
$$;

create or replace function public.aprovar_conta(p_usuario uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not privado.eh_admin(auth.uid()) then
    raise exception 'Só o dono do Tomo aprova contas.' using errcode = 'P0001';
  end if;
  insert into privado.aprovados (usuario) values (p_usuario) on conflict do nothing;
end;
$$;

-- Recusar um pedido apaga a conta; tirar o acesso de quem já foi aprovado só volta para pendente.
create or replace function public.recusar_conta(p_usuario uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not privado.eh_admin(auth.uid()) then
    raise exception 'Só o dono do Tomo recusa contas.' using errcode = 'P0001';
  end if;
  if privado.eh_admin(p_usuario) then
    raise exception 'Não dá para recusar uma conta de administrador.' using errcode = 'P0001';
  end if;
  if exists (select 1 from privado.aprovados where usuario = p_usuario) then
    delete from privado.aprovados where usuario = p_usuario;
  else
    delete from auth.users where id = p_usuario;
  end if;
end;
$$;

revoke execute on function privado.nova_conta() from public, anon, authenticated;
revoke execute on function public.minha_conta(), public.listar_contas(), public.aprovar_conta(uuid), public.recusar_conta(uuid)
  from public, anon;
grant execute on function public.minha_conta(), public.listar_contas(), public.aprovar_conta(uuid), public.recusar_conta(uuid)
  to authenticated;
