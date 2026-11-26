# Escudo do mestre, Combate e Bestiário — desenho

Data: 2026-11-26 · Status: aguardando aprovação

## Intenção

O mestre precisa conduzir a sessão dentro do Tomo sem ficar sobrecarregado:

- **rolar em segredo**;
- **ter à mão** as anotações e as consultas rápidas (que perícia usar, dano das armas, CDs);
- **conduzir combates** que os jogadores acompanham ao vivo.

A vida dos jogadores fica com os próprios jogadores. Assim o mestre não precisa atualizar a vida de todo mundo.

## Objetivos

1. **Abas da campanha.** A campanha ganha abas.
   - O **mestre** vê **Campanha** (a tela de hoje), **Escudo** e **Combate**.
   - O **jogador** vê **Campanha** e **Combate**.
2. **Escudo**, só do mestre:
   - rolagens secretas;
   - anotações "só do mestre";
   - cartões de consulta personalizáveis.
3. **Combate ao vivo.** Lista de participantes por iniciativa, com uma seta ▶ na vez atual e o botão **Próximo turno** (só o mestre aperta). Também mostra a rodada e o encerramento.
4. **Bestiário.** Os 322 monstros do SRD 5.1 em português, mais os monstros criados pelo mestre. Também entram no Compêndio (aba **Monstros**).
5. **Importar monstros** de arquivo para a conta do mestre. É o caminho para o Livro dos Monstros, que nunca vai para o código.

## Não objetivos (agora)

- Grade ou mapa de batalha, tokens, alcance.
- Mais de um combate ativo por campanha.
- Histórico de combates passados.
- Bestiário de outros sistemas. Em campanhas **Personalizadas**, os monstros são os criados pelo mestre.
- Escudo para jogadores.

## Anti-objetivos (seria fracasso mesmo funcionando)

- Jogador ver vida, CA ou condições dos monstros, ou as rolagens secretas do mestre. Isso vale também para a API, não só para a tela.
- Mestre ter de ajustar a vida de cada jogador.
- Conteúdo do Livro dos Monstros (ou qualquer livro não aberto) no repositório público.
- Combate travado ou dessincronizado entre aparelhos sem o usuário perceber.

## Restrições

- **Stack atual:** React 19, TS estrito, Supabase (RLS, Realtime) e testes de RLS em `supabase/testes`.
- **Aprovação de contas:** tudo novo passa pela política restritiva de aprovação (0005).
- **Repositório público:** o SRD 5.1 é CC BY 4.0, com crédito obrigatório no README e no Compêndio.
- **Tamanho:** o bestiário (centenas de KB) carrega sob demanda (`import()`), fora do pacote inicial.
- **Tela:** celular primeiro e largura total no PC, como o resto do site.

## Abordagens consideradas

- **Visibilidade do combate:**
  - (A) só o mestre vê;
  - (B) jogadores veem ao vivo. **Escolhida: B.**
- **Origem dos monstros:**
  - (A) SRD inteiro em PT-BR;
  - (B) SRD com textos em inglês;
  - (C) só monstros próprios. **Escolhida: A**, com monstros próprios e importação por cima.
- **Livro dos Monstros:** não pode ir no código (repositório público). O conteúdo vai por **arquivo importado** para a conta do mestre, guardado só na nuvem dele.
- **Vida no combate:** o mestre cuida só dos monstros. Cada jogador cuida da própria vida, pelo combate ou pela ficha.

## Desenho

### 1. Bestiário

**Dados do SRD** (`src/regras/dnd5e/dados/monstros/`):

- **Origem:** baixados uma vez da API Open5e (documento `wotc-srd`) e traduzidos para PT-BR com os mesmos termos que o Tomo já usa do Livro do Jogador: nomes de perícias, condições, tipos de dano, "Ataque Corpo a Corpo com Arma", "para acertar", "Acerto:".
- **O que fica guardado:** só o resultado traduzido, mais o nome original de cada monstro para busca.
- **Campos:**
  - identificação: `id`, `nome`, `nomeOriginal`, `tamanho`, `tipo`, `subtipo`, `tendencia`;
  - defesa e vida: `ca`, `caDescricao`, `pv`, `dadosDeVida`;
  - movimento e atributos: `deslocamento`, `atributos` (6 valores);
  - testes e perícias: `salvaguardas`, `pericias`;
  - resistências: `vulnerabilidades`, `resistencias`, `imunidades`, `imunidadesACondicao`;
  - percepção e idiomas: `sentidos`, `idiomas`;
  - desafio: `nd`, `xp`;
  - texto: `tracos[]`, `acoes[]`, `reacoes[]`, `lendarias[]` e `descricaoLendaria`. Cada item é `{nome, texto}`.
