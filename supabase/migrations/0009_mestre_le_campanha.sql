-- Tomo · o mestre lê a própria campanha direto pela coluna mestre.
-- Sem isto, criar a campanha pedindo o id de volta (insert ... returning) falhava:
-- a regra de leitura usava uma função que consulta a tabela, e ela ainda não via a
-- linha recém-criada. O site mostrava erro mesmo com a campanha criada.
drop policy if exists "mestre lê a própria campanha" on public.campanhas;
create policy "mestre lê a própria campanha" on public.campanhas
  for select to authenticated using (mestre = auth.uid());
