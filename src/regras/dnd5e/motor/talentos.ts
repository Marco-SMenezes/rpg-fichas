/** Talentos do personagem e a soma dos efeitos deles (sem depender da ficha calculada). */
import { obterRaca } from '../dados'
import { TALENTO_POR_ID } from '../dados/talentos'
import type { EfeitosDeTalento, Personagem, Talento, TalentoEscolhido, ValoresAtributos } from '../tipos'

export interface TalentoDoPersonagem {
  talento: Talento
  escolhas: Record<string, string>
  /** 'raça' (humano variante) ou o nível do incremento trocado. */
  origem: 'raça' | number
}

/** Talentos que valem no nível atual: o do humano variante e os trocados por incremento. */
export function talentosDe(p: Personagem): TalentoDoPersonagem[] {
  const lista: TalentoDoPersonagem[] = []
  const racial = p.escolhasRaciais?.talento
  if (racial && obterRaca(p.racaId).talento && TALENTO_POR_ID[racial.id]) {
    lista.push({ talento: TALENTO_POR_ID[racial.id]!, escolhas: racial.escolhas ?? {}, origem: 'raça' })
  }
  for (const i of p.incrementos) {
    if (i.nivel > p.nivel || !i.talento || !TALENTO_POR_ID[i.talento.id]) continue
    lista.push({ talento: TALENTO_POR_ID[i.talento.id]!, escolhas: i.talento.escolhas ?? {}, origem: i.nivel })
  }
  return lista
}

/** Aumentos de atributo de um talento escolhido (para a conta de atributos). */
export function aumentosDoTalento(t: TalentoEscolhido | undefined | null): Partial<ValoresAtributos> {
  if (!t) return {}
  return TALENTO_POR_ID[t.id]?.efeitos?.(t.escolhas ?? {}).aumentos ?? {}
}

/** Soma dos efeitos de todos os talentos (sem os aumentos, que entram nos atributos). */
export function efeitosDosTalentos(p: Personagem): Required<Omit<EfeitosDeTalento, 'aumentos' | 'detalhes'>> {
  const soma = {
    iniciativa: 0,
    pvPorNivel: 0,
    deslocamento: 0,
    passivas: 0,
    resistencias: [] as EfeitosDeTalento['resistencias'] & {},
    pericias: [] as EfeitosDeTalento['pericias'] & {},
    idiomas: [] as string[],
    armaduras: [] as EfeitosDeTalento['armaduras'] & {},
    armas: [] as string[],
    desMaxArmaduraMedia: 0,
    recursos: [] as EfeitosDeTalento['recursos'] & {},
  }
  for (const { talento, escolhas } of talentosDe(p)) {
    const e = talento.efeitos?.(escolhas) ?? {}
    soma.iniciativa += e.iniciativa ?? 0
    soma.pvPorNivel += e.pvPorNivel ?? 0
    soma.deslocamento += e.deslocamento ?? 0
    soma.passivas += e.passivas ?? 0
    soma.resistencias.push(...(e.resistencias ?? []))
    soma.pericias.push(...(e.pericias ?? []))
    soma.idiomas.push(...(e.idiomas ?? []))
    soma.armaduras.push(...(e.armaduras ?? []))
    soma.armas.push(...(e.armas ?? []))
    soma.desMaxArmaduraMedia = Math.max(soma.desMaxArmaduraMedia, e.desMaxArmaduraMedia ?? 0)
    soma.recursos.push(...(e.recursos ?? []))
  }
  return soma
}

/** Texto do talento na ficha: resumo e o que foi escolhido. */
export function descricaoDoTalento(t: Talento, escolhas: Record<string, string>): string {
  const detalhes = t.efeitos?.(escolhas).detalhes ?? []
  return [t.resumo, ...detalhes.map((d) => `${d}.`)].join(' ')
}
