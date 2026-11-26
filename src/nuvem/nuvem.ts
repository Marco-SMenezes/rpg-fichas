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
import type { Personagem } from '../regras/dnd5e/tipos'
import { nuvemConfigurada, SUPABASE_CHAVE, SUPABASE_URL } from './config'
import { lerExclusoes, mesclar, type Entidade, type Exclusoes, type Linha } from './sincronizacao'

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
  /** Conta aprovada pelo dono do Tomo (undefined = ainda verificando). */
  aprovado?: boolean
  /** Conta do dono: vê e aprova os pedidos. */
  admin?: boolean
  /** Pedidos de conta esperando aprovação (só para o dono). */
  pendentes?: number
}

let estado: EstadoNuvem = { status: nuvemConfigurada ? 'iniciando' : 'desligada', sincronizando: false }
const ouvintes = new Set<() => void>()
let aoMudarLocal: () => void = () => {}
let usuarioId: string | null = null
const aoSincronizar = new Set<() => void>()

/** Avisa outros módulos (campanhas) depois de cada sincronização bem-sucedida. */
export function depoisDeSincronizar(f: () => void) {
  aoSincronizar.add(f)
}

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
          mudar({
            status: 'deslogado',
            email: undefined,
            sincronizando: false,
            fichasDeOutraConta: undefined,
            aprovado: undefined,
            admin: undefined,
            pendentes: undefined,
          })
        }
      }, 0)
    })
    limparEndereco()
  } catch {
    mudar({ status: 'deslogado', erro: 'Não foi possível carregar o login. Verifique a internet.' })
  }
  window.addEventListener('online', () => void verificarEDepoisSincronizar())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void verificarEDepoisSincronizar()
  })
}

/* ---------- Login por e-mail ---------- */

