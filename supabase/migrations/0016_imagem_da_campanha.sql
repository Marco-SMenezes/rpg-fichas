-- Tomo · imagem (opcional) da campanha: foto reduzida no aparelho, em data URL.
alter table public.campanhas add column if not exists imagem text;
alter table public.campanhas drop constraint if exists campanhas_imagem_valida;
alter table public.campanhas add constraint campanhas_imagem_valida
  check (imagem is null or (imagem ~ '^data:image/(jpeg|png|webp);base64,' and char_length(imagem) <= 400000));
