# Bestiário (parte 1 de 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Os 322 monstros do SRD 5.1 traduzidos para PT-BR no Compêndio, mais "Meus monstros" (criar, copiar do SRD, importar/exportar), sincronizados na conta.

**Architecture:**
- Dados do SRD: arquivos JSON em lotes dentro de `src/regras/dnd5e/dados/monstros/srd/`, carregados sob demanda por `carregarSRD()` (`import()` separado do pacote inicial).
- Números e estrutura: um script gera um esqueleto a partir da API Open5e, com os números já preenchidos. A tradução só substitui textos, então os números não podem divergir da fonte.
- Meus monstros: são uma nova coleção da sincronização genérica (`registrarColecao`), com ids `monstro-…` na tabela `personagens`.

**Tech Stack:** React 19, TypeScript estrito, Vitest, Supabase (sem migração nova), Node 22 para os scripts.

**Spec:** `docs/superpowers/specs/2026-11-26-escudo-combate-bestiario-design.md` (seção 1. Bestiário)

## Global Constraints

- Fonte: API Open5e, documento `wotc-srd` (322 monstros). Licença: SRD 5.1, CC BY 4.0. O crédito aparece no README e no Compêndio, com este texto: "Monstros do SRD 5.1 (Wizards of the Coast), licença CC BY 4.0, traduzidos pelo Tomo."
- **Nada do Livro dos Monstros** no repositório. Arquivos da fonte em inglês ficam em `scripts/bestiario/fonte/` (no `.gitignore`).
- **Termos de jogo:** os mesmos do Tomo e do Livro do Jogador PT-BR:
  - perícias de `NOME_PERICIA`;
  - condições de `CONDICOES`;
  - "Ataque Corpo a Corpo com Arma", "Ataque à Distância com Arma", "+4 para acertar", "Acerto:", "dano cortante/perfurante/concussão", "CD 13 de Sabedoria".
- **Distâncias** em metros, à razão de 5 pés = 1,5 m (30 pés → 9 m; 60 pés → 18 m; alcance 80/320 pés → 24/96 m). Formato do Tomo: "9 metros" no texto corrido, "9 m" em deslocamento e sentidos.
- **Carregamento:** o bestiário nunca entra no pacote inicial. Só `import()` dinâmico.
- **Commits:** pequenos, em português, com as linhas de coautoria da sessão. Push para `main` e `ccr-2018480f-o7pb8z`.

## Review Focus

- **Monstro com texto vazio ou opcional ausente** (sem reações, sem ações lendárias, sem perícias): o bloco não mostra título vazio. Teste em Task 4.
- **Busca por nome em inglês e sem acento** ("owlbear", "urso coruja"): acha "Urso-coruja". Teste em Task 1.
- **ND fracionário** ("1/8", "1/4", "1/2"): ordena e filtra como número (0,125 < 1). Teste em Task 1.
- **Arquivo de importação inválido ou de outro formato:** erro legível, nada é gravado. Teste em Task 5.
- **Monstro próprio vindo de outro aparelho sem campos novos** (versão antiga): `normalizarMonstro` preenche os padrões e não descarta. Teste em Task 5.

---

### Task 1: Tipos, normalização e busca de monstros

**Files:**
- Create: `src/regras/dnd5e/dados/monstros/tipos.ts`
- Create: `src/regras/dnd5e/dados/monstros/busca.ts`
- Test: `src/regras/dnd5e/dados/monstros/busca.test.ts`

