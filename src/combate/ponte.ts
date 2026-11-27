/**
 * Ponte entre a ficha do jogador e o combate. A ficha é a fonte da verdade:
 * - salvar a ficha manda vida atual/máxima/temporária, testes contra a morte e condições para as linhas do jogador nos combates;
 * - rolar Iniciativa na ficha preenche a iniciativa;
 * - ajustes de vida e de condição pedidos pelo mestre são pegos (uma vez só) e aplicados na ficha.
 * Recebe o armazenamento por configurarPonte para não criar ciclo de importação.
 */
import { alterarParticipante, alterarSegredo, atualizarMeuParticipante, meusAjustesPendentes, meusParticipantes, pegarAjuste } from '../nuvem/combate'
import { nuvem } from '../nuvem/nuvem'
import { calcularFicha } from '../regras/dnd5e/motor/ficha'
import type { Personagem } from '../regras/dnd5e/tipos'
import type { FichaLivre, Modelo } from '../universal/modelo'
import { ajustarVidaLivre, aplicarDeltas, comCondicao, condicoesDaFicha, vidaDaFichaLivre } from './regras'

interface Armazem {
  listarPersonagens: () => Personagem[]
  salvarPersonagem: (p: Personagem) => Personagem
  listarFichasLivres: () => FichaLivre[]
  salvarFichaLivre: (f: FichaLivre) => FichaLivre
  listarModelos: () => Modelo[]
}

let armazem: Armazem | null = null

export function configurarPonte(a: Armazem) {
  armazem = a
}

const ativa = () => {
  const e = nuvem.ler()
  return e.status === 'logado' && e.aprovado === true
}

export function vidaParaEnviar(p: Personagem): {
  pv: number
  pv_max: number
  pv_temp: number
  morte_sucessos: number
  morte_falhas: number
  condicoes: string[]
  ca: number
} {
  const ficha = calcularFicha(p)
  return {
    pv: p.estado.pvAtual,
    pv_max: ficha.pvMaximo,
    pv_temp: p.estado.pvTemporario,
    morte_sucessos: p.estado.morte.sucessos,
    morte_falhas: p.estado.morte.falhas,
    condicoes: condicoesDaFicha(p),
    ca: ficha.ca.valor,
  }
}

type Campos = Parameters<typeof atualizarMeuParticipante>[1]

/** O que não chegou à nuvem (sem internet), por ficha; reenviado na volta da conexão ou na sincronização. */
const naoEnviado = new Map<string, Campos>()

async function enviar(fichaId: string, campos: Campos) {
  if (!ativa()) return
  try {
    const meus = (await meusParticipantes()).filter((x) => x.personagem_id === fichaId)
    await Promise.all(
      meus.map(async (x) => {
        if (x.tipo === 'jogador') return atualizarMeuParticipante(x.id, campos)
        // Ficha escondida do mestre: vida e condições no segredo, iniciativa direto na linha.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { iniciativa, morte_sucessos, morte_falhas, ...vida } = campos
        if (iniciativa !== undefined) await alterarParticipante(x.id, { iniciativa })
        if (Object.keys(vida).length) await alterarSegredo(x.id, vida)
      }),
    )
    naoEnviado.delete(fichaId)
  } catch {
    naoEnviado.set(fichaId, { ...naoEnviado.get(fichaId), ...campos })
  }
}

/** Tenta de novo o que ficou sem enviar. */
export async function reenviarPendentes() {
  for (const [fichaId, campos] of [...naoEnviado]) await enviar(fichaId, campos)
}

const esperando = new Map<string, ReturnType<typeof setTimeout>>()
function depois(id: string, f: () => void) {
  clearTimeout(esperando.get(id))
  esperando.set(
    id,
    setTimeout(() => {
      esperando.delete(id)
      f()
    }, 400),
  )
}

export function aoSalvarFicha(p: Personagem) {
  if (ativa()) depois(p.id, () => void enviar(p.id, vidaParaEnviar(p)))
}

export function aoSalvarFichaLivre(f: FichaLivre) {
  if (!ativa() || !armazem) return
  const modelo = armazem.listarModelos().find((m) => m.id === f.modeloId)
  const v = modelo && vidaDaFichaLivre(modelo, f)
  if (v) depois(f.id, () => void enviar(f.id, { pv: v.pv, pv_max: v.max, pv_temp: 0 }))
}

export async function aoRolarIniciativa(fichaId: string, total: number) {
  await enviar(fichaId, { iniciativa: total })
}

let aplicando = false
let deNovo = false

/** Pega os ajustes do mestre e aplica nas fichas deste aparelho. Devolve quantos aplicou. */
export async function aplicarAjustesPendentes(): Promise<number> {
  if (!ativa() || !armazem) return 0
  if (aplicando) {
    // Chegou outro aviso no meio: roda mais uma vez ao terminar, para não esperar a próxima sincronização.
    deNovo = true
    return 0
  }
  aplicando = true
  try {
    const [pendentes, meus] = await Promise.all([meusAjustesPendentes(), meusParticipantes()])
    let aplicados = 0
    for (const a of pendentes) {
      const fichaId = meus.find((m) => m.id === a.participante_id)?.personagem_id
      const p = fichaId && armazem.listarPersonagens().find((x) => x.id === fichaId)
      const f = fichaId && !p ? armazem.listarFichasLivres().find((x) => x.id === fichaId) : undefined
      const modelo = f && armazem.listarModelos().find((m) => m.id === f.modeloId)
      if (!p && !(f && modelo)) continue // a ficha não está neste aparelho: outro aparelho aplica
      const ajuste = await pegarAjuste(a.id)
      if (!ajuste) continue
      if (ajuste.delta !== null) {
        if (p) armazem.salvarPersonagem(aplicarDeltas(p, [ajuste.delta]))
        else if (f && modelo) armazem.salvarFichaLivre(ajustarVidaLivre(modelo, f, ajuste.delta))
      } else if (p && ajuste.condicao) {
        // Ficha personalizada não tem condições: a marca fica só na linha do combate.
        armazem.salvarPersonagem(comCondicao(p, ajuste.condicao, ajuste.ligar === true))
      }
      aplicados++
    }
    return aplicados
  } catch {
    return 0
  } finally {
    aplicando = false
    if (deNovo) {
      deNovo = false
      void aplicarAjustesPendentes()
    }
  }
}