- **Testes:**
  - os 322 monstros estão presentes;
  - os números (CA, PV, atributos, ND) batem com a fonte;
  - não sobra texto em inglês nos campos traduzidos, com uma lista de palavras-sentinela.

**Meus monstros:**

- Nova coleção sincronizada `monstro-…`, na mesma tabela `personagens`, com `dados.sistema = 'monstro'`. Reaproveita a sincronização genérica, as regras de acesso e a aprovação. Ninguém além do dono lê.
- O formulário tem os mesmos campos do SRD, mais uma foto opcional (reaproveita `CampoRetrato`).
- **Copiar do SRD** cria um monstro próprio a partir de um do SRD, para editar.

**Importar e exportar:**

- O formato do arquivo é `{formato: 'tomo-monstros', monstros: [...]}`.
- Importar adiciona os monstros a **Meus monstros**. É o caminho do Livro dos Monstros: o arquivo é montado fora do repositório.

**Telas:**

- **Compêndio, aba Monstros:**
  - busca sem acento por nome em PT ou em inglês;
  - filtros por tipo e por ND;
  - ficha completa no formato de bloco de estatísticas;
  - crédito do SRD.
- **Bestiário do mestre**, acessado pelo Combate e pelo Escudo: SRD e Meus monstros juntos, com etiqueta de origem.

### 2. Combate

**Banco (migração 0009):**

- **`combates`:**
  - colunas: `id`, `campanha_id` (único: um ativo por campanha), `rodada`, `vez` (id do participante ou nulo), `criado_em`;
  - acesso: a mesa lê, só o mestre cria, altera e apaga.
- **`participantes`:**
  - **Campos públicos para a mesa:**
    - `id`, `combate_id`, `tipo` (`jogador` | `monstro`);
    - `personagem_id` e `usuario` (jogador);
    - `nome`, `resumo` ("Elfo · Ladino 3", "Personalizada · Cyberpunk", "Monstro · Goblin"), `foto` (data URL pequena, opcional);
    - `iniciativa`, `desempate` (bônus de Destreza);
    - vida do jogador: `pv`, `pv_max`, `pv_temp`.
  - **Quem lê:** a mesa.
  - **Quem altera:**
    - o mestre altera tudo;
    - o jogador só mexe na própria linha, e só na vida e na iniciativa, pela função `atualizar_meu_participante` (security definer, confere o dono).
- **`segredos_do_combate`:**
  - colunas: `participante_id`, `pv`, `pv_max`, `pv_temp`, `ca`, `condicoes text[]` e `monstro jsonb` (cópia do bloco de estatísticas, para o mestre abrir);
  - acesso: **só o mestre** lê e escreve.
  - Assim, a regra de acesso garante que o jogador nunca recebe a vida do monstro, nem pela API, nem pelo Realtime.
- **Realtime** nas três tabelas (o Realtime respeita o RLS).
- **Testes de RLS:**
  - jogador não lê `segredos_do_combate`;
  - não altera linha alheia nem a ordem;
  - não passa o turno;
  - intruso não vê o combate.

**Tela (aba Combate):**

```
Combate · Rodada 2                     [Próximo turno]
▶ [foto] Lia              Inic. 19   [−] 18/24 [+]
         Elfo · Ladino 3
  [foto] Goblin 1         Inic. 15   PV 4/7 · Envenenado   (só o mestre vê os PV)
         Monstro · Goblin
```

**Ações do mestre:**

