-- Tomo · escudo do mestre: cartões de consulta personalizáveis.
-- Ficam em notas_mestre, que só o mestre lê e escreve (RLS da 0002/0003).
alter table public.notas_mestre add column if not exists cartoes jsonb; -- nulo = nunca personalizou (o site mostra os padrões)
alter table public.notas_mestre drop constraint if exists notas_mestre_cartoes_tamanho;
alter table public.notas_mestre add constraint notas_mestre_cartoes_tamanho check (pg_column_size(cartoes) <= 200000);
