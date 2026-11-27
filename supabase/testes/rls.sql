-- Testes das regras de acesso (RLS). Roda num Postgres comum depois de
-- simular-supabase.sql e das migrações: supabase/testes/rodar.sh
\set ON_ERROR_STOP on
set client_min_messages = warning;

-- O dono do Tomo (vira administrador ao criar a conta).
insert into privado.config (chave, valor) values ('email_dono', 'mestre@x');
insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a', 'mestre@x'),
  ('00000000-0000-0000-0000-00000000000b', 'jogadora@x'),
  ('00000000-0000-0000-0000-00000000000c', 'intruso@x');
-- Nos testes de acesso abaixo, jogadora e intruso já foram aprovados; a aprovação em si é testada no fim.
insert into privado.aprovados (usuario) values
  ('00000000-0000-0000-0000-00000000000b'), ('00000000-0000-0000-0000-00000000000c');

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
create temp table if not exists pg_temp.criada (id uuid);
grant all on pg_temp.criada to authenticated;
with x as (insert into campanhas (nome) values ('Com retorno') returning id) insert into pg_temp.criada select id from x;
select pg_temp.esperar((select count(*) from pg_temp.criada) = 1, 'mestre cria campanha e recebe o id de volta');
delete from campanhas where nome = 'Com retorno';
select pg_temp.esperar((select count(*) from campanhas) = 1, 'mestre vê a própria campanha');
insert into notas_mestre (campanha_id, texto) select id, 'O vilão é o prefeito' from campanhas;
update notas_mestre set cartoes = '[{"id":"c1","titulo":"Regras da casa","texto":"x","oculto":false}]';
select pg_temp.esperar((select cartoes -> 0 ->> 'titulo' from notas_mestre) = 'Regras da casa', 'mestre guarda os cartões do escudo');
update notas_mestre set trilhas = '{"cenas":[{"id":"c1","nome":"Taverna","faixas":[]}]}';
select pg_temp.esperar((select trilhas -> 'cenas' -> 0 ->> 'nome' from notas_mestre) = 'Taverna', 'mestre guarda as trilhas sonoras');
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
reset role;
update campanhas set imagem = 'data:image/jpeg;base64,AAAA' where nome = 'A Mina Perdida';
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select pg_temp.esperar((select imagem from campanhas where nome = 'A Mina Perdida') = 'data:image/jpeg;base64,AAAA', 'jogadora vê a imagem da campanha');
select pg_temp.esperar((select notas from campanhas) = '', 'jogadora lê a campanha');
select pg_temp.esperar((select count(*) from notas_mestre) = 0, 'jogadora não lê as notas do mestre');
select pg_temp.esperar((select count(*) from notas_mestre where cartoes is not null) = 0, 'jogadora não lê o escudo');
select pg_temp.esperar((select count(*) from notas_mestre where trilhas is not null) = 0, 'jogadora não lê as trilhas');
update campanhas set nome = 'hackeada';
reset role;
select pg_temp.esperar((select nome from campanhas) = 'A Mina Perdida', 'jogadora não altera a campanha');
do $$ begin
  update campanhas set imagem = 'javascript:alert(1)';
  raise exception 'FALHOU: imagem inválida aceita';
exception when check_violation then raise notice 'ok: imagem da campanha só aceita foto';
end $$;

-- Vincular ficha
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
do $$ begin
  update membros set personagem_id = 'pj-c';
  raise exception 'FALHOU: vinculou ficha alheia';
exception when insufficient_privilege then raise notice 'ok: não vincula ficha de outra pessoa';
end $$;
update membros set personagem_id = 'pj-b';
select pg_temp.esperar((select personagem_nome from mesa_da_campanha(current_setting('tomo.campanha')::uuid)) = 'Lia', 'mesa mostra o resumo da ficha');
select pg_temp.esperar((select sistema from mesa_da_campanha(current_setting('tomo.campanha')::uuid)) = 'dnd5e', 'ficha de D&D vem marcada como dnd5e');
insert into personagens (id, dados, atualizado_em) values
  ('livre-b', '{"sistema":"livre","nome":"Lia Livre","ficha":{"nome":"Lia Livre"},"modelo":{"nome":"Cyberpunk"}}', now());
