# Glossário do bestiário

Regras para traduzir os monstros do SRD 5.1. O que é fixo está em `glossario.mjs` e é aplicado
automaticamente (`pretraduzir`). Este arquivo guia a tradução manual da prosa de cada lote.

## Fluxo

1. `node scripts/bestiario/preparar.mjs`: baixa a fonte para `fonte/` (fora do git).
2. `node scripts/bestiario/pendentes.mjs NN > fonte/pendentes-NN.json`: lista o que falta traduzir.
3. Traduzir em `fonte/mapa-NN.json` (mesmo formato: original → tradução).
4. `node scripts/bestiario/aplicar.mjs NN`: grava `src/regras/dnd5e/dados/monstros/srd/lote-NN.json`
   e aponta textos que ainda parecem inglês.

## Termos

- **Testes:**
  - saving throw → teste de resistência;
  - "succeed on a DC 13 Wisdom saving throw" → "ser bem-sucedido num teste de resistência de Sabedoria CD 13";
  - "on a failed save" → "se falhar";
  - "half as much damage on a successful one" → "metade desse dano se passar".
- **Ataques:**
  - attack roll → jogada de ataque;
  - "has advantage on" → "tem vantagem em";
  - "disadvantage" → desvantagem.
- **Ações:**
  - bonus action → ação bônus;
  - reaction → reação;
  - Dash/Disengage/Dodge/Help/Hide → Disparada/Desengajar/Esquivar/Ajudar/Esconder.
- **Condições:**
  - frightened → amedrontado;
  - grappled (escape DC 13) → agarrado (CD 13 para escapar);
  - restrained → impedido;
  - prone → caído.
  - As demais seguem `CONDICAO`.
- **Pontos de vida:**
  - hit points → pontos de vida;
  - temporary hit points → pontos de vida temporários;
  - "hit point maximum" → "máximo de pontos de vida".
- **Descanso:** short/long rest → descanso curto/longo.
- **Magias:** em itálico (_magia_), com o nome em PT-BR do Livro do Jogador (`nomesDeMagias.ts`), por exemplo _bola de fogo_, _mãos mágicas_.
- **Distâncias:**
  - 5 pés = 1,5 m. No texto corrido, "9 metros"; em alcances e sentidos, "9 m".
  - Cone/linha/esfera: "um cone de 18 metros", "uma linha de 18 metros de comprimento e 1,5 metro de largura".
- **Criaturas:** "the dragon" → "o dragão", com o artigo e o gênero do nome em PT-BR.

## Nomes de monstros

- Usam a tradução brasileira mais conhecida (Livro dos Monstros PT-BR). Exemplos:
  - Goblin, Orc, Kobold, Gnoll, Ogro, Troll;
  - Esqueleto, Zumbi, Carniçal, Lich, Vampiro;
  - Urso-coruja, Lobo, Lobo Atroz, Rato Gigante;
  - Basilisco, Medusa, Mímico, Cubo Gelatinoso.
- **Dragões:** "Dragão Vermelho Adulto", "Filhote de Dragão Azul", "Dragão de Bronze Jovem", "Dragão Negro Ancião".
- **Sem tradução conhecida:** mantém o nome original (ex.: "Otyugh", "Chuul").
