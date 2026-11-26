/**
 * Ponte entre a ficha do jogador e o combate. A ficha é a fonte da verdade:
 * - salvar a ficha manda vida atual/máxima/temporária para as linhas do jogador nos combates;
 * - rolar Iniciativa na ficha preenche a iniciativa;
 * - ajustes de vida pedidos pelo mestre são pegos (uma vez só) e aplicados na ficha.
 * Recebe o armazenamento por configurarPonte para não criar ciclo de importação.
 */
import { atualizarMeuParticipante, meusAjustesPendentes, meusParticipantes, pegarAjuste } from '../nuvem/combate'
import { nuvem } from '../nuvem/nuvem'
import { calcularFicha } from '../regras/dnd5e/motor/ficha'
import type { Personagem } from '../regras/dnd5e/tipos'
import type { FichaLivre, Modelo } from '../universal/modelo'
import { ajustarVidaLivre, aplicarDeltas, vidaDaFichaLivre } from './regras'

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

export function vidaParaEnviar(p: Personagem): { pv: number; pv_max: number; pv_temp: number } {
  return { pv: p.estado.pvAtual, pv_max: calcularFicha(p).pvMaximo, pv_temp: p.estado.pvTemporario }
}

async function enviar(fichaId: string, campos: Parameters<typeof atualizarMeuParticipante>[1]) {
  if (!ativa()) return
  try {
    const meus = (await meusParticipantes()).filter((x) => x.personagem_id === fichaId)
    await Promise.all(meus.map((x) => atualizarMeuParticipante(x.id, campos)))
  } catch {
    /* sem internet: vai na próxima vez que a ficha for salva */
  }
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
      const delta = await pegarAjuste(a.id)
      if (delta === null) continue
      if (p) armazem.salvarPersonagem(aplicarDeltas(p, [delta]))
      else if (f && modelo) armazem.salvarFichaLivre(ajustarVidaLivre(modelo, f, delta))
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
