# Trilhas sonoras Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O mestre organiza cenas e faixas (YouTube e Spotify) numa aba Trilhas e toca a música por um player que continua em qualquer tela do app.

**Architecture:** Regras puras em `src/trilhas/trilhas.ts`; lista salva em `notas_mestre.trilhas` (jsonb, só o mestre); estado global do player em `src/trilhas/estado.ts` (store externo, como `src/app/estado.ts`); dois motores (`youtube.ts`, `spotify.ts`) atrás de uma interface comum; `PlayerDeTrilhas` montado na raiz (`App.tsx`).

**Tech Stack:** React 19, TypeScript, Vite, Supabase, vitest, Playwright. IFrame APIs oficiais do YouTube e do Spotify, carregadas só ao tocar.

**Spec:** `docs/superpowers/specs/2026-11-27-trilhas-sonoras-design.md`

## Global Constraints
- Commits pequenos em PT-BR, com os trailers `Co-Authored-By` e `Claude-Session`; push direto em `main` e no branch da sessão.
- `npx prettier --write --no-semi --single-quote --print-width 150` nos arquivos tocados; `npx tsc -b` e `npx vitest run` limpos.
- Limite de `trilhas`: 100000 bytes (`pg_column_size`). Nada de e-mail ou dado pessoal em migração.
- Scripts de terceiros só de `https://www.youtube.com/iframe_api` e `https://open.spotify.com/embed/iframe-api/v1`, só ao tocar a primeira faixa.
- Volume e descida suave: só YouTube. Spotify: tocar, pausar, trocar de faixa.

## Review Focus
- Link inválido, vazio ou de outro serviço: vira faixa `link` (só "Abrir"), nunca quebra a lista.
- Playlist do YouTube (`list=`) e vídeo com `&t=`/`si=`: o id certo é extraído.
- Apagar a cena ou a faixa que está tocando: o player para sem erro.
- Rascunho salvo em formato antigo ou corrompido (`trilhas` nulo ou inválido): lista vazia, sem exceção.
- Passar do limite de 100 KB: mensagem clara, lista local preservada.

---

### Task 1: Regras puras das trilhas
**Files:** Create `src/trilhas/trilhas.ts`, `src/trilhas/trilhas.test.ts`
**Interfaces:**
- Produces:
  - `type Servico = 'youtube' | 'spotify' | 'link'`
  - `interface Faixa { id: string; nome: string; url: string; servico: Servico; recurso: string }` (`recurso` = id do vídeo ou `playlist:ID` no YouTube; `tipo:ID` no Spotify, ex. `track:XYZ`; `''` em `link`)
  - `interface Cena { id: string; nome: string; faixas: Faixa[] }`; `interface Trilhas { cenas: Cena[] }`
  - `reconhecerLink(url: string): { servico: Servico; recurso: string }`
  - `normalizarTrilhas(bruto: unknown): Trilhas`
  - `novaCena(nome: string): Cena`; `novaFaixa(url: string, nome?: string): Faixa`
  - `moverItem<T>(lista: T[], de: number, para: number): T[]`
  - `tamanhoDasTrilhas(t: Trilhas): number` (bytes do JSON)
- [ ] Teste falhando: `reconhecerLink` com `youtu.be/ID?si=x`, `youtube.com/watch?v=ID&t=30`, `youtube.com/playlist?list=PL1`, `open.spotify.com/track/ID?si=y`, `open.spotify.com/intl-pt/playlist/ID`, `spotify:track:ID`, `https://exemplo.com/a.mp3` (→ `link`) e texto sem URL (→ `link` com recurso vazio).
- [ ] Teste falhando: `normalizarTrilhas(null)`, `({})`, `({cenas:'x'})` → `{cenas: []}`; cena sem id ganha id; faixa inválida descartada; `moverItem` não muta e ignora índices fora; nome vazio da faixa vira o host do link.
- [ ] Implementar; rodar `npx vitest run src/trilhas`; commit "Trilhas: regras puras (links, cenas, faixas)".

