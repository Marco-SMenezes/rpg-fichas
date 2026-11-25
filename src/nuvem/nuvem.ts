/**
 * Conta e sincronização com o Supabase (Etapa 2).
 *
 * O cliente do Supabase só é baixado quando a nuvem está configurada
 * (import dinâmico), então o site sem conta continua leve e igual.
 * O aparelho continua sendo a fonte do dia a dia: a ficha é salva aqui
 * na hora e sobe para a nuvem logo depois, quando houver internet.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { listarPersonagens, pareceComPersonagem, salvarTodos } from '../armazenamento/personagens'
import { normalizarPersonagem } from '../regras/dnd5e/motor/criacao'
import { nuvemConfigurada, SUPABASE_CHAVE, SUPABASE_URL } from './config'
import { lerExclusoes, mesclar, type Exclusoes, type Linha } from './sincronizacao'

const CHAVE_EXCLUSOES = 'tomo:excluidos:v1'
const CHAVE_CONTA = 'tomo:conta:v1'
const ESPERA_PARA_SUBIR = 1500

export type StatusNuvem = 'desligada' | 'iniciando' | 'deslogado' | 'logado'

export interface EstadoNuvem {
  status: StatusNuvem
  email?: string
  sincronizando: boolean
  ultimaSincronizacao?: string
  erro?: string
  /** Fichas enviadas no primeiro login deste aparelho. */
  enviadasNoPrimeiroLogin?: number
  /** O aparelho tem fichas de outra conta: espera a pessoa decidir. */
  fichasDeOutraConta?: number
}

let estado: EstadoNuvem = { status: nuvemConfigurada ? 'iniciando' : 'desligada', sincronizando: false }
const ouvintes = new Set<() => void>()
let aoMudarLocal: () => void = () => {}
let usuarioId: string | null = null

function mudar(parcial: Partial<EstadoNuvem>) {
  estado = { ...estado, ...parcial }
  ouvintes.forEach((o) => o())
}

export const nuvem = {
  ler: () => estado,
  assinar(ouvinte: () => void) {
    ouvintes.add(ouvinte)
    return () => ouvintes.delete(ouvinte)
  },
  /** O estado das fichas avisa a interface quando a nuvem muda algo aqui. */
  aoMudarLocal(cb: () => void) {
    aoMudarLocal = cb
  },
}

/* ---------- Armazenamento auxiliar ---------- */

function lerChave(chave: string): string | null {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

function gravarChave(chave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(chave)
    else localStorage.setItem(chave, valor)
  } catch {
    /* sem armazenamento */
  }
}

const lerLapides = (): Exclusoes => lerExclusoes(lerChave(CHAVE_EXCLUSOES))
const gravarLapides = (e: Exclusoes) => gravarChave(CHAVE_EXCLUSOES, Object.keys(e).length ? JSON.stringify(e) : null)

/** Guarda a exclusão para os outros aparelhos também apagarem a ficha. */
export function registrarExclusao(id: string) {
  if (!nuvemConfigurada) return
  gravarLapides({ ...lerLapides(), [id]: new Date().toISOString() })
  agendarSincronizacao()
}

/* ---------- Cliente ---------- */

let cliente: Promise<SupabaseClient> | null = null

function obterCliente(): Promise<SupabaseClient> {
  cliente ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_CHAVE, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    }),
  )
  return cliente
}

function enderecoDoSite(): string {
  return window.location.origin + window.location.pathname
}

/** Tira o ?code=… do link mágico da barra de endereço, mantendo a rota (#/…). */
function limparEndereco() {
  const u = new URL(window.location.href)
  if (!u.searchParams.has('code') && !u.searchParams.has('error')) return
  window.history.replaceState(null, '', u.pathname + u.hash)
}

export async function iniciarNuvem() {
  if (!nuvemConfigurada) return
  try {
    const c = await obterCliente()
    c.auth.onAuthStateChange((evento, sessao) => {
      // Sem await aqui dentro: o Supabase pede para não chamar o cliente no callback.
      setTimeout(() => {
        if (sessao?.user) {
          const trocou = usuarioId !== sessao.user.id
          usuarioId = sessao.user.id
          mudar({ status: 'logado', email: sessao.user.email ?? undefined })
          if (trocou) void aoEntrar()
        } else if (evento === 'SIGNED_OUT' || evento === 'INITIAL_SESSION') {
          usuarioId = null
          mudar({ status: 'deslogado', email: undefined, sincronizando: false, fichasDeOutraConta: undefined })
        }
      }, 0)
    })
    limparEndereco()
  } catch {
    mudar({ status: 'deslogado', erro: 'Não foi possível carregar o login. Verifique a internet.' })
  }
  window.addEventListener('online', () => void sincronizar())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void sincronizar()
  })
}

/* ---------- Login por e-mail ---------- */

function traduzirErro(e: unknown): string {
  const msg = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String(e.message) : ''
  if (/rate limit|too many|security purposes/i.test(msg)) return 'Muitas tentativas. Espere um minuto e tente de novo.'
  if (/expired|invalid/i.test(msg)) return 'Código inválido ou vencido. Peça um novo.'
  if (/fetch|network/i.test(msg)) return 'Sem conexão com a nuvem. Verifique a internet.'
  return msg ? `Erro: ${msg}` : 'Algo deu errado. Tente de novo.'
}