do $$ begin
  update membros set personagem_id = 'livre-b';
  raise exception 'FALHOU: ficha personalizada entrou em campanha de D&D';
exception when insufficient_privilege then raise notice 'ok: campanha de D&D não aceita ficha personalizada';
end $$;

-- Campanha personalizada (0008)
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
insert into campanhas (nome, sistema, tema, descricao) values ('Neon', 'personalizada', 'Cyberpunk', 'Uma cidade sem sol.');
select set_config('tomo.neon', (select id::text from campanhas where nome = 'Neon'), false);
select set_config('tomo.codigo_neon', (select codigo from campanhas where nome = 'Neon'), false);
do $$ begin
  update campanhas set sistema = 'dnd5e' where nome = 'Neon';
  raise exception 'FALHOU: sistema mudou';
exception when raise_exception then raise notice 'ok: o sistema da campanha não muda';
end $$;
do $$ begin
  insert into campanhas (nome, sistema) values ('X', 'gurps');
  raise exception 'FALHOU: sistema inválido aceito';
exception when check_violation then raise notice 'ok: só sistemas conhecidos';
end $$;
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select entrar_na_campanha(current_setting('tomo.codigo_neon'));
do $$ begin
  update membros set personagem_id = 'pj-b' where campanha_id = current_setting('tomo.neon')::uuid;
  raise exception 'FALHOU: ficha de D&D entrou em campanha personalizada';
exception when insufficient_privilege then raise notice 'ok: campanha personalizada não aceita ficha de D&D';
end $$;
update membros set personagem_id = 'livre-b' where campanha_id = current_setting('tomo.neon')::uuid;
select pg_temp.esperar((select personagem_nome || '/' || sistema || '/' || modelo_nome from mesa_da_campanha(current_setting('tomo.neon')::uuid)) = 'Lia Livre/livre/Cyberpunk', 'mesa mostra ficha personalizada com o modelo');
select pg_temp.esperar((select tema || '/' || sistema from campanhas where nome = 'Neon') = 'Cyberpunk/personalizada', 'jogadora lê tema e sistema');
reset role;
delete from campanhas where nome = 'Neon';
select pg_temp.como('00000000-0000-0000-0000-00000000000b');

select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select pg_temp.esperar((select count(*) from personagens where id = 'pj-b') = 1, 'mestre lê a ficha vinculada');
select pg_temp.esperar((select count(*) from personagens where id = 'pj-c') = 0, 'mestre não lê ficha fora da mesa');
update personagens set dados = '{}' where id = 'pj-b';
reset role;
select pg_temp.esperar((select dados ->> 'nome' from personagens where id = 'pj-b') = 'Lia', 'mestre não altera a ficha');

-- Combate (0010)
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
insert into combates (campanha_id) values (current_setting('tomo.campanha')::uuid);
select set_config('tomo.combate', (select id::text from combates), false);
insert into participantes (combate_id, tipo, personagem_id, usuario, nome, pv, pv_max, pv_temp, iniciativa)
  values (current_setting('tomo.combate')::uuid, 'jogador', 'pj-b', '00000000-0000-0000-0000-00000000000b', 'Lia', 10, 12, 0, 18);
insert into participantes (combate_id, tipo, nome, iniciativa) values (current_setting('tomo.combate')::uuid, 'monstro', 'Goblin 1', 15);
select set_config('tomo.pj', (select id::text from participantes where tipo = 'jogador'), false);
select set_config('tomo.mon', (select id::text from participantes where tipo = 'monstro'), false);
insert into segredos_do_combate (participante_id, pv, pv_max, ca) values (current_setting('tomo.mon')::uuid, 7, 7, 15);