### Task 2: Migração e acesso à nuvem
**Files:** Create `supabase/migrations/0020_trilhas.sql`; Modify `src/nuvem/campanhas.ts`, `supabase/testes/rls.sql`
**Interfaces:**
- Consumes: `Trilhas`, `normalizarTrilhas` (Task 1)
- Produces: `lerTrilhas(campanhaId: string): Promise<Trilhas>`; `salvarTrilhas(campanhaId: string, t: Trilhas): Promise<void>`; erro `trilhas_tamanho` → "As trilhas passaram do limite. Apague alguma faixa ou cena."
- [ ] Migração: `alter table public.notas_mestre add column if not exists trilhas jsonb;` + constraint `notas_mestre_trilhas_tamanho check (pg_column_size(trilhas) <= 100000)`.
- [ ] Teste em `rls.sql`: jogador não lê nem grava `trilhas` (mesma política "só o mestre"); rodar `supabase/testes/rodar.sh` → "RLS: tudo certo".
- [ ] `lerTrilhas`/`salvarTrilhas` seguindo `lerEscudo`/`salvarCartoes` (upsert por `campanha_id`).
- [ ] Aplicar a migração no projeto remoto; commit.

### Task 3: Estado global e motores de player
**Files:** Create `src/trilhas/estado.ts`, `src/trilhas/motores.ts`, `src/trilhas/youtube.ts`, `src/trilhas/spotify.ts`, `src/trilhas/estado.test.ts`
**Interfaces:**
- Consumes: `Cena`, `Faixa`
- Produces:
  - `interface Motor { carregar(f: Faixa): Promise<void>; tocar(): void; pausar(): void; parar(): void; volume(v: number): void; aoTerminar(cb: () => void): void; podeVolume: boolean }`
  - `interface EstadoDoPlayer { campanhaId: string | null; cena: Cena | null; indice: number; tocando: boolean; repetir: boolean; volume: number }`
  - Store: `usarPlayer(): EstadoDoPlayer`; ações `tocarCena(campanhaId, cena, indice?)`, `alternar()`, `proxima()`, `anterior()`, `parar()`, `definirVolume(v)`, `alternarRepetir()`, `faixaAtual(): Faixa | null`, `avisarRemocao(cenaId, faixaId?)`
  - `motorDe(servico): Motor | null` (null para `link`)
- [ ] Teste do estado com motor falso: `proxima` no fim volta ao início se `repetir`, senão para; `anterior` no início fica; `avisarRemocao` da faixa tocando para o player; trocar de cena chama `parar` do motor anterior.
- [ ] Motores: YouTube (`YT.Player` num `div` oculto; `loadVideoById` ou `loadPlaylist`; descida suave de 800 ms em `parar`); Spotify (`IFrameAPI.createController`, `loadUri`, `play`, `pause`; `podeVolume = false`).
- [ ] Commit "Trilhas: estado global e motores de YouTube e Spotify".

### Task 4: Aba Trilhas
**Files:** Create `src/app/paginas/campanhas/Trilhas.tsx`; Modify `src/app/rotas.ts` (aba `'trilhas'`, `caminho.campanha(id, 'trilhas')`), `src/app/paginas/campanhas/Campanha.tsx` (aba só do mestre, como o Escudo), `src/app/estilos/paginas.css`
**Interfaces:**
- Consumes: `lerTrilhas`, `salvarTrilhas`, `tocarCena`, `usarPlayer`, `novaCena`, `novaFaixa`, `moverItem`
- Produces: `Trilhas({ c }: { c: MinhaCampanha })`
- [ ] Cartões de cena (renomear, apagar com confirmação, subir/descer), faixas (colar link + nome opcional, tocar, apagar, subir/descer), botão "Tocar cena"; faixas `link` mostram "Abrir" (`target=_blank`, `rel=noopener`). Salva a cada mudança; erro de tamanho aparece em `.aviso-campo`.
- [ ] Jogador que abrir `#/c/ID/trilhas` vê a campanha (como no escudo).
- [ ] Commit.

### Task 5: Barra global, README e verificação
**Files:** Create `src/trilhas/PlayerDeTrilhas.tsx`; Modify `src/app/App.tsx`, `src/app/estilos/paginas.css`, `README.md`
- [ ] Barra fixa: nome da faixa e da cena, anterior, tocar/pausar, próxima, repetir, volume (oculto se `!podeVolume`), parar; só aparece com `campanhaId` e faixa atual; vai logo abaixo do topo nas rotas `ficha`, `ficha-mesa` e `livre`, e no rodapé nas demais.
- [ ] Playwright (`teste-trilhas.cjs`) com os scripts de terceiros bloqueados: cria cena e faixa, barra aparece ao tocar (motor simulado via `window`), continua ao trocar para Combate e para a lista, some ao parar; jogador não vê a aba; celular 390 px sem rolagem horizontal.
- [ ] README; `npx tsc -b`, `npx vitest run`, `npx vite build`; commit e push. A reprodução real fica para o teste do mestre.