**Interfaces:**
- **Produces:**
  - `interface TextoDeMonstro { nome: string; texto: string }`
  - `interface Monstro`, com os campos:
    - `id: string`, `nome: string`, `nomeOriginal: string`
    - `tamanho: string`, `tipo: string`, `subtipo: string`, `tendencia: string`
    - `ca: number`, `caDescricao: string`, `pv: number`, `dadosDeVida: string`
    - `deslocamento: string`
    - `atributos: Record<Atributo, number>`, `salvaguardas: Partial<Record<Atributo, number>>`
    - `pericias: { nome: string; bonus: number }[]`
    - `vulnerabilidades: string`, `resistencias: string`, `imunidades: string`, `imunidadesACondicao: string`
    - `sentidos: string`, `idiomas: string`
    - `nd: string`, `xp: number`
    - `tracos: TextoDeMonstro[]`, `acoes: TextoDeMonstro[]`, `acoesBonus: TextoDeMonstro[]`, `reacoes: TextoDeMonstro[]`, `lendarias: TextoDeMonstro[]`
    - `descricaoLendaria: string`
    - `foto?: string`
    - `origem: 'srd' | 'meu'`
    - `criadoEm: string`, `atualizadoEm: string`
  - `ndComoNumero(nd: string): number`
  - `xpDoNd(nd: string): number` (tabela do SRD: 0→10, 1/8→25, 1/4→50, 1/2→100, 1→200 … 30→155000)
  - `normalizarMonstro(x: unknown, origem: 'srd' | 'meu'): Monstro | null`
  - `filtrarMonstros(lista: Monstro[], f: { termo: string; tipo: string; ndMin: number | null; ndMax: number | null }): Monstro[]`: busca sem acento em `nome` e `nomeOriginal`, e resultado ordenado por nome.
  - `TIPOS_DE_MONSTRO: string[]`, com os 14 tipos em PT-BR: Aberração, Besta, Celestial, Constructo, Dragão, Elemental, Fada, Corruptor, Gigante, Humanoide, Monstruosidade, Limo, Planta, Morto-vivo.

- [ ] **Step 1: Write the failing tests** in `busca.test.ts`:
  - `ndComoNumero('1/8') === 0.125`, `ndComoNumero('1/2') === 0.5`, `ndComoNumero('10') === 10`.
  - `xpDoNd('1/4') === 50`, `xpDoNd('5') === 1800`, `xpDoNd('30') === 155000`.
  - `normalizarMonstro({ nome: 'Goblin' }, 'meu')` returns a Monstro with `ca === 10`, `pv === 1`, every list `[]`, and `atributos.for === 10`.
  - `normalizarMonstro(null, 'meu') === null` and `normalizarMonstro({}, 'meu') === null` (no name).
  - The `filtrarMonstros` fixture has three monsters: "Urso-coruja" (`nomeOriginal` "Owlbear"), "Goblin" and "Dragão Vermelho Adulto" (nd "17").
    - `termo: 'owlbear'` finds the Urso-coruja; `'urso coruja'` too (hyphen and space are the same).
    - `ndMax: 1` keeps only the Goblin (nd "1/4").
- [ ] **Step 2:** Run `npx vitest run src/regras/dnd5e/dados/monstros`. Expected: FAIL, module missing.
- [ ] **Step 3: Implement both files.**
  - `normalizarMonstro` coerces each field with a safe default and requires a non-empty `nome`.
  - It generates `id` if missing (`monstro-` + `novoId()` from `src/universal/modelo.ts` for `'meu'`).
  - For text search, normalize hyphens to spaces.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5: Commit** "Tipos e busca do bestiário".

### Task 2: Script de preparo e glossário

**Files:**
- Create: `scripts/bestiario/preparar.mjs`
- Create: `scripts/bestiario/glossario.md`
- Modify: `.gitignore` (add `scripts/bestiario/fonte/`)

**Interfaces:**
- **Produces:**
  - `scripts/bestiario/fonte/srd.json`: the original list, in English.
  - `scripts/bestiario/fonte/esqueleto-NN.json`: 17 lotes of 19–20 monsters, in alphabetical order of `slug`.
    - Each item is already in the `Monstro` format.
    - Numbers are filled in: `ca`, `pv`, `dadosDeVida`, `atributos`, `salvaguardas`, `pericias[].bonus`, `nd`, `xp` (via the same table as `xpDoNd`).
    - `id` is `srd-<slug>`, `nomeOriginal` is the English name, and `origem` is `'srd'`.
    - Text fields go in English, to be translated: `nome`, `tamanho`, `tipo`, `subtipo`, `tendencia`, `caDescricao`, `deslocamento`, `pericias[].nome`, resistances, `sentidos`, `idiomas`, and the texts of `tracos`, `acoes`, `acoesBonus`, `reacoes`, `lendarias` and `descricaoLendaria`.