select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select pg_temp.esperar((select count(*) from combates) = 1 and (select count(*) from participantes) = 2, 'mesa vê o combate');
select pg_temp.esperar((select count(*) from segredos_do_combate) = 0, 'jogadora não lê segredos dos monstros');
update combates set rodada = 9;
reset role;
select pg_temp.esperar((select rodada from combates) = 1, 'jogadora não passa o turno');
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select atualizar_meu_participante(current_setting('tomo.pj')::uuid, '{"pv": 4, "nome": "x"}');
reset role;
select pg_temp.esperar((select pv || '/' || nome from participantes where tipo = 'jogador') = '4/Lia', 'jogadora mexe só na própria vida');
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select atualizar_meu_participante(current_setting('tomo.pj')::uuid, '{"morte_sucessos": 2, "morte_falhas": 1}');
reset role;
select pg_temp.esperar((select morte_sucessos || '/' || morte_falhas from participantes where tipo = 'jogador') = '2/1', 'testes contra a morte ficam na linha para a mesa ver');
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
do $$ begin
  perform atualizar_meu_participante(current_setting('tomo.mon')::uuid, '{"iniciativa": 1}');
  raise exception 'FALHOU: jogadora mexeu no monstro';
exception when insufficient_privilege then raise notice 'ok: jogadora não mexe no monstro';
end $$;
do $$ begin
  insert into ajustes_de_vida (participante_id, delta) values (current_setting('tomo.pj')::uuid, 5);
  raise exception 'FALHOU: jogadora criou ajuste';
exception when insufficient_privilege then raise notice 'ok: jogadora não cria ajuste';
end $$;

select pg_temp.como('00000000-0000-0000-0000-00000000000c');
select pg_temp.esperar((select count(*) from combates) = 0 and (select count(*) from participantes) = 0, 'intruso não vê o combate');
reset role;
update participantes set usuario = '00000000-0000-0000-0000-00000000000c' where tipo = 'jogador';
select pg_temp.como('00000000-0000-0000-0000-00000000000c');
do $$ begin
  perform atualizar_meu_participante(current_setting('tomo.pj')::uuid, '{"pv": 1}');
  raise exception 'FALHOU: quem não está na mesa mexeu na linha';
exception when insufficient_privilege then raise notice 'ok: quem não está na mesa não mexe na linha do combate';
end $$;
reset role;
update participantes set usuario = '00000000-0000-0000-0000-00000000000b' where tipo = 'jogador';
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
update participantes set pv = 9 where id = current_setting('tomo.pj')::uuid;
select pg_temp.esperar((select pv from participantes where id = current_setting('tomo.pj')::uuid) = 9, 'mestre atualiza na hora a vida do jogador na linha');

select pg_temp.como('00000000-0000-0000-0000-00000000000a');
do $$ begin
  insert into ajustes_de_vida (participante_id, delta) values (current_setting('tomo.mon')::uuid, -1);
  raise exception 'FALHOU: ajuste em monstro';
exception when insufficient_privilege then raise notice 'ok: ajuste de vida só para jogadores';
end $$;
insert into ajustes_de_vida (participante_id, delta) values (current_setting('tomo.pj')::uuid, -3);
select set_config('tomo.ajuste', (select id::text from ajustes_de_vida), false);
select pg_temp.como('00000000-0000-0000-0000-00000000000c');
select pg_temp.esperar(pegar_ajuste(current_setting('tomo.ajuste')::bigint) is null, 'intruso não pega ajuste');
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select pg_temp.esperar((select count(*) from ajustes_de_vida) = 1, 'jogadora vê o ajuste pedido para ela');
select pg_temp.esperar(pegar_ajuste(current_setting('tomo.ajuste')::bigint) = -3, 'mestre pede ajuste e a dona aplica');
select pg_temp.esperar(pegar_ajuste(current_setting('tomo.ajuste')::bigint) is null, 'o mesmo ajuste não é aplicado duas vezes');

-- Condições dos jogadores (0017)
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select atualizar_meu_participante(current_setting('tomo.pj')::uuid, '{"condicoes": ["Envenenado", "Caído"]}');
reset role;
select pg_temp.esperar((select array_to_string(condicoes, ',') from participantes where tipo = 'jogador') = 'Envenenado,Caído', 'jogadora manda as condições da ficha para a linha');
do $$ begin
  update participantes set condicoes = '{Cego}' where id = current_setting('tomo.mon')::uuid;
  raise exception 'FALHOU: condição pública em monstro';
