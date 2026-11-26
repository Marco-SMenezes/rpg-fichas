/**
 * Layout de blocos da ficha: seção (aba), ordem, largura e visibilidade de cada bloco.
 * Funções puras, sem interface. Cada tela (estreita/larga) tem o próprio layout.
 */

export type Tela = 'estreita' | 'larga'

/** Colunas da grade em cada tela. */
export const COLUNAS: Record<Tela, number> = { estreita: 6, larga: 12 }

/** Larguras que o jogador pode escolher, em colunas. */
export const LARGURAS: Record<Tela, number[]> = {
  estreita: [2, 3, 6],
  larga: [2, 3, 4, 6, 8, 12],
}

export interface ItemLayout {
  id: string
  largura: number
  oculto: boolean
  /** Aba da ficha em que o bloco aparece. */
  secao: string
}

export type Layout = ItemLayout[]

export interface DefinicaoBloco {
  id: string
  /** Largura padrão em cada tela. */
  largura: Record<Tela, number>
  /** Aba padrão do bloco. */
  secao: string
}

export function layoutPadrao(blocos: DefinicaoBloco[], tela: Tela): Layout {
  return blocos.map((b) => ({ id: b.id, largura: b.largura[tela], oculto: false, secao: b.secao }))
}

function larguraValida(largura: number, tela: Tela): number {
  const opcoes = LARGURAS[tela]
  if (opcoes.includes(largura)) return largura
  // Arredonda para a opção mais próxima.
  return opcoes.reduce((melhor, x) => (Math.abs(x - largura) < Math.abs(melhor - largura) ? x : melhor))
}

/**
 * Junta um layout salvo com os blocos que existem agora: descarta blocos que
 * sumiram e encaixa os novos na posição padrão relativa (logo depois do bloco
 * que vem antes dele no padrão).
 */
export function normalizarLayout(salvo: unknown, blocos: DefinicaoBloco[], tela: Tela, secoes?: string[]): Layout {
  if (!Array.isArray(salvo)) return layoutPadrao(blocos, tela)
  const existentes = new Map(blocos.map((b) => [b.id, b]))
  const vistos = new Set<string>()
  const resultado: Layout = []
  for (const bruto of salvo) {
    const item = bruto as Partial<ItemLayout>
    if (typeof item?.id !== 'string' || !existentes.has(item.id) || vistos.has(item.id)) continue
    vistos.add(item.id)
    resultado.push({
      id: item.id,
      largura: larguraValida(typeof item.largura === 'number' ? item.largura : existentes.get(item.id)!.largura[tela], tela),
      oculto: item.oculto === true,
      // Layouts antigos não tinham seção: o bloco vai para a aba padrão dele.
      secao: typeof item.secao === 'string' && (!secoes || secoes.includes(item.secao)) ? item.secao : existentes.get(item.id)!.secao,
    })
  }
  blocos.forEach((b, indice) => {
    if (vistos.has(b.id)) return
    const anterior = blocos
      .slice(0, indice)
      .reverse()
      .find((x) => vistos.has(x.id))
    const posicao = anterior ? resultado.findIndex((x) => x.id === anterior.id) + 1 : 0
    resultado.splice(posicao, 0, { id: b.id, largura: b.largura[tela], oculto: false, secao: b.secao })
    vistos.add(b.id)
  })
  return resultado
}

/** Move o bloco `id` para a posição do bloco `alvo` (como num arrastar e soltar). */
export function moverPara(layout: Layout, id: string, alvo: string): Layout {
  const de = layout.findIndex((x) => x.id === id)
  const para = layout.findIndex((x) => x.id === alvo)
  if (de < 0 || para < 0 || de === para) return layout
  const novo = [...layout]
  const [item] = novo.splice(de, 1)
  novo.splice(para, 0, item!)
  return novo
}

/** Move uma posição para trás (-1) ou para frente (+1) dentro da mesma aba, pulando blocos ocultos. */
export function moverUmPasso(layout: Layout, id: string, direcao: -1 | 1): Layout {
  const secao = layout.find((x) => x.id === id)?.secao
  const visiveis = layout.filter((x) => !x.oculto && x.secao === secao)
  const i = visiveis.findIndex((x) => x.id === id)
  const vizinho = visiveis[i + direcao]
  return vizinho ? moverPara(layout, id, vizinho.id) : layout
}

export function mudarLargura(layout: Layout, id: string, largura: number, tela: Tela): Layout {
  return layout.map((x) => (x.id === id ? { ...x, largura: larguraValida(largura, tela) } : x))
}

export function alternarOculto(layout: Layout, id: string): Layout {
  return layout.map((x) => (x.id === id ? { ...x, oculto: !x.oculto } : x))
}

/** Leva o bloco para outra aba, no fim dela. */
export function moverParaSecao(layout: Layout, id: string, secao: string): Layout {
  const item = layout.find((x) => x.id === id)
  if (!item || item.secao === secao) return layout
  const resto = layout.filter((x) => x.id !== id)
  const ultimo = resto.map((x) => x.secao).lastIndexOf(secao)
  const novo = [...resto]
  novo.splice(ultimo + 1, 0, { ...item, secao })
  return novo
}

/** Id da aba montada pelo jogador. */
export const ABA_PERSONALIZADA = 'personalizada'

/**
 * Aba Personalizada: os mesmos blocos, numa lista própria em que `oculto`
 * diz se o bloco aparece nela. Sem nada salvo, mostra só `padraoVisiveis`.
 * Blocos que surgirem depois (ex.: Magias ao virar conjurador) entram escondidos.
 */
export function normalizarPersonalizada(salvo: unknown, blocos: DefinicaoBloco[], tela: Tela, padraoVisiveis: string[]): Layout {
  const comoAba = blocos.map((b) => ({ ...b, secao: ABA_PERSONALIZADA }))
  const layout = normalizarLayout(salvo, comoAba, tela)
  const salvos = new Set(Array.isArray(salvo) ? salvo.map((x) => (x as { id?: unknown })?.id) : [])
  return layout.map((x) => ({
    ...x,
    secao: ABA_PERSONALIZADA,
    oculto: Array.isArray(salvo) ? (salvos.has(x.id) ? x.oculto : true) : !padraoVisiveis.includes(x.id),
  }))
}

/** Mostra ou esconde todos os blocos de uma vez. */
export function definirTodosOcultos(layout: Layout, oculto: boolean): Layout {
  return layout.map((x) => ({ ...x, oculto }))
}
