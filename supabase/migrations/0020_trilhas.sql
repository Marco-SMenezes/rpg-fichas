-- Trilhas sonoras da campanha: cenas e faixas (links do YouTube e do Spotify), só o mestre lê e grava.
-- A tabela notas_mestre já tem a política "só o mestre" e a de contas aprovadas.
alter table public.notas_mestre add column if not exists trilhas jsonb;
alter table public.notas_mestre drop constraint if exists notas_mestre_trilhas_tamanho;
alter table public.notas_mestre add constraint notas_mestre_trilhas_tamanho check (pg_column_size(trilhas) <= 100000);