export async function enviarCodigo(email: string): Promise<string | null> {
  try {
    const c = await obterCliente()
    const { error } = await c.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: enderecoDoSite() } })
    return error ? traduzirErro(error) : null
  } catch (e) {
    return traduzirErro(e)
  }
}

export async function confirmarCodigo(email: string, codigo: string): Promise<string | null> {
  try {
    const c = await obterCliente()
    const { error } = await c.auth.verifyOtp({ email, token: codigo, type: 'email' })
    return error ? traduzirErro(error) : null
  } catch (e) {
    return traduzirErro(e)
  }
}

/** Sai da conta. Com `apagarDaqui`, também remove as fichas deste aparelho (útil em aparelho emprestado). */
export async function sair(apagarDaqui: boolean) {
  const c = await obterCliente()
  await c.auth.signOut()
  if (apagarDaqui) {
    salvarTodos([])
    gravarLapides({})
    gravarChave(CHAVE_CONTA, null)
    aoMudarLocal()
  }
}

/* ---------- Troca de conta no mesmo aparelho ---------- */

async function aoEntrar() {
  const conta = lerChave(CHAVE_CONTA)
  const locais = listarPersonagens()
  if (conta && conta !== usuarioId && locais.length > 0) {
    mudar({ fichasDeOutraConta: locais.length })
    return
  }
  if (!conta && locais.length > 0) mudar({ enviadasNoPrimeiroLogin: locais.length })
  await sincronizar()
}

/**
 * O aparelho tinha fichas de outra conta. `juntar` sobe todas para a conta atual;
 * `trocar` apaga daqui (continuam na outra conta) e baixa as desta.
 */
export async function resolverOutraConta(escolha: 'juntar' | 'trocar') {
  if (escolha === 'trocar') {
    salvarTodos([])
    gravarLapides({})
    aoMudarLocal()
  }
  mudar({ fichasDeOutraConta: undefined })
  await sincronizar()
}

/* ---------- Sincronização ---------- */

let rodando = false
let pendente = false
let temporizador: ReturnType<typeof setTimeout> | undefined

/** Pede uma sincronização logo depois de uma alteração (junta várias seguidas). */
export function agendarSincronizacao() {
  if (!nuvemConfigurada) return
  clearTimeout(temporizador)
  temporizador = setTimeout(() => void sincronizar(), ESPERA_PARA_SUBIR)
}

function linhaRemota(x: unknown): Linha | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.atualizado_em !== 'string') return null
  if (r.excluido === true) return { id: r.id, dados: null, atualizado_em: r.atualizado_em, excluido: true }
  if (!pareceComPersonagem(r.dados)) return null
  return { id: r.id, dados: normalizarPersonagem(r.dados), atualizado_em: r.atualizado_em, excluido: false }
}

export async function sincronizar() {
  if (estado.status !== 'logado' || estado.fichasDeOutraConta || !usuarioId) return
  if (rodando) {
    pendente = true
    return
  }
  rodando = true
  mudar({ sincronizando: true })
  try {
    const c = await obterCliente()
    const { data, error } = await c.from('personagens').select('id, dados, atualizado_em, excluido')
    if (error) throw error
    const remotos = (data ?? []).map(linhaRemota).filter((x): x is Linha => x !== null)

    const locais = listarPersonagens()
    const lapides = lerLapides()
    const m = mesclar(locais, lapides, remotos)

    if (m.enviar.length) {
      const linhas = m.enviar.map((l) => ({ ...l, dados: l.dados ?? {} }))
      const { error: erroEnvio } = await c.from('personagens').upsert(linhas, { onConflict: 'id' })
      if (erroEnvio) throw erroEnvio
    }

    if (m.alteradosAqui.length) {
      // Respeita o que foi mexido aqui enquanto a nuvem respondia.
      const antes = new Map(locais.map((p) => [p.id, p.atualizadoEm]))
      const agora = listarPersonagens()
      const agoraPorId = new Map(agora.map((p) => [p.id, p]))
      const final = [
        ...agora.filter((p) => !antes.has(p.id)),
        ...m.locais
          .filter((p) => !antes.has(p.id) || agoraPorId.has(p.id))
          .map((p) => {
            const atual = agoraPorId.get(p.id)
            return atual && antes.get(p.id) !== atual.atualizadoEm ? atual : p
          }),
      ]
      salvarTodos(final.filter((p, i) => final.findIndex((x) => x.id === p.id) === i))
      aoMudarLocal()
    }

    // As lápides que existiam no começo já foram resolvidas.
    const restantes = lerLapides()
    for (const id of Object.keys(lapides)) if (restantes[id] === lapides[id]) delete restantes[id]
    gravarLapides(restantes)
    gravarChave(CHAVE_CONTA, usuarioId)
    mudar({ erro: undefined, ultimaSincronizacao: new Date().toISOString() })
  } catch (e) {
    mudar({ erro: navigator.onLine ? traduzirErro(e) : 'Sem internet: as alterações sobem quando a conexão voltar.' })
  } finally {
    rodando = false
    mudar({ sincronizando: false })
    if (pendente) {
      pendente = false
      void sincronizar()
    }
  }
}