function traduzirErro(e: unknown): string {
  const msg = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String(e.message) : ''
  if (/rate limit|too many|security purposes/i.test(msg)) return 'Muitas tentativas. Espere um minuto e tente de novo.'
  if (/^(Limite|Muitas rolagens|Conta aguardando|Só o dono|Não dá para recusar)/.test(msg)) return msg
  if (/personagens_tamanho/.test(msg)) return 'Uma ficha passou do tamanho máximo (2 MB). Tente uma foto menor.'
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha errados.'
  if (/already registered|already exists/i.test(msg)) return 'Já existe uma conta com esse e-mail. Use "Entrar".'
  if (/password should be|at least 6|weak password/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (/email not confirmed/i.test(msg)) return 'Esta conta ainda precisa confirmar o e-mail.'
  if (/unable to validate email|invalid format|email address .* is invalid/i.test(msg)) return 'Esse e-mail não parece válido.'
  if (/sending|smtp|error sending/i.test(msg)) return 'O servidor de e-mail do Tomo ainda não está configurado. Entre com e-mail e senha.'
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

/** Entra com e-mail e senha. */
export async function entrarComSenha(email: string, senha: string): Promise<string | null> {
  try {
    const c = await obterCliente()
    const { error } = await c.auth.signInWithPassword({ email, password: senha })
    return error ? traduzirErro(error) : null
  } catch (e) {
    return traduzirErro(e)
  }
}

/**
 * Cria a conta e já entra. Se o projeto exigir confirmação por e-mail, a conta
 * fica criada mas sem sessão, e a mensagem explica o que falta.
 */
export async function criarConta(email: string, senha: string, nome: string): Promise<string | null> {
  try {
    const c = await obterCliente()
    // O nome vai junto no pedido, para o dono do Tomo saber quem está pedindo.
    const { data, error } = await c.auth.signUp({ email, password: senha, options: { emailRedirectTo: enderecoDoSite(), data: { nome } } })
    if (error) return traduzirErro(error)
    if (!data.session) return 'Conta criada. Falta confirmar pelo link enviado ao seu e-mail antes de entrar.'
    return null
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

/**
 * Pergunta ao banco se a conta já foi aprovada pelo dono (e, para o dono,
 * quantos pedidos esperam). Devolve se está aprovada.
 */
export async function verificarConta(): Promise<boolean> {
  if (!usuarioId) return false
  try {
    const c = await obterCliente()
    const { data, error } = await c.rpc('minha_conta')
    if (error) throw error
    const linha = (Array.isArray(data) ? data[0] : data) as { aprovado: boolean; admin: boolean; pendentes: number } | undefined
    mudar({ aprovado: !!linha?.aprovado, admin: !!linha?.admin, pendentes: linha?.pendentes ?? 0 })
    return !!linha?.aprovado
  } catch (e) {
    mudar({ erro: traduzirErro(e) })
    return estado.aprovado === true
  }
}

/** Ao voltar para a aba: se a conta acabou de ser aprovada, faz o primeiro envio. */
async function verificarEDepoisSincronizar() {
  if (estado.status !== 'logado') return
  const antes = estado.aprovado
  const agora = await verificarConta()
  if (agora && !antes) await aoEntrar()
  else await sincronizar()
}

async function aoEntrar() {
  // Conta ainda não aprovada: nada sobe nem desce até o dono liberar.
  if (estado.aprovado !== true && !(await verificarConta())) return
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

/**
 * Uma coleção sincronizada na tabela `personagens`: fichas de D&D, fichas livres
 * e modelos. Cada uma sabe quais ids são dela e como guardar seus itens no jsonb.
 */
export interface Colecao<T extends Entidade> {
  nome: string
  pertence: (id: string) => boolean
  listar: () => T[]
  /** Troca a lista local inteira (já avisando a interface). */
  gravar: (lista: T[]) => void
  paraDados: (x: T) => unknown
  deDados: (dados: unknown) => T | null
}

const colecoesExtras: Colecao<Entidade>[] = []

/** Outros módulos (fichas livres) registram suas coleções para irem junto na sincronização. */
export function registrarColecao<T extends Entidade>(c: Colecao<T>) {
  colecoesExtras.push(c as unknown as Colecao<Entidade>)
}

const colecaoDnd: Colecao<Personagem> = {
  nome: 'fichas',
  pertence: (id) => !colecoesExtras.some((c) => c.pertence(id)),
  listar: listarPersonagens,
  gravar: (lista) => {
    salvarTodos(lista)
    aoMudarLocal()
  },
  paraDados: (p) => p,
  deDados: (d) => (pareceComPersonagem(d) ? normalizarPersonagem(d) : null),
}

function linhaRemota<T extends Entidade>(x: unknown, colecao: Colecao<T>): Linha<T> | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.atualizado_em !== 'string' || !colecao.pertence(r.id)) return null
  if (r.excluido === true) return { id: r.id, dados: null, atualizado_em: r.atualizado_em, excluido: true }
  const dados = colecao.deDados(r.dados)
  return dados ? { id: r.id, dados, atualizado_em: r.atualizado_em, excluido: false } : null
}

type Cliente = Awaited<ReturnType<typeof obterCliente>>

/** Junta uma coleção com as linhas da nuvem e devolve os ids de lápides resolvidas. */
async function sincronizarColecao<T extends Entidade>(c: Cliente, brutos: unknown[], colecao: Colecao<T>, lapides: Exclusoes): Promise<string[]> {
  const remotos = brutos.map((x) => linhaRemota(x, colecao)).filter((x): x is Linha<T> => x !== null)
  const locais = colecao.listar()
  const minhas = Object.fromEntries(Object.entries(lapides).filter(([id]) => colecao.pertence(id)))
  const m = mesclar(locais, minhas, remotos)

  if (m.enviar.length) {
    const linhas = m.enviar.map((l) => ({ ...l, dados: l.dados ? colecao.paraDados(l.dados) : {} }))
    const { error } = await c.from('personagens').upsert(linhas, { onConflict: 'id' })
    if (error) throw error
  }

  if (m.alteradosAqui.length) {
    // Respeita o que foi mexido aqui enquanto a nuvem respondia.
    const antes = new Map(locais.map((p) => [p.id, p.atualizadoEm]))
    const agora = colecao.listar()
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
    colecao.gravar(final.filter((p, i) => final.findIndex((x) => x.id === p.id) === i))
  }
  return Object.keys(minhas)
}

/** Id da conta conectada (ou null). */
export function usuarioAtual(): string | null {
  return usuarioId
}

/** Cliente do Supabase para os outros módulos da nuvem (campanhas). */
export { obterCliente }

export async function sincronizar() {
  if (estado.status !== 'logado' || estado.fichasDeOutraConta || !usuarioId || estado.aprovado !== true) return
  if (rodando) {
    pendente = true
    return
  }
  rodando = true
  mudar({ sincronizando: true })
  try {
    const c = await obterCliente()
    // Só as fichas da própria conta: o mestre também lê as fichas da mesa, mas elas não são dele.
    const { data, error } = await c.from('personagens').select('id, dados, atualizado_em, excluido').eq('dono', usuarioId)
    if (error) throw error
    const brutos = data ?? []
    const lapides = lerLapides()
    const resolvidas: string[] = []
    // Modelos antes das fichas livres, para a ficha que chega já achar o modelo.
    for (const colecao of [colecaoDnd as unknown as Colecao<Entidade>, ...colecoesExtras]) {
      resolvidas.push(...(await sincronizarColecao(c, brutos, colecao, lapides)))
    }

    // As lápides que existiam no começo já foram resolvidas.
    const restantes = lerLapides()
    for (const id of resolvidas) if (restantes[id] === lapides[id]) delete restantes[id]
    gravarLapides(restantes)
    gravarChave(CHAVE_CONTA, usuarioId)
    mudar({ erro: undefined, ultimaSincronizacao: new Date().toISOString() })
    aoSincronizar.forEach((f) => f())
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

/* ---------- Pedidos de conta (só o dono) ---------- */

export interface ContaDoTomo {
  usuario: string
  email: string
  nome: string
  criado_em: string
  aprovado: boolean
  admin: boolean
  fichas: number
  campanhas: number
}

async function chamarRpc<T>(nome: string, args?: Record<string, unknown>): Promise<T> {
  const c = await obterCliente()
  const { data, error } = await c.rpc(nome, args)
  if (error) throw new Error(traduzirErro(error))
  return data as T
}

export async function listarContas(): Promise<ContaDoTomo[]> {
  return (await chamarRpc<ContaDoTomo[]>('listar_contas')) ?? []
}

export async function aprovarConta(usuario: string) {
  await chamarRpc('aprovar_conta', { p_usuario: usuario })
  await verificarConta()
}

/** Recusa um pedido (apaga a conta) ou tira o acesso de quem já foi aprovado. */
export async function recusarConta(usuario: string) {
  await chamarRpc('recusar_conta', { p_usuario: usuario })
  await verificarConta()
}