- [ ] **Step 1: Write `preparar.mjs`.**
  - Fetch `https://api.open5e.com/v1/monsters/?document__slug=wotc-srd&limit=500` with `fetch` (Node 22).
  - Write `srd.json`, then the 17 skeletons.
  - Log `322 monstros, 17 lotes`.
- [ ] **Step 2:** Run `node scripts/bestiario/preparar.mjs`. Expected output: `322 monstros, 17 lotes`. Then `git status` shows no files in `fonte/`.
- [ ] **Step 3: Write `glossario.md`.**
  - Fixed English → PT-BR translations: sizes, types, alignments, damage types, conditions, the 18 skills (from `NOME_PERICIA`), attack phrases, "saving throw" → "teste de resistência", "DC" → "CD", "darkvision" → "visão no escuro", "blindsight" → "percepção às cegas", "tremorsense" → "sentido sísmico", "truesight" → "visão verdadeira", "passive Perception" → "Sabedoria (Percepção) passiva".
  - The foot → metre rule.
  - Official PT-BR names for the 30 most common monsters (Goblin, Orc, Kobold, Esqueleto, Zumbi, Urso-coruja, Lobo, Ogro, Troll, Dragões por cor e idade…).
- [ ] **Step 4: Commit** "Script e glossário para traduzir o bestiário".

### Task 3: Tradução dos 17 lotes

**Files:**
- Create: `src/regras/dnd5e/dados/monstros/srd/lote-01.json` … `lote-17.json`
- Create: `src/regras/dnd5e/dados/monstros/srd.ts`
- Test: `src/regras/dnd5e/dados/monstros/srd.test.ts`

**Interfaces:**
- **Consumes:** the Task 2 skeletons, plus `normalizarMonstro` and `Monstro` from Task 1.
- **Produces:** `carregarSRD(): Promise<Monstro[]>` in `srd.ts`.
  - It uses `import.meta.glob('./srd/lote-*.json', { import: 'default' })` (lazy, one chunk per lote) and normalizes with origem `'srd'`.
  - It caches the result in the module.

- [ ] **Step 1: Write the failing test `srd.test.ts`.**
  - `(await carregarSRD()).length === 322`, with unique ids.
  - Every monster has `nome !== nomeOriginal || nome` in the glossary's list of names identical in PT-BR (e.g. "Goblin", "Kraken").
  - **Spot checks:**
    - `srd-goblin`: ca 15, pv 7, nd "1/4", `acoes[0].nome === 'Cimitarra'`, and `acoes[0].texto` contains `'+4 para acertar'` and `'1,5 m'`;
    - `srd-adult-red-dragon`: pv 256, nd "17", 3 legendary actions.
  - **Leftover English:** no text field contains (case-insensitive, whole word) any of `to hit`, ` feet`, ` ft.`, `damage`, `saving throw`, ` the `, `creature`, `target`.
- [ ] **Step 2:** Run `npx vitest run src/regras/dnd5e/dados/monstros/srd.test.ts`. Expected: FAIL.
- [ ] **Step 3: For each lote NN from 01 to 17.**
  - Translate `fonte/esqueleto-NN.json` into `srd/lote-NN.json`, following `glossario.md`.
  - Change only text fields; keep numbers and ids.
  - Run `node -e` with `JSON.parse` to validate the JSON.
  - Commit "Bestiário: lote NN traduzido".
- [ ] **Step 4:** Run the test. Expected: PASS. Fix any lote with leftover English.
- [ ] **Step 5: Commit** "Bestiário do SRD completo em português".

### Task 4: Bloco de estatísticas e aba Monstros no Compêndio

