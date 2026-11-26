# Tomo

Fichas de D&D 5e (Livro do Jogador, 2014) que se calculam sozinhas: criação guiada, ficha interativa, rolador de dados e
fichas salvas no aparelho. Para uso pessoal entre amigos.

As regras entram no código só como **mecânica** (números, tabelas, fórmulas). As descrições são resumos curtos com
palavras próprias, sempre com a página do livro (ex.: “LdJ p. 91”). Cada habilidade tem um campo “Meu texto” para você
colar o texto completo do seu livro.

> As páginas seguem o PDF “Livro do Jogador – Biblioteca Élfica”. Se a sua mesa usa o livro impresso da Galápagos, a
> numeração pode ser diferente.

## Como rodar

Precisa do Node 20 ou mais novo.

```bash
npm install
npm run dev      # abre em http://localhost:5173/rpg-fichas/
npm test         # testes do motor de regras (Vitest)
npm run build    # gera o site em dist/
```

## Publicação

- **GitHub Pages (agora):** a cada push na `main`, a automação em `.github/workflows/pages.yml` roda os testes, gera o
  site e publica em `https://<usuário>.github.io/rpg-fichas/`. Na primeira vez, ative em *Settings → Pages → Source:
  GitHub Actions*.
- **Vercel (depois):** importe o repositório na Vercel e crie a variável de ambiente `BASE_PATH=/`. Nada mais muda: as
  rotas usam `#` (ex.: `#/p/abc`), que funcionam igual nos dois lugares.

As fichas ficam no navegador de cada endereço. Ao trocar de endereço (Pages → Vercel), use **Exportar** no site antigo e
**Importar** no novo.

## Conta e nuvem (Etapa 2, Supabase)

A nuvem está **ligada** no projeto Supabase `tomo` (região São Paulo); URL e chave pública ficam em `src/nuvem/config.ts`.
As migrações `0001` a `0008` já foram aplicadas (rode todas em ordem num projeto novo). Para montar outro projeto do zero:

