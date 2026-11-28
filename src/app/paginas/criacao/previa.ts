import { obterRaca } from '../../../regras/dnd5e/dados'
import { criarPersonagem } from '../../../regras/dnd5e/motor/criacao'
import { calcularFicha } from '../../../regras/dnd5e/motor/ficha'
import type { Personagem } from '../../../regras/dnd5e/tipos'
import { planoDeNiveis } from './niveis'
import { atributosBase, type Rascunho } from './rascunho'

const ATRIBUTOS_PROVISORIOS = { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 }

/**
 * O personagem no nível final, só com o que já se sabe (atributos, incrementos e escolhas feitos até agora), para ler
 * os limites e a lista de magias sem esperar o passo Níveis ficar completo. Antes de fechar os atributos, usa valores
 * neutros para a lista de passos não mudar.
 */
export function previaDoPersonagem(r: Rascunho): Personagem | null {
  try {
    const p = criarPersonagem({ ...r, atributosBase: atributosBase(r) ?? ATRIBUTOS_PROVISORIOS })
    const incrementos = planoDeNiveis(r)
      .filter((x) => x.incremento)
      .map((x) => {
        const talento = r.talentosDeNivel?.[x.novoNivel]
        return talento ? { nivel: x.novoNivel, aumentos: {}, talento } : { nivel: x.novoNivel, aumentos: r.incrementos[x.novoNivel] ?? {} }
      })
    return {
      ...p,
      nivel: r.nivel,
      subclasseId: r.subclasseId ?? p.subclasseId,
      incrementos: [...p.incrementos, ...incrementos],
      escolhasDeClasse: r.escolhasDeClasse,
    }
  } catch {
    return null
  }
}

/** Idiomas que o personagem do rascunho já fala (raça, antecedente, subclasse e talentos), para não oferecer de novo. */
export function idiomasDoRascunho(r: Rascunho): string[] {
  const p = previaDoPersonagem(r)
  try {
    if (p) return calcularFicha(p).proficiencias.idiomas
  } catch {
    // Rascunho incompleto: cai no que a raça e o antecedente já dão.
  }
  return [...obterRaca(r.racaId).idiomas, ...r.idiomasEscolhidos.filter(Boolean)]
}
