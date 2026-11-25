import type { EscolhaDeClasse } from '../tipos'

/** Manobras do Mestre de Batalha (LdJ p. 88). Resumos em palavras próprias; "dado" = dado de superioridade. */
export const MANOBRAS: EscolhaDeClasse['opcoes'] = [
  ['aparar', 'Aparar', 'Reação ao sofrer dano corpo a corpo: reduz o dano em dado + Des.'],
  ['ameacador', 'Ataque Ameaçador', 'Ao acertar: dado no dano e o alvo faz Sab ou fica amedrontado até o fim do seu próximo turno.'],
  ['encontrao', 'Ataque de Encontrão', 'Ao acertar: dado no dano e o alvo (Grande ou menor) faz For ou é empurrado até 4,5 m.'],
  ['finta', 'Ataque de Finta', 'Ação bônus: vantagem no próximo ataque contra uma criatura a 1,5 m neste turno; se acertar, dado no dano.'],
  ['manobra', 'Ataque de Manobra', 'Ao acertar: dado no dano e um aliado usa a reação para andar metade do deslocamento sem provocar o alvo.'],
  ['precisao', 'Ataque de Precisão', 'Soma o dado numa jogada de ataque, antes ou depois de rolar.'],
  ['desarmante', 'Ataque Desarmante', 'Ao acertar: dado no dano e o alvo faz For ou larga um item que segura.'],
  ['estendido', 'Ataque Estendido', 'Ataque corpo a corpo com +1,5 m de alcance; se acertar, dado no dano.'],
  ['provocante', 'Ataque Provocante', 'Ao acertar: dado no dano e o alvo faz Sab ou tem desvantagem para atacar outros que não você.'],
  ['trespassante', 'Ataque Trespassante', 'Ao acertar corpo a corpo, outra criatura a 1,5 m do alvo sofre o dado de dano se o ataque também a acertaria.'],
  ['contra-atacar', 'Contra-Atacar', 'Reação quando erram um ataque corpo a corpo em você: ataca de volta e soma o dado no dano.'],
  ['derrubar', 'Derrubar', 'Ao acertar: dado no dano e o alvo (Grande ou menor) faz For ou cai.'],
  ['distrativo', 'Golpe Distrativo', 'Ao acertar: dado no dano e o próximo ataque de outra criatura contra o alvo tem vantagem.'],
  ['comandante', 'Golpe do Comandante', 'Troca um dos seus ataques e a ação bônus: um aliado ataca com a reação e soma o dado no dano.'],
  ['inspirar', 'Inspirar', 'Ação bônus: um aliado ganha PV temporários iguais ao dado + Car.'],
  ['passo-evasivo', 'Passo Evasivo', 'Ao se mover, soma o dado na CA até terminar o movimento.'],
].map(([id, nome, resumo]) => ({ id: id!, nome: nome!, resumo: resumo! }))

/** Vagas de manobra: 3 no 3º nível e 2 a mais no 7º, 10º e 15º. */
export const NIVEIS_DE_MANOBRA = [3, 3, 3, 7, 7, 10, 10, 15, 15]
