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

- Todas as raças do Livro do Jogador com sub-raças (anão, elfo, halfling, humano, draconato, gnomo, meio-elfo, meio-orc e tiefling); ladino com o arquétipo Assassino; antecedentes Criminoso e Charlatão.
- Criação guiada com nível inicial de 1 a 20 (acima do 1º, um passo "Níveis" pede PV, arquétipo, incrementos e especializações de cada nível), compra de pontos, valores padrão ou 4d6, e um passo de história (objetivo, passado, tendência, aparência e personalidade).
- Botão de aparência (paleta) no topo: modo automático, claro ou escuro e cor de destaque (cores prontas ou
  personalizada). As cores ficam em `src/app/estilos/tokens.css`; a lógica, em `src/tema/`.
- Ficha em painel de blocos: **Organizar** permite arrastar, mudar a largura e esconder blocos. O layout fica salvo por
  personagem e por aparelho, com um layout para celular e outro para telas largas (`src/layout/`).
- Ficha com PV atuais e temporários, inspiração, descansos curto e longo, subida de nível (PV, arquétipo, incremento,
  especialização), espaços de magia para conjuradores, inventário com carga e anotações.
- Rolador com d4 a d100, vantagem e desvantagem, modificadores, crítico e histórico. Tocar em atributo, perícia,
  resistência, iniciativa ou ataque rola o teste. No ataque: Ataque Furtivo e as duas partes do Assassinar.
- Lista de personagens com duplicar, excluir, exportar e importar em JSON.