1. Crie um projeto grátis em [supabase.com](https://supabase.com) (região São Paulo, se houver).
2. **SQL Editor → New query**: cole `supabase/migrations/0001_personagens.sql` e clique em *Run*. Depois, numa nova
   query, `0002_campanhas.sql`. Isso cria as tabelas com RLS (cada pessoa só vê as próprias fichas; o mestre só lê as
   fichas vinculadas à campanha dele) e liga as rolagens ao vivo.
3. **Authentication → URL Configuration**: em *Site URL* e *Redirect URLs*, coloque
   `https://marco-smenezes.github.io/rpg-fichas/`.
4. **Authentication → Emails → Magic Link**: no corpo do e-mail, acrescente `Seu código: {{ .Token }}` para o código
   de 6 dígitos aparecer junto do link.
5. **Project Settings → API**: copie a *Project URL* e a chave *anon public* (ou *publishable*) para
   `src/nuvem/config.ts`. **Nunca** use a chave `service_role`/`secret`: ela ignora o RLS.

Como funciona:

- Login por e-mail e senha (em Authentication → Sign In / Providers → Email, deixe **Confirm email** desligado). O login por código no e-mail existe no código, mas fica escondido (`codigoPorEmail` em `src/nuvem/config.ts`) até haver um servidor de e-mail próprio (SMTP), porque o padrão do Supabase só entrega para membros da organização.
- A ficha é salva no aparelho na hora e sobe ~1,5 s depois; também sincroniza ao abrir, ao voltar para a aba e quando
  a internet volta. Para cada ficha, **a versão mais nova vence**.
- O layout da ficha (Organizar) vai dentro da ficha, então também sincroniza.
- Exclusões viram `excluido = true` na nuvem, para sumirem dos outros aparelhos.
- No primeiro login, as fichas do aparelho sobem para a conta. Se o aparelho tiver fichas de outra conta, o Tomo
  pergunta se junta ou troca.
- Regras puras e testadas em `src/nuvem/sincronizacao.ts`; o cliente do Supabase só é baixado quando a nuvem está
  configurada.

## Campanhas (Etapa 3)

Aparecem no botão **Campanhas** da lista quando a nuvem está configurada.

- O mestre cria a campanha e recebe um **código de 6 caracteres** (pode gerar outro a qualquer momento).
- Ao criar, escolhe o **sistema**: *D&D 5e* (só entram fichas de D&D) ou *Personalizada* (só entram fichas
  personalizadas, do Construtor de fichas). O sistema não muda depois, e o banco confere a regra ao vincular a ficha
  (migração `0008`). Tema e descrição são opcionais e o mestre edita quando quiser.
- O jogador entra pelo código, escolhe qual ficha participa e pode trocar ou sair quando quiser.
- O mestre vê a **mesa** (quem está e com qual personagem) e abre cada ficha **só para leitura**.
- **Rolagens ao vivo:** o que o jogador rola na ficha vinculada aparece na tela da campanha na hora (Supabase
  Realtime). O mestre rola pela própria tela da campanha.
- **Anotações:** uma da mesa (todos leem, o mestre escreve) e uma só do mestre.

Contas precisam de aprovação (migração `0005_aprovacao.sql`): qualquer pessoa pode pedir conta (nome, e-mail e
senha), mas até o dono aprovar ela não lê nem grava nada no banco. O dono vê os pedidos em **Conta → Pedidos de
conta** (`#/contas`) e aprova, recusa (apaga a conta) ou tira o acesso depois. O dono é marcado em `privado.admins`
(fora do repositório, direto no banco).

Sem limites de uso para as contas aprovadas (a migração `0006` tirou os da `0004`). O Supabase ainda limita
tentativas de cadastro e login por endereço (em Authentication → Rate Limits).

As regras de acesso são testadas num Postgres local com `supabase/testes/rodar.sh` (33 verificações: ninguém vê
campanha sem código, jogador não lê notas do mestre, mestre não altera ficha, ninguém rola em nome de outro…).

## Estrutura de pastas

```
src/
  regras/dnd5e/          Motor de regras: só TypeScript puro, sem React
    tipos.ts             Tipos do sistema (raça, classe, personagem salvo…)
    dados/               Regras como dados: atributos, perícias, raças, classes,
                         antecedentes, equipamento, espaços de magia
    motor/
      calculos.ts        Fórmulas (modificador, proficiência, CA, PV, CD, carga…)
      ficha.ts           calcularFicha(personagem) → ficha calculada
      criacao.ts         Compra de pontos, 4d6, perícias, equipamento inicial
      progressao.ts      Dano, cura, descansos, subir de nível
      *.test.ts          Testes
  rolagem/               Rolador de dados (2d6+3, vantagem, crítico)
  layout/                Ordem, largura e visibilidade dos blocos da ficha
  armazenamento/         Salvar, exportar e importar (localStorage)
  nuvem/                 Conta e sincronização com o Supabase (Etapa 2)
  app/                   Interface React
    componentes/         Topo, diálogo, contador, rolador
    paginas/             Lista, criação guiada (criacao/), ficha (ficha/, com um
                         arquivo por grupo de blocos em ficha/blocos/)
    estilos/             tokens.css (cores, fontes, espaços) e CSS das telas
```

A regra principal: **o personagem salvo guarda só escolhas e estado** (atributos base, perícias escolhidas, PV atuais,
itens…). Tudo o que é calculado (modificadores, CA, bônus, ataques) sai de `calcularFicha`, então mudar um atributo
atualiza a ficha inteira.

## Como adicionar uma raça

1. Em `src/regras/dnd5e/dados/racas.ts`, crie um objeto `Raca` com aumentos de atributo, deslocamento, idiomas,
   perícias, armas e traços (`resumo` com palavras próprias e `pagina`).
2. Sub-raças vão em `subracas`. Um `deslocamento` na sub-raça substitui o da raça.
3. Inclua a raça na lista `RACAS`.
4. Escreva um teste em `motor/ficha.test.ts` criando um personagem com ela e conferindo os números.

## Como adicionar uma classe

1. Crie `src/regras/dnd5e/dados/<classe>.ts` exportando um `Classe` (veja `ladino.ts`): dado de vida, resistências,
   proficiências, opções de perícia, equipamento inicial, habilidades por nível, níveis de incremento, subclasses.
2. Conjuradores: preencha `conjuracao: { tipo: 'completo' | 'meio' | 'terco', atributo }`. Os espaços de magia saem da
   tabela em `dados/magia.ts`.
3. Registre a classe em `CLASSES` (`dados/index.ts`).
4. Recursos próprios (como o Ataque Furtivo do ladino) entram em `calcularFicha`, com teste.

Itens novos vão em `dados/equipamento.ts`. Pesos em kg e preços em peças de ouro.

## O que já existe (Etapa 1)

- Todas as raças do Livro do Jogador com sub-raças (anão, elfo, halfling, humano, draconato, gnomo, meio-elfo, meio-orc e tiefling); as 12 classes com todas as subclasses do livro (patrulheiro na versão revisada do PDF), incluindo magia de pacto do bruxo, domínios, círculos, escolas, colégios, invocações, manobras do Mestre de Batalha, metamágica, disciplinas elementais (com o nível exigido), Segredos Mágicos do bardo (magias de qualquer lista) e magias sempre preparadas. Ao subir de nível, dá para trocar uma manobra, disciplina ou invocação conhecida nos níveis em que o livro permite. Perícias, especializações, idiomas e truques "à escolha" de subclasses e invocações entram na ficha sozinhos; as invocações respeitam nível, pacto e o truque rajada mística (este vira aviso, porque as magias são escolhidas na ficha). Fichas antigas mostram "Faltam escolhas" para completar o que surgiu depois; os 13 antecedentes do livro.
- Regra opcional de talentos (LdJ p. 167–172): os 42 talentos, com pré-requisitos (atributo, conjuração, armadura) e escolhas próprias. Em cada incremento dá para trocar o aumento de atributos por um talento, e o humano variante (LdJ p. 31) já começa com um. Os efeitos com número entram na ficha (atributos, iniciativa, PV, deslocamento, passivas, resistências, perícias, idiomas, armaduras, armas e recursos); o resto aparece como habilidade com resumo e página (`dados/talentos.ts`). As magias de Iniciado em Magia, Atirador de Magia e Conjurador de Ritual entram no bloco de Magias (truques à vontade, magia de 1º nível 1 vez por descanso longo, rituais), com CD e ataque do atributo da lista escolhida, mesmo em classes que não conjuram.
- Criação guiada com nível inicial de 1 a 20 (acima do 1º, um passo "Níveis" pede PV, arquétipo, incrementos e especializações de cada nível), compra de pontos, valores padrão ou 4d6, e um passo de história (objetivo, passado, tendência, aparência e personalidade).
- Botão de aparência (paleta) no topo: modo automático, claro ou escuro e cor de destaque (cores prontas ou
  personalizada). As cores ficam em `src/app/estilos/tokens.css`; a lógica, em `src/tema/`.
- Ficha dividida em abas: a primeira, **Personalizada**, mostra só o que o jogador escolher (botão "Escolher o que aparece", com um olho por bloco); depois Geral, Combate, Perícias, Magias, Habilidades, Inventário e História. Em **Organizar**, cada bloco pode ir para outra aba, além de arrastar, mudar a largura e esconder. O layout fica salvo dentro
  da ficha (sobe para a conta, vai junto ao exportar e o mestre vê a ficha do jeito que o jogador organizou), com um
  layout para celular e outro para telas largas (`src/layout/`).
- Lista com as 361 magias do livro (mecânica, resumo próprio e página): escolher conhecidas ou preparadas, busca sem acento, filtro por nível e conjurar gastando o espaço (`dados/magias.ts`, gerado do PDF).
- Ficha com PV atuais e temporários, inspiração, descansos curto e longo, subida de nível (PV, arquétipo, incremento,
  especialização), espaços de magia para conjuradores, inventário com carga e anotações.
- Condições (LdJ p. 291–293) marcáveis na ficha, exaustão de 0 a 6 com os efeitos aplicados (deslocamento e PV máximo), concentração (marcada ao conjurar uma magia de concentração, com a CD do teste ao sofrer dano) e testes contra a morte com 0 PV (rolagem que marca sozinha, crítico conta duas falhas, morte instantânea).
- Rolador com d4 a d100, vantagem e desvantagem, modificadores, crítico e histórico. Tocar em atributo, perícia,
  resistência, iniciativa ou ataque rola o teste. No ataque: Ataque Furtivo e as duas partes do Assassinar.
- Foto do personagem opcional (primeiro passo da criação ou tocando no espaço da foto na ficha). A imagem é reduzida no aparelho para 480 px e vai junto com a ficha (exportação e nuvem).
- Lista de personagens com duplicar, excluir, exportar e importar em JSON.
- **Construtor de fichas** (fichas personalizadas, para qualquer sistema): o jogador monta um modelo com abas e campos (número,
  recurso atual/máximo, fórmula, rolagem, texto, texto longo, marcador e lista) e cria fichas com ele. Fórmulas como
  `floor((forca - 10) / 2)` são lidas por um leitor próprio (`src/universal/formula.ts`), sem executar código; ciclos e
  campos desconhecidos viram aviso no campo. Renomear um campo atualiza as fórmulas que usavam o nome antigo. Modelos e
  fichas sincronizam com a nuvem (mesma tabela `personagens`, com `dados.sistema` = `modelo` ou `livre`; cada ficha
  sobe com uma cópia do modelo) e podem ser vinculadas a campanhas do sistema *Personalizada*: o mestre abre só para leitura, as rolagens dela vão
  para a mesa. Também saem/entram por arquivo JSON.
- Aba **Compêndio** para consultar magias (filtro por lista e nível), classes e subclasses, raças, antecedentes, talentos e condições, com busca sem acento e a página do livro.