**Files:**
- Create: `src/app/componentes/BlocoMonstro.tsx`
- Modify: `src/app/paginas/Compendio.tsx` (new section `['monstros', 'Monstros']`, type filter, ND filter)
- Modify: `src/app/estilos/paginas.css` (classes `.bloco-monstro*`)
- Test: `src/app/componentes/BlocoMonstro.test.tsx`

**Interfaces:**
- **Consumes:** `Monstro`, `filtrarMonstros`, `TIPOS_DE_MONSTRO` (Task 1); `carregarSRD` (Task 3); `useMeusMonstros` (Task 5) once it exists. In this task, the list is the SRD only.
- **Produces:** `BlocoMonstro({ m, aoRolar }: { m: Monstro; aoRolar?: (expressao: string, rotulo: string) => void })`.
  - It renders the head: name, then "Tamanho tipo (subtipo), tendência".
  - CA, PV (with dados de vida), deslocamento.
  - A table of the 6 attributes, each with its modifier.
  - Lines for saving throws, skills, resistances, senses, languages and "Nível de desafio X (Y XP)".
  - Sections for traits, Ações, Ações Bônus, Reações and Ações Lendárias, each only when not empty.
  - With `aoRolar`, every `+N para acertar` and every `(XdY + Z)` in the text becomes a button that calls `aoRolar('1d20+N' | 'XdY+Z', nomeDaAção)`. The combat (part 2) uses this.

