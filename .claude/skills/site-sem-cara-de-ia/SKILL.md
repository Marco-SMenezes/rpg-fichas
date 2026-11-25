---
name: site-sem-cara-de-ia
description: Criar ou refazer sites, landing pages e interfaces web com visual autoral (sem cara de IA) e código limpo. Use sempre que o pedido envolver construir, redesenhar ou melhorar páginas e telas web, mesmo que o usuário não peça "design" explicitamente.
---

# Site sem cara de IA, com código bom

Use esta skill sempre que o pedido for criar, redesenhar ou melhorar um site, página ou interface web. Responda em PT-BR, direto ao ponto.

## Referências (consulte, não copie)

- **taste-skill** (LeonxInx/taste-skill, tasteskill.dev): direção de arte, imagens de referência e checagem no navegador.
- **awesome-design-md** (VoltAgent/awesome-design-md, getdesign.md): arquivos DESIGN.md de marcas conhecidas, para gerar uma UI no estilo de uma delas.
- **web-interface-guidelines** (vercel-labs, vercel.com/design/guidelines): regras para construir interfaces na web.
- **playwright-cli** (microsoft, playwright.dev): screenshots, inspeção de seletores e gravação de código Playwright.

Antes de usar uma referência, tente abri-la (WebFetch ou GitHub). Se não conseguir acessar, diga isso em uma linha e peça ao usuário que anexe o conteúdo. Nunca invente o que uma referência diz.

## Fluxo

### 1. Direção (antes de qualquer código)
- **Faça todas as perguntas necessárias antes de criar qualquer coisa.** Não escreva código nem escolha o visual enquanto houver dúvida relevante. Use o que o usuário já informou e o que o projeto já mostra para não repetir perguntas, e faça só as que ainda mudariam o resultado. Cubra, no mínimo:
  1. Objetivo: o que o site precisa fazer e qual ação o visitante deve tomar.
  2. Público: quem vai usar e em que dispositivo (celular, desktop).
  3. Conteúdo: textos, logo, fotos e cores que já existem, e o que falta criar.
  4. Estrutura: páginas e seções necessárias.
  5. Referências: sites ou marcas que o usuário admira e o que odeia.
  6. Tom e estilo: sério, divertido, minimalista, ousado etc.
  7. Tecnologia: HTML/CSS/JS puro, React ou outra, e se há código existente para seguir.
  8. Funcionalidades: formulários, login, pagamentos, integrações.
  9. Publicação: onde será hospedado e se há prazo.
- Se o app permitir, use perguntas de múltipla escolha, em lotes de até 4. Caso contrário, envie uma lista numerada em uma única mensagem e espere as respostas.
- Se o usuário disser "decide por você" ou não souber responder, proponha uma resposta concreta com o motivo e deixe claro que é uma suposição sua.
- Antes de começar a construir, devolva um resumo curto do que entendeu e das suposições feitas, e só comece depois que o usuário confirmar.
- Escolha uma marca de referência do awesome-design-md que combine com o objetivo e leia o DESIGN.md dela. Diga qual escolheu e por quê.
- Aplique a direção de arte do taste-skill: defina tipografia, paleta, espaçamento e tom antes de construir.
- Resuma a direção em poucas linhas e siga em frente, a menos que o usuário queira ajustar.

### 2. Construção
- Siga as web-interface-guidelines da Vercel.
- Aplique o checklist de código abaixo.
- Evite o "visual de IA" (lista abaixo).

### 3. Conferência no navegador
- Use o Playwright para tirar screenshots em **celular e desktop**.
- Olhe os screenshots e corrija o que parecer genérico, desalinhado, apertado ou ilegível.
- Teste os fluxos principais (menu, formulários, links).
- Se o Playwright não estiver instalado, diga isso e peça ao usuário prints para conferir.

### 4. Qualidade (superpowers)
- **verification-before-completion:** só diga que terminou depois de rodar os comandos de verificação e ver o resultado.
- **systematic-debugging:** ao encontrar um bug, ache a causa antes de propor correção.
- **test-driven-development:** apenas quando houver lógica (formulários, cálculos, regras); páginas estáticas não precisam de testes.
- Não use o brainstorming e o plano completo do superpowers para ajustes pequenos.

## Evitar o "visual de IA"
- Gradientes roxo/azul genéricos e brilhos sem função.
- Grades de cartões idênticos com ícone, título e texto.
- Hero padrão com título gigante, dois botões e uma frase vaga.
- Emojis no lugar de ícones, sombras exageradas e cantos arredondados em tudo.
- Textos genéricos ("soluções inovadoras", "leve seu negócio ao próximo nível"). Escreva textos específicos para o assunto do site.
- Falta de hierarquia: tudo com o mesmo peso e o mesmo espaçamento.

## Checklist de código
- Estrutura clara: componentes pequenos, com uma responsabilidade cada.
- Nomes descritivos; sem código morto ou comentários desnecessários.
- HTML semântico, acessibilidade (rótulos, contraste, foco visível, navegação por teclado, texto alternativo).
- Responsivo desde o início; sem larguras fixas que quebrem no celular.
- Poucas dependências; justifique cada uma.
- Estilos organizados (variáveis para cores, fontes e espaçamentos).
- Imagens otimizadas e com dimensões definidas.

## Entrega
Diga em poucas linhas o que foi feito, mostre os screenshots conferidos e liste o que ainda falta, se houver.