exception when check_violation then raise notice 'ok: condições de monstro ficam só no segredo';
end $$;
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
insert into ajustes_de_vida (participante_id, condicao, ligar) values (current_setting('tomo.pj')::uuid, 'Cego', true);
select set_config('tomo.ajuste2', (select max(id)::text from ajustes_de_vida), false);
do $$ begin
  insert into ajustes_de_vida (participante_id, delta, condicao, ligar) values (current_setting('tomo.pj')::uuid, 2, 'Cego', true);
  raise exception 'FALHOU: ajuste com vida e condição';
exception when check_violation then raise notice 'ok: ajuste é de vida ou de condição';
end $$;
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select pg_temp.esperar(pegar_ajuste(current_setting('tomo.ajuste2')::bigint) is null, 'versão antiga não engole ajuste de condição');
select pg_temp.esperar(pegar_ajuste_completo(current_setting('tomo.ajuste2')::bigint) = '{"delta": null, "condicao": "Cego", "ligar": true}', 'jogadora pega o ajuste de condição');
select pg_temp.esperar(pegar_ajuste_completo(current_setting('tomo.ajuste2')::bigint) is null, 'ajuste de condição só uma vez');

-- Histórico (0018)
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
update segredos_do_combate set pv = 3, condicoes = '{Envenenado}' where participante_id = current_setting('tomo.mon')::uuid;
update combates set rodada = 2, vez = current_setting('tomo.pj')::uuid;
select pg_temp.esperar((select count(*) from historico_do_combate where so_mestre) = 2, 'mestre vê vida e condição do monstro no histórico');
select pg_temp.esperar((select count(*) from historico_do_combate where tipo = 'rodada' and para = 2) = 1 and (select count(*) from historico_do_combate where tipo = 'vez' and nome = 'Lia') = 1, 'rodada e vez entram no histórico');
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select pg_temp.esperar((select count(*) from historico_do_combate where so_mestre) = 0, 'jogadora não vê segredos no histórico');
select pg_temp.esperar((select count(*) from historico_do_combate where tipo = 'vida' and nome = 'Lia' and de = 10 and para = 4) = 1, 'jogadora vê a vida dela no histórico');
select pg_temp.esperar((select count(*) from historico_do_combate where tipo = 'condicao' and detalhe = 'Caído' and para = 1) = 1, 'condição da jogadora no histórico');
select pg_temp.esperar((select count(*) from historico_do_combate where tipo = 'morte' and detalhe = 'sucesso' and para = 2) = 1, 'teste contra a morte no histórico');
select atualizar_meu_participante(current_setting('tomo.pj')::uuid, '{"pv": 3}');
select atualizar_meu_participante(current_setting('tomo.pj')::uuid, '{"pv": 1}');
select pg_temp.esperar((select de || '>' || para from historico_do_combate where tipo = 'vida' order by id desc limit 1) = '9>1', 'mudanças seguidas de vida viram uma entrada');
do $$ begin
  insert into historico_do_combate (combate_id, tipo) values (current_setting('tomo.combate')::uuid, 'vez');
  raise exception 'FALHOU: jogadora escreveu no histórico';
exception when insufficient_privilege then raise notice 'ok: ninguém escreve no histórico à mão';
end $$;
select pg_temp.como('00000000-0000-0000-0000-00000000000c');
select pg_temp.esperar((select count(*) from historico_do_combate) = 0, 'intruso não vê o histórico');

-- Ataques (0019)
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
select atualizar_meu_participante(current_setting('tomo.pj')::uuid, '{"ca": 16}');
select pg_temp.esperar((atacar(current_setting('tomo.pj')::uuid, current_setting('tomo.mon')::uuid, 'Espada', 14, 10) ->> 'acertou')::boolean = false, 'ataque abaixo da CA secreta erra');
select pg_temp.esperar((atacar(current_setting('tomo.pj')::uuid, current_setting('tomo.mon')::uuid, 'Espada', 2, 20) ->> 'acertou')::boolean, '20 natural sempre acerta');
select pg_temp.esperar((atacar(current_setting('tomo.pj')::uuid, current_setting('tomo.mon')::uuid, 'Espada', 30, 1) ->> 'acertou')::boolean = false, '1 natural sempre erra');
select set_config('tomo.ataque', atacar(current_setting('tomo.pj')::uuid, current_setting('tomo.mon')::uuid, 'Espada', 16, 12) ->> 'ataque', false);
select causar_dano(current_setting('tomo.ataque')::bigint, 2);
do $$ begin
  perform causar_dano(current_setting('tomo.ataque')::bigint, 50);
  raise exception 'FALHOU: dano aplicado duas vezes';
