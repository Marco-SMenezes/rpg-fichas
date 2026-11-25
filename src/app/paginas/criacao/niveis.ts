import { obterRaca, obterSubraca } from '../../../regras/dnd5e/dados'
import { ATRIBUTOS } from '../../../regras/dnd5e/dados/atributos'
import { somarAumentos } from '../../../regras/dnd5e/motor/ficha'
import { aumentosDoTalento } from '../../../regras/dnd5e/motor/talentos'
import { incrementoValido, problemaNasEscolhasDoTalento, requisitosDoNivel, type EscolhasDeNivel, type RequisitosDeNivel } from '../../../regras/dnd5e/motor/progressao'
import type { Atributo } from '../../../regras/dnd5e/tipos'
import { atributosBase, type Rascunho } from './rascunho'

/** Requisitos de cada nível do 2º até o nível inicial escolhido. */
export function planoDeNiveis(r: Rascunho): RequisitosDeNivel[] {
  return Array.from({ length: Math.max(0, r.nivel - 1) }, (_, i) => requisitosDoNivel(r.classeId, i + 2, r.subclasseId))
}

export function niveisDoRascunho(r: Rascunho): EscolhasDeNivel[] {
  return planoDeNiveis(r).map((req, i) => ({
    pv: r.pvModo === 'rolar' ? (r.pvRolagens[i] ?? req.pvMedio) : req.pvMedio,
    subclasseId: req.escolherSubclasse ? (r.subclasseId ?? undefined) : undefined,
    incremento: req.incremento && !r.talentosDeNivel?.[req.novoNivel] ? r.incrementos[req.novoNivel] : undefined,
    talento: req.incremento ? r.talentosDeNivel?.[req.novoNivel] : undefined,
    especializacoes: req.especializacoes ? r.especializacoesExtras : undefined,
    escolhas: Object.fromEntries(req.escolhas.map((e) => [e.id, r.escolhasDeClasse[e.id] ?? ''])),
  }))
}

/** O que falta escolher no passo Níveis, ou null. */
export function pendenciaNiveis(r: Rascunho): string | null {
  const plano = planoDeNiveis(r)
  if (r.pvModo === 'rolar' && r.pvRolagens.length < plano.length) return 'Role os pontos de vida de cada nível.'
  for (const req of plano) {
    if (req.escolherSubclasse && !r.subclasseId) return 'Escolha o arquétipo.'
    const talento = r.talentosDeNivel?.[req.novoNivel]
    if (req.incremento && talento) {
      const erro = problemaNasEscolhasDoTalento(talento)
      if (erro) return `${req.novoNivel}º nível: ${erro}`
    } else if (req.incremento && !incrementoValido(r.incrementos[req.novoNivel] ?? {})) {
      return `Complete o incremento de atributo do ${req.novoNivel}º nível.`
    }
    for (const e of req.escolhas) {
      if (!r.escolhasDeClasse[e.id]) return `Escolha: ${e.rotulo} (${req.novoNivel}º nível).`
    }
    if (req.especializacoes && r.especializacoesExtras.length !== req.especializacoes) {
      return `Escolha ${req.especializacoes} especializações do ${req.novoNivel}º nível.`
    }
  }
  return null
}

/** Atributos (base + raça + incrementos anteriores) logo antes do incremento de `nivel`. */
export function atributosAntesDoNivel(r: Rascunho, nivel: number): Record<Atributo, number> {
  const raca = obterRaca(r.racaId)
  const racial = somarAumentos(
    raca.aumentos,
    obterSubraca(raca, r.subracaId)?.aumentos ?? {},
    Object.fromEntries(r.escolhasRaciais.aumentos.map((a) => [a, 1])),
    raca.talento ? aumentosDoTalento(r.escolhasRaciais.talento) : {},
  )
  const base = atributosBase(r) ?? r.compra
  const valores = Object.fromEntries(ATRIBUTOS.map(({ id }) => [id, base[id] + racial[id]])) as Record<Atributo, number>
  for (const req of planoDeNiveis(r)) {
    if (req.novoNivel >= nivel || !req.incremento) continue
    const talento = r.talentosDeNivel?.[req.novoNivel]
    const inc = talento ? aumentosDoTalento(talento) : (r.incrementos[req.novoNivel] ?? {})
    for (const { id } of ATRIBUTOS) valores[id] = Math.min(20, valores[id] + (inc[id] ?? 0))
  }
  return valores
}
