-- Testes das regras de acesso (RLS). Roda num Postgres comum depois de
-- simular-supabase.sql e das migrações: supabase/testes/rodar.sh
\set ON_ERROR_STOP on
set client_min_messages = warning;

insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a', 'mestre@x'),
  ('00000000-0000-0000-0000-00000000000b', 'jogadora@x'),
  ('00000000-0000-0000-0000-00000000000c', 'intruso@x');

create or replace function pg_temp.como(u text) returns void language sql as $$
  select set_config('role', 'authenticated', false), set_config('request.jwt.claim.sub', u, false)
$$;
create or replace function pg_temp.esperar(ok boolean, msg text) returns void language plpgsql as $$
begin
  if not ok then raise exception 'FALHOU: %', msg; end if;
  raise notice 'ok: %', msg;
end $$;
set client_min_messages = notice;

-- Fichas (0001)
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
insert into personagens (id, dados, atualizado_em) values ('pj-b', '{"nome":"Lia","racaId":"elfo","classeId":"ladino","nivel":3}', now());
select pg_temp.como('00000000-0000-0000-0000-00000000000c');
insert into personagens (id, dados, atualizado_em) values ('pj-c', '{"nome":"Zed","nivel":1}', now());
select pg_temp.esperar((select count(*) from personagens) = 1, 'cada um só vê as próprias fichas');
update personagens set dados = '{}' where id = 'pj-b';
reset role;
select pg_temp.esperar((select dados ->> 'nome' from personagens where id = 'pj-b') = 'Lia', 'ninguém altera ficha alheia');

select pg_temp.como('00000000-0000-0000-0000-00000000000c');
do $$ begin
  insert into personagens (id, dono, dados, atualizado_em) values ('pj-x', '00000000-0000-0000-0000-00000000000b', '{}', now());
  raise exception 'FALHOU: criou ficha em nome de outra pessoa';
exception when insufficient_privilege then raise notice 'ok: não cria ficha em nome de outra pessoa';
end $$;

-- Campanhas (0002)
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
insert into campanhas (nome) values ('A Mina Perdida');
select pg_temp.esperar((select count(*) from campanhas) = 1, 'mestre vê a própria campanha');
insert into notas_mestre (campanha_id, texto) select id, 'O vilão é o prefeito' from campanhas;
select set_config('tomo.codigo', (select codigo from campanhas), false);
select set_config('tomo.campanha', (select id::text from campanhas), false);
select pg_temp.esperar(current_setting('tomo.codigo') ~ '^[A-Z2-9]{6}$', 'código de 6 caracteres');

select pg_temp.como('00000000-0000-0000-0000-00000000000c');
select pg_temp.esperar((select count(*) from campanhas) = 0, 'quem não está na mesa não vê a campanha');
select pg_temp.esperar((select count(*) from mesa_da_campanha(current_setting('tomo.campanha')::uuid)) = 0, 'quem não está na mesa não vê os membros');
do $$ begin
  insert into membros (campanha_id) values (current_setting('tomo.campanha')::uuid);
  raise exception 'FALHOU: entrou sem código';
exception when insufficient_privilege then raise notice 'ok: não entra sem código';
end $$;
do $$ begin
  perform entrar_na_campanha('ZZZZZZ');
  raise exception 'FALHOU: código errado aceito';
exception when no_data_found then raise notice 'ok: código errado recusado';
end $$;

select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select pg_temp.esperar(entrar_na_campanha(lower(current_setting('tomo.codigo')), 'Ana') = current_setting('tomo.campanha')::uuid, 'jogadora entra pelo código (minúsculas valem)');
select entrar_na_campanha(current_setting('tomo.codigo'));
select pg_temp.esperar((select count(*) from membros) = 1, 'entrar de novo não duplica');
select pg_temp.esperar((select notas from campanhas) = '', 'jogadora lê a campanha');
select pg_temp.esperar((select count(*) from notas_mestre) = 0, 'jogadora não lê as notas do mestre');
update campanhas set nome = 'hackeada';
reset role;
select pg_temp.esperar((select nome from campanhas) = 'A Mina Perdida', 'jogadora não altera a campanha');

-- Vincular ficha
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
do $$ begin
  update membros set personagem_id = 'pj-c';
  raise exception 'FALHOU: vinculou ficha alheia';
exception when insufficient_privilege then raise notice 'ok: não vincula ficha de outra pessoa';
end $$;
update membros set personagem_id = 'pj-b';
select pg_temp.esperar((select personagem_nome from mesa_da_campanha(current_setting('tomo.campanha')::uuid)) = 'Lia', 'mesa mostra o resumo da ficha');

select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select pg_temp.esperar((select count(*) from personagens where id = 'pj-b') = 1, 'mestre lê a ficha vinculada');
select pg_temp.esperar((select count(*) from personagens where id = 'pj-c') = 0, 'mestre não lê ficha fora da mesa');
update personagens set dados = '{}' where id = 'pj-b';
reset role;
select pg_temp.esperar((select dados ->> 'nome' from personagens where id = 'pj-b') = 'Lia', 'mestre não altera a ficha');

-- Rolagens
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
insert into rolagens (campanha_id, quem, rotulo, expressao, total) values (current_setting('tomo.campanha')::uuid, 'Lia', 'Furtividade', '1d20+7', 19);
select pg_temp.como('00000000-0000-0000-0000-00000000000c');
select pg_temp.esperar((select count(*) from rolagens) = 0, 'intruso não vê rolagens');
do $$ begin
  insert into rolagens (campanha_id, quem, expressao, total) values (current_setting('tomo.campanha')::uuid, 'Zed', '1d20', 20);
  raise exception 'FALHOU: intruso rolou';
exception when insufficient_privilege then raise notice 'ok: intruso não rola na mesa';
end $$;
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select pg_temp.esperar((select count(*) from rolagens) = 1, 'mestre vê a rolagem da jogadora');
do $$ begin
  insert into rolagens (campanha_id, autor, quem, expressao, total) values (current_setting('tomo.campanha')::uuid, '00000000-0000-0000-0000-00000000000b', 'Lia', '1d20', 1);
  raise exception 'FALHOU: rolou em nome de outra pessoa';
exception when insufficient_privilege then raise notice 'ok: não rola em nome de outra pessoa';
end $$;

-- Trocar código e sair
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
do $$ begin
  perform trocar_codigo(current_setting('tomo.campanha')::uuid);
  raise exception 'FALHOU: jogadora trocou o código';
exception when raise_exception then
  if sqlerrm like 'FALHOU%' then raise; end if;
  raise notice 'ok: só o mestre troca o código';
end $$;
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select pg_temp.esperar(trocar_codigo(current_setting('tomo.campanha')::uuid) <> current_setting('tomo.codigo'), 'mestre troca o código');
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
delete from membros;
select pg_temp.esperar((select count(*) from campanhas) = 0, 'quem sai deixa de ver a campanha');
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select pg_temp.esperar((select count(*) from personagens) = 0, 'mestre deixa de ver a ficha de quem saiu');
delete from campanhas;
reset role;
select pg_temp.esperar((select count(*) from rolagens) + (select count(*) from notas_mestre) = 0, 'apagar a campanha apaga rolagens e notas');