exception when insufficient_privilege then raise notice 'ok: o dano de um acerto vale uma vez só';
end $$;
select pg_temp.esperar((select count(*) from historico_do_combate where tipo = 'ataque' and nome = 'Lia' and de = 1 and para = 2 and detalhe = 'Goblin 1 · Espada') = 1, 'ataque com dano no histórico para a mesa');
do $$ begin
  perform atacar(current_setting('tomo.pj')::uuid, current_setting('tomo.pj')::uuid, 'Espada', 20, 15);
  raise exception 'FALHOU: jogadora atacou um jogador pelo banco';
exception when insufficient_privilege then raise notice 'ok: jogador só ataca monstro pelo banco';
end $$;
do $$ begin
  perform registrar_ataque_do_mestre(current_setting('tomo.mon')::uuid, current_setting('tomo.pj')::uuid, 'Garra', true, 5);
  raise exception 'FALHOU: jogadora registrou ataque do mestre';
exception when insufficient_privilege then raise notice 'ok: só o mestre registra o ataque dele';
end $$;
reset role;
select pg_temp.esperar((select pv from segredos_do_combate where participante_id = current_setting('tomo.mon')::uuid) = 1, 'dano do jogador sai da vida do monstro');
select pg_temp.esperar((select ca from participantes where id = current_setting('tomo.pj')::uuid) = 16, 'CA do jogador vem da ficha');
select pg_temp.como('00000000-0000-0000-0000-00000000000c');
do $$ begin
  perform atacar(current_setting('tomo.pj')::uuid, current_setting('tomo.mon')::uuid, 'Espada', 20, 15);
  raise exception 'FALHOU: intruso atacou';
exception when insufficient_privilege then raise notice 'ok: quem não é dono não ataca';
end $$;
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select registrar_ataque_do_mestre(current_setting('tomo.mon')::uuid, current_setting('tomo.pj')::uuid, 'Garra', true, 5);
select pg_temp.esperar((select count(*) from historico_do_combate where tipo = 'ataque' and nome = 'Goblin 1' and para = 5) = 1, 'mestre registra o ataque do monstro');
do $$ begin
  update participantes set ca = 12 where id = current_setting('tomo.mon')::uuid;
  raise exception 'FALHOU: CA pública em monstro';
exception when check_violation then raise notice 'ok: CA de monstro fica só no segredo';
end $$;

select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select adicionar_monstros(current_setting('tomo.combate')::uuid, '[{"nome":"Orc 1","resumo":"Monstro · Humanoide","desempate":1,"pv":15,"pv_max":15,"ca":13,"monstro":{}},{"nome":"Orc 2","resumo":"Monstro · Humanoide","desempate":1,"pv":15,"pv_max":15,"ca":13,"monstro":{}}]');
select pg_temp.esperar((select count(*) from participantes p join segredos_do_combate s on s.participante_id = p.id where p.nome like 'Orc %') = 2, 'mestre adiciona monstros com vida de uma vez');
do $$ begin
  perform adicionar_monstros(current_setting('tomo.combate')::uuid, '[{"nome":"Orc 3","pv":15,"pv_max":15,"ca":13},{"nome":"Orc 4","ca":13}]');
  raise exception 'FALHOU: monstro sem vida entrou';
