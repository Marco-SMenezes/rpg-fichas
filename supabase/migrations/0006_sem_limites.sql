-- Tomo · tira os limites de uso da 0004.
-- Com a aprovação de contas (0005), só entra quem o dono libera, então os
-- tetos de quantidade, tamanho e frequência deixam de ser necessários.
-- Pode rodar mais de uma vez.

drop trigger if exists limitar_personagens on public.personagens;
drop trigger if exists limitar_campanhas on public.campanhas;
drop trigger if exists limitar_membros on public.membros;
drop trigger if exists limitar_rolagens on public.rolagens;
drop trigger if exists podar_rolagens on public.rolagens;

drop function if exists privado.limitar_personagens();
drop function if exists privado.limitar_campanhas();
drop function if exists privado.limitar_membros();
drop function if exists privado.limitar_rolagens();
drop function if exists privado.podar_rolagens();

alter table public.personagens drop constraint if exists personagens_tamanho;
alter table public.campanhas drop constraint if exists campanhas_notas_tamanho;
alter table public.notas_mestre drop constraint if exists notas_mestre_tamanho;
alter table public.rolagens drop constraint if exists rolagens_detalhe_tamanho;
