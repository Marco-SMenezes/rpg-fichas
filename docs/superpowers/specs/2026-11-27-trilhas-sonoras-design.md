# Trilhas sonoras da campanha (design)

## Intenção
O mestre organiza a música da mesa dentro da campanha e toca na hora certa da sessão. As sessões são presenciais e a música sai de **um aparelho só, o do mestre**. Os jogadores não ouvem nem veem nada.

## Metas
- Lista de **cenas** (Taverna, Floresta, Combate…) com **faixas** de YouTube e Spotify (o mestre tem Spotify Premium).
- Tocar dentro do Tomo, sem trocar de aplicativo, e a música **continua tocando em qualquer tela do app** (outras abas da campanha, lista de campanhas, fichas, compêndio).
- Controles: tocar/pausar, anterior/próximo na cena, repetir, parar, volume.

## Não-metas
- Sincronizar com os aparelhos dos jogadores.
- Subir arquivos de música (peso e direitos autorais). Arquivos locais ficam para depois, se for preciso tocar sem internet.
- Volume do Spotify (o player embutido não permite) e misturar duas faixas ao mesmo tempo (clima + música).

## Anti-metas
- Música parar sozinha ao trocar de aba ou ao sair da campanha.
- A lista aparecer para os jogadores.

## Abordagens consideradas
1. Só lista de links que abrem em outro app: simples, mas o mestre troca de aplicativo e não há controle.
2. **Player embutido (escolhida)**: YouTube e Spotify pelas APIs de player oficiais; outros links ficam como "Abrir".
3. Arquivos no aparelho: funciona sem internet, mas fica preso a um aparelho e ocupa espaço. Fica como evolução.

## Design
- **Onde mora:** nova aba **Trilhas** na campanha, só para o mestre, ao lado de Escudo (rota `#/c/:id/trilhas`).
- **Dados:** coluna `trilhas jsonb` em `notas_mestre` (tabela que só o mestre lê e escreve, já usada pelo Escudo), com limite de 100 KB. Migração `0020_trilhas.sql`, sem dados pessoais.
  `{ cenas: [{ id, nome, faixas: [{ id, nome, url, servico: 'youtube' | 'spotify' | 'link' }] }] }`
- **Regras puras** em `src/trilhas/trilhas.ts` (com testes): reconhecer o link (vídeo e playlist do YouTube, faixa, álbum e playlist do Spotify; qualquer outro vira `link`), adicionar/renomear/apagar/mover cena e faixa, validar tamanho.
- **Player:** componente `PlayerDeTrilhas` montado na raiz do app (junto do rolador de dados, fora das rotas) e controlado por um estado global (`src/trilhas/estado.ts`), então continua tocando em qualquer tela. Só aparece para o mestre da campanha que está tocando. A barra fixa mostra nome da faixa, anterior, tocar/pausar, próximo, repetir, volume (só YouTube) e parar; nas telas com barra fixa embaixo (ficha), ela vai logo abaixo do topo. Ao trocar de cena ou parar, o YouTube baixa o volume aos poucos.
  - YouTube: IFrame Player API (`youtube.com/iframe_api`).
  - Spotify: iFrame API (`open.spotify.com/embed/iframe-api/v1`). Toca a faixa inteira se o mestre estiver logado no Spotify Premium no mesmo navegador; senão, só um trecho de 30 s.
  - Os scripts de terceiros só carregam quando o mestre toca a primeira faixa.
- **Tela da aba:** cartões de cena com faixas; colar um link cria a faixa e pega o nome do que o mestre digitar (sem consultar nada externo); botão de tocar em cada faixa e "Tocar cena" (começa na primeira).
- **Limites avisados na tela:** precisa de internet; no iPhone, bloquear a tela pode pausar o áudio; recarregar a página, fechar a aba ou o navegador descartar a página em segundo plano para a música.

## Fica para quem construir
Visual da barra do player e dos cartões (seguir a skill `site-sem-cara-de-ia` e os tokens de `tokens.css`), textos, acessibilidade dos controles, e o formato exato dos IDs.

## Verificação
Vitest nas regras puras; Playwright com os scripts de terceiros simulados para conferir lista, barra e que a música não para ao trocar de aba; teste real de reprodução com o mestre, porque só ele tem a conta Premium.