exception when not_null_violation then raise notice 'ok: monstro sem vida não entra';
end $$;
select pg_temp.esperar((select count(*) from participantes where nome in ('Orc 3', 'Orc 4')) = 0, 'adicionar monstros é tudo ou nada');
select adicionar_monstros(current_setting('tomo.combate')::uuid, '[{"nome":"Vilão","resumo":"Personagem do mestre","pv":30,"pv_max":30,"ca":16,"personagem_id":"pj-a","usuario":"00000000-0000-0000-0000-00000000000a"}]');
select pg_temp.esperar((select personagem_id || '/' || usuario::text from participantes where nome = 'Vilão') = 'pj-a/00000000-0000-0000-0000-00000000000a', 'mestre põe a própria ficha escondida no combate');
do $$ begin
  perform adicionar_monstros(current_setting('tomo.combate')::uuid, '[{"nome":"Falso","pv":1,"pv_max":1,"ca":1,"usuario":"00000000-0000-0000-0000-00000000000b"}]');
  raise exception 'FALHOU: ficha escondida em nome de outra pessoa';
exception when insufficient_privilege then raise notice 'ok: ficha escondida só em nome do próprio mestre';
end $$;
select pg_temp.como('00000000-0000-0000-0000-00000000000b');
do $$ begin
  perform adicionar_monstros(current_setting('tomo.combate')::uuid, '[{"nome":"Orc 9","pv":1,"pv_max":1,"ca":1}]');
  raise exception 'FALHOU: jogadora adicionou monstro';
exception when insufficient_privilege then raise notice 'ok: jogadora não adiciona monstros';
end $$;
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
delete from combates;
reset role;
select pg_temp.esperar((select count(*) from participantes) + (select count(*) from segredos_do_combate) + (select count(*) from ajustes_de_vida) + (select count(*) from historico_do_combate) = 0, 'encerrar o combate apaga participantes, segredos e ajustes');

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

-- Aprovação de contas (0005)
reset role;
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000d', 'nova@x', '{"nome": "Duda"}'),
  ('00000000-0000-0000-0000-00000000000e', 'bot@x', '{}');
select pg_temp.como('00000000-0000-0000-0000-00000000000d');
select pg_temp.esperar((select not aprovado from minha_conta()), 'conta nova começa aguardando aprovação');
do $$ begin
  insert into personagens (id, dados, atualizado_em) values ('pj-d', '{}', now());
  raise exception 'FALHOU: conta pendente gravou ficha';
exception when insufficient_privilege then raise notice 'ok: conta pendente não grava fichas';
end $$;
do $$ begin
  perform entrar_na_campanha('ABCDEF');
  raise exception 'FALHOU: conta pendente entrou em campanha';
exception when raise_exception then
  if sqlerrm like 'FALHOU%' then raise; end if;
  raise notice 'ok: conta pendente não entra em campanha';
end $$;
do $$ begin
  perform * from listar_contas();
  raise exception 'FALHOU: conta comum listou contas';
exception when raise_exception then
  if sqlerrm like 'FALHOU%' then raise; end if;
  raise notice 'ok: só o dono lista as contas';
end $$;
do $$ begin
  perform aprovar_conta('00000000-0000-0000-0000-00000000000d');
  raise exception 'FALHOU: conta comum aprovou';
exception when raise_exception then
  if sqlerrm like 'FALHOU%' then raise; end if;
  raise notice 'ok: só o dono aprova';
end $$;
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select pg_temp.esperar((select admin and pendentes = 2 from minha_conta()), 'o dono vira administrador sozinho e vê 2 pedidos');
select pg_temp.esperar((select nome from listar_contas() where email = 'nova@x') = 'Duda', 'a lista mostra o nome informado no pedido');
select aprovar_conta('00000000-0000-0000-0000-00000000000d');
select recusar_conta('00000000-0000-0000-0000-00000000000e');
reset role;
select pg_temp.esperar((select count(*) from auth.users where email = 'bot@x') = 0, 'recusar um pedido apaga a conta');
select pg_temp.como('00000000-0000-0000-0000-00000000000d');
insert into personagens (id, dados, atualizado_em) values ('pj-d', '{}', now());
select pg_temp.esperar((select count(*) from personagens where id = 'pj-d') = 1, 'depois de aprovada, a conta grava fichas');
select pg_temp.como('00000000-0000-0000-0000-00000000000a');
select recusar_conta('00000000-0000-0000-0000-00000000000d');
select pg_temp.como('00000000-0000-0000-0000-00000000000d');
select pg_temp.esperar((select count(*) from personagens) = 0, 'tirar o acesso esconde as fichas de novo (sem apagar)');