- [ ] **Step 1: Write failing tests** with `renderToStaticMarkup` from `react-dom/server` (the project has no DOM test library; don't add one):
  - The Goblin shows "Cimitarra" and "Nível de desafio 1/4 (50 XP)", and has no "Reações" heading.
  - With `aoRolar`, the Goblin has 2 buttons `1d20+4` and 2 buttons `1d6+2`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3: Implement `BlocoMonstro`.**
  - The roll-split function is `trechosRolaveis(texto: string): ({ texto: string } | { expressao: string; rotulo: string })[]`, exported for the test.
  - Then implement the Compêndio section. It loads with `carregarSRD()` on open and shows "Carregando monstros…".
  - Add `<select>` filters: Tipo (from `TIPOS_DE_MONSTRO`) and ND (min/max).
  - Each item is an `Item` with title = name and detail = "ND X · Tipo".
  - Show the credit line from the Global Constraints at the end of the section.
- [ ] **Step 4:** Run `npx tsc -b && npx vitest run`. Expected: PASS. Then check by screenshot with Playwright, on mobile (Pixel 7) and on PC (1400px): the Monstros tab is open with the Goblin expanded, without horizontal scroll.
- [ ] **Step 5: Commit** "Compêndio: aba Monstros com bloco de estatísticas".

### Task 5: Meus monstros (sincronizados) e importar/exportar

**Files:**
- Create: `src/bestiario/meus.ts`
- Test: `src/bestiario/meus.test.ts`
- Modify: `src/app/main.tsx` (import `'../bestiario/meus'` next to the universal one, so the collection is registered before the first sync)

**Interfaces:**
- **Consumes:**
  - `registrarColecao`, `agendarSincronizacao` and `registrarExclusao` from `src/nuvem/nuvem.ts`;
  - `normalizarMonstro` (Task 1).
- **Produces:**
  - `useMeusMonstros(): Monstro[]`
  - `listarMeusMonstros(): Monstro[]`
  - `meusMonstros.salvar(m: Monstro): Monstro`: sets `origem: 'meu'` and `atualizadoEm`.
  - `meusMonstros.novo(): Monstro`: name "Novo monstro".
  - `meusMonstros.copiar(m: Monstro): Monstro`: new id `monstro-…`, name `"<nome> (cópia)"`, origem `'meu'`.
  - `meusMonstros.excluir(id: string): void`.
  - `exportarMonstros(lista: Monstro[]): string`: JSON `{ formato: 'tomo-monstros', versao: 1, monstros }`.
  - `importarMonstros(texto: string): { ok: true; quantos: number } | { ok: false; erro: string }`: gives new ids to everything it imports.
- **Storage and sync:**
  - localStorage key `tomo:monstros:v1`.
  - Collection `{ nome: 'monstros', pertence: id => id.startsWith('monstro-'), paraDados: m => ({ sistema: 'monstro', nome: m.nome, monstro: m }), deDados: d => d?.sistema === 'monstro' ? normalizarMonstro(d.monstro, 'meu') : null }`.

- [ ] **Step 1: Write the failing tests:**
  - `copiar(goblinDoSrd)` gives a different id starting with `monstro-`, origem `'meu'`, and the name `'Goblin (cópia)'`.
  - `importarMonstros('{"formato":"tomo-modelo"}')` returns `{ok:false}`, and the list stays the same.
  - `importarMonstros('x')` returns `{ok:false}`.
  - Importing two monsters returns `quantos === 2`, with new ids.
  - `exportarMonstros` → `importarMonstros` round-trip preserves `acoes`.
  - A monster without `acoesBonus` (old version) is normalized with `acoesBonus: []`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** Implement `meus.ts`, following the same pattern as `src/universal/armazenamento.ts`: module-level list, listeners, `gravar`, and `registrarColecao` at the end.
- [ ] **Step 4:** Run `npx tsc -b && npx vitest run`. Expected: PASS.
- [ ] **Step 5: Commit** "Meus monstros sincronizados na conta".

### Task 6: Tela do bestiário e editor de monstro

**Files:**
- Create: `src/app/paginas/bestiario/Bestiario.tsx`
- Create: `src/app/paginas/bestiario/EditorMonstro.tsx`
- Modify: `src/app/rotas.ts` (`{ nome: 'bestiario' }` → `#/bestiario`; `{ nome: 'monstro'; id }` → `#/monstro/:id`)
- Modify: `src/app/App.tsx` (render both)
- Modify: `src/app/paginas/Compendio.tsx` (in the Monstros section, a "Meus monstros" link to `#/bestiario`, and the mestre's monsters appear in the list with an "Meu" tag)
- Modify: `README.md` (Bestiário section, SRD credit)

**Interfaces:**
- **Consumes:** Tasks 1, 3, 4 and 5. `CampoRetrato` (`src/app/componentes/CampoRetrato.tsx`) for the photo.
- **Produces:**
  - Routes `caminho.bestiario()` and `caminho.monstro(id)`, used by the Combat in part 2.
  - `Bestiario` is also exported as `SeletorDeMonstro({ aoEscolher }: { aoEscolher: (m: Monstro) => void })`: the same searchable list (SRD + mine), without the page chrome. The Combat uses it inside a dialog.

- [ ] **Step 1: Bestiário page.**
  - Tabs "Meus monstros" and "SRD", search and filters (reuse `filtrarMonstros`).
  - Buttons: **Novo monstro**, **Importar** (file input `.json`; shows the `erro` or "N monstros importados"), **Exportar meus monstros**.
  - On each SRD item: **Copiar para meus monstros**. On each of mine: open the editor.
- [ ] **Step 2: `EditorMonstro`.**
  - Form with all fields of `Monstro`. Each list of texts (traits, actions…) gets add, remove and edit (name + text).
  - Optional photo.
  - Live preview with `BlocoMonstro` beside it on PC and below on mobile.
  - Saves on every change via `meusMonstros.salvar`.
  - **Excluir** asks for confirmation in `Dialogo`.
- [ ] **Step 3: Playwright test** (scratchpad `teste-bestiario.cjs`, `vite preview` on port 4173):
  1. Copy the Goblin from the SRD.
  2. Rename it to "Goblin chefe" and change PV to 21.
  3. Reload: the monster stays.
  4. Export, then import the same file: 2 "Goblin chefe".
  5. A screenshot on mobile and one on PC, both without horizontal scroll.
- [ ] **Step 4:** Run `npx tsc -b && npx vitest run && npm run build`. Expected: everything passes. In the build, the lotes appear as separate chunks (`dist/assets/lote-*.js`), not in `index-*.js`.
- [ ] **Step 5: Commit** "Bestiário: tela, editor e importação". Push to `main` and to the branch.