- **Novo combate.**
- **+ Jogadores da mesa:** adiciona as fichas vinculadas, com foto, nome e resumo da ficha.
- **+ Monstro:** escolhe no bestiário e a quantidade. "Goblin ×4" vira Goblin 1 a 4, com PV médio do bloco e opção "rolar PV".
- **Rolar iniciativa dos monstros:** em segredo, 1d20 + Destreza.
- Editar a iniciativa de qualquer um.
- **Próximo turno:** segue a ordem por iniciativa (desc.), desempate pela Destreza e depois pelo nome. Ao voltar ao topo, rodada + 1.
- Vida, condições e remoção dos monstros.
- Tocar num monstro abre o bloco de estatísticas. Os ataques e as rolagens do bloco rolam **em segredo**.
- **Encerrar** apaga o combate.

**O jogador:**

- vê a mesma lista e a seta;
- vê a vida dos jogadores;
- dos monstros, vê só a foto (ou ícone), o nome, o resumo e a iniciativa;
- na própria linha: − e + da vida, com as mesmas regras da ficha (diminuir é dano, aumentar é cura, além do máximo vira temporário), e o campo da iniciativa.

**Ficha ↔ combate (jogador):**

- A ficha é a fonte da verdade.
- Mexer na vida pelo combate aplica `ajustarPV` na ficha local; a ficha sincroniza e atualiza a linha do combate.
- Mexer pela ficha, com um combate ativo em campanha vinculada, também atualiza a linha.
- Rolar **Iniciativa** na ficha, com combate ativo onde ela está vinculada, grava a iniciativa na linha.
- Funciona para fichas de D&D. Para fichas personalizadas, a vida vem do primeiro campo do tipo "recurso" (o mestre pode ajustar a qual campo corresponde mais tarde; agora é o primeiro).

### 3. Escudo do mestre

**Rolagens secretas:**

- Nas abas Escudo e Combate, o botão Dados do mestre rola **em segredo**: fica só no histórico do escudo e não vai para a mesa.
- Um interruptor **Mostrar para a mesa** manda a próxima rolagem para todos.
- Na aba Campanha, tudo segue como hoje: as rolagens vão para a mesa.

**Anotações só do mestre:** saem da seção Anotações e vêm para o Escudo. Usam a mesma tabela `notas_mestre`.

**Cartões de consulta:**

- **Onde ficam:** nova coluna `cartoes jsonb` em `notas_mestre`, só do mestre.
- **Formato do cartão:** `{id, titulo, texto, oculto}`. No texto, linhas com ` | ` viram tabela. As demais são parágrafos.
- **Cartões padrão em campanhas D&D 5e**, gerados dos dados do Tomo:
  1. **CDs típicas** (Muito fácil 5 … Quase impossível 30);
  2. **Perícias**: atributo e para que serve cada uma;
  3. **Armas**: dano, tipo e propriedades;
  4. **Armaduras**: CA, Força e Furtividade;
  5. **Condições**: resumo de cada;
  6. **Cobertura e visibilidade**;
  7. **Descanso e exaustão**.
- **Personalizar:** o mestre edita o título e o texto, oculta, reordena (arrastar, reaproveitando o @dnd-kit), cria novos e restaura o padrão.
- **Campanhas Personalizadas** começam sem cartões, com o botão **Adicionar cartão**.

## Ordem de entrega

Cada parte vai para o ar sozinha:

1. **Bestiário:** a tradução é a parte mais longa; ela entra também no Compêndio e em Meus monstros.
2. **Combate:** usa o bestiário.
3. **Escudo.**

## Decisões do construtor (chamadas minhas, para revisar)

- **Vida de jogadores:** os jogadores veem a vida uns dos outros, como na mesa física.
- **PV dos monstros:** começam com a média do bloco. "Rolar PV" é opcional.
- **Pedido de vez:** jogadores não passam o turno; só o mestre.
- **Combate e ficha ao mesmo tempo:** abrir o combate não fecha a ficha. O jogador alterna entre as duas abas.
- **Fotos dos jogadores:** são reduzidas para miniaturas de 96 px antes de entrar no participante.
- **Campos traduzidos:** termos de jogo seguem o Livro do Jogador em PT-BR. Nomes de monstros usam a tradução oficial brasileira mais conhecida, por exemplo "Goblin", "Urso-coruja" e "Dragão Vermelho Adulto".

## Em aberto (do usuário)

- O mestre também pode mexer na vida de um jogador pelo combate, por exemplo quando o jogador esquece? Se sim, a mudança precisa voltar para a ficha do jogador. Isso pede um caminho a mais: o aparelho do jogador aplica o que o mestre mudou.
