/**
 * Campanhas no Supabase (Etapa 3). As regras de quem vê o quê estão no banco
 * (supabase/migrations/0002_campanhas.sql); aqui ficam só as chamadas.
 */
import { pareceComPersonagem } from '../armazenamento/personagens'
import { normalizarPersonagem } from '../regras/dnd5e/motor/criacao'
import type { Personagem } from '../regras/dnd5e/tipos'
import type { Rolagem } from '../rolagem/rolagem'
import type { Cartao } from '../escudo/cartoes'
import { normalizarFichaLivre, normalizarModelo, type FichaLivre, type Modelo } from '../universal/modelo'
import { juntarRolagens, lerRolagemDaMesa, linhaDeRolagem, normalizarCodigo, sistemaValido, type RolagemDaMesa, type SistemaDaCampanha } from './mesa'
import { depoisDeSincronizar, obterCliente, usuarioAtual } from './nuvem'

export interface Campanha {
  id: string
  nome: string
  mestre: string
  codigo: string
  notas: string
  sistema: SistemaDaCampanha
  tema: string
  descricao: string
  /** Imagem da campanha (data URL), ou null. */
  imagem: string | null
  criado_em: string
}

export interface NovaCampanha {
  nome: string
  sistema: SistemaDaCampanha
  tema: string
  descricao: string
  imagem?: string | null
}

export interface MembroDaMesa {
  usuario: string
  apelido: string
  personagem_id: string | null
  personagem_nome: string | null
  raca: string | null
  classe: string | null
  nivel: number | null
  /** 'dnd5e' ou 'livre' (ficha do construtor universal). */
  sistema: string | null
  modelo_nome: string | null
}

export interface MinhaCampanha extends Campanha {
  souMestre: boolean
  /** Ficha que vinculei a esta campanha (se sou jogador). */
  meuPersonagem: string | null
}

const COLUNAS = 'id, nome, mestre, codigo, notas, sistema, tema, descricao, imagem, criado_em'

export function erroLegivel(e: unknown): Error {
  const msg = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e)
  if (/código não encontrado/i.test(msg)) return new Error('Código não encontrado. Confira com o mestre.')
  if (/^(Limite|Muitas rolagens)/.test(msg)) return new Error(msg)
  if (/notas_tamanho|notas_mestre_tamanho/.test(msg)) return new Error('Anotação longa demais (máximo de 20 mil caracteres).')
  if (/sistema da campanha não muda/.test(msg)) return new Error(msg)
  if (/tema_tamanho/.test(msg)) return new Error('Tema longo demais (máximo de 80 caracteres).')
  if (/imagem_valida/.test(msg)) return new Error('Imagem grande demais. Tente outra foto.')
  if (/descricao_tamanho/.test(msg)) return new Error('Descrição longa demais (máximo de 2 mil caracteres).')
  if (/table "campanhas"/.test(msg)) return new Error('Não foi possível salvar a campanha. Confira se a sua conta já foi aprovada e tente de novo.')
  if (/personagens|foreign key|violates/i.test(msg))
    return new Error('Essa ficha não pôde entrar: ela precisa ser do sistema da campanha e já estar na nuvem (Conta → Sincronizar agora).')
  if (/fetch|network/i.test(msg)) return new Error('Sem conexão com a nuvem. Verifique a internet.')
  return new Error(msg || 'Algo deu errado.')
}

async function chamar<T>(f: (c: Awaited<ReturnType<typeof obterCliente>>) => PromiseLike<{ data: T; error: unknown }>): Promise<T> {
  try {
    const c = await obterCliente()
    const { data, error } = await f(c)
    if (error) throw error
    return data
  } catch (e) {
    throw erroLegivel(e)
  }
}

/* ---------- Vínculos (para compartilhar rolagens da ficha) ---------- */

let vinculos = new Map<string, string[]>()
let ultimaLista: MinhaCampanha[] = []

function lembrarVinculos(lista: MinhaCampanha[]) {
  ultimaLista = lista
  vinculos = new Map()
  for (const c of lista) {
    if (!c.meuPersonagem) continue
    vinculos.set(c.meuPersonagem, [...(vinculos.get(c.meuPersonagem) ?? []), c.id])
  }
}

/* ---------- Campanhas ---------- */

export async function listarCampanhas(): Promise<MinhaCampanha[]> {
  const eu = usuarioAtual()
  const [campanhas, meus] = await Promise.all([
    chamar((c) => c.from('campanhas').select(COLUNAS).order('criado_em', { ascending: false })),
    chamar((c) =>
      c
        .from('membros')
        .select('campanha_id, personagem_id')
        .eq('usuario', eu ?? ''),
    ),
  ])
  const vinculo = new Map((meus as { campanha_id: string; personagem_id: string | null }[]).map((m) => [m.campanha_id, m.personagem_id]))
  const lista = (campanhas as Campanha[]).map((c) => ({
    ...c,
    sistema: sistemaValido(c.sistema),
    tema: c.tema ?? '',
    descricao: c.descricao ?? '',
    imagem: c.imagem ?? null,
    souMestre: c.mestre === eu,
    meuPersonagem: vinculo.get(c.id) ?? null,
  }))
  lembrarVinculos(lista)
  return lista
}

export async function obterCampanha(id: string): Promise<MinhaCampanha | null> {
  const lista = await listarCampanhas()
  return lista.find((c) => c.id === id) ?? null
}

export async function criarCampanha(nova: NovaCampanha): Promise<string> {
  const linha = await chamar((c) =>
    c
      .from('campanhas')
      .insert({
        nome: nova.nome.trim(),
        sistema: nova.sistema,
        tema: nova.tema.trim(),
        descricao: nova.descricao.trim(),
        imagem: nova.imagem ?? null,
      })
      .select('id')
      .single(),
  )
  return (linha as { id: string }).id
}

export async function entrarNaCampanha(codigo: string, apelido: string): Promise<string> {
  return (await chamar((c) => c.rpc('entrar_na_campanha', { p_codigo: normalizarCodigo(codigo), p_apelido: apelido.trim() }))) as string
}

export async function mesaDaCampanha(id: string): Promise<MembroDaMesa[]> {
  return ((await chamar((c) => c.rpc('mesa_da_campanha', { c: id }))) ?? []) as MembroDaMesa[]
}

export async function vincularPersonagem(campanhaId: string, personagemId: string | null) {
  await chamar((c) =>
    c
      .from('membros')
      .update({ personagem_id: personagemId })
      .eq('campanha_id', campanhaId)
      .eq('usuario', usuarioAtual() ?? ''),
  )
  await listarCampanhas()
}

export async function salvarNotas(campanhaId: string, notas: string) {
  await chamar((c) => c.from('campanhas').update({ notas }).eq('id', campanhaId))
}

export async function lerNotasDoMestre(campanhaId: string): Promise<string> {
  const linha = await chamar((c) => c.from('notas_mestre').select('texto').eq('campanha_id', campanhaId).maybeSingle())
  return (linha as { texto: string } | null)?.texto ?? ''
}

/** Anotações só do mestre e os cartões do escudo (cartoes null = nunca personalizou). */
export async function lerEscudo(campanhaId: string): Promise<{ texto: string; cartoes: unknown }> {
  const linha = await chamar((c) => c.from('notas_mestre').select('texto, cartoes').eq('campanha_id', campanhaId).maybeSingle())
  const l = linha as { texto: string; cartoes: unknown } | null
  return { texto: l?.texto ?? '', cartoes: l?.cartoes ?? null }
}

export async function salvarCartoes(campanhaId: string, cartoes: Cartao[]) {
  await chamar((c) => c.from('notas_mestre').upsert({ campanha_id: campanhaId, cartoes, atualizado_em: new Date().toISOString() }))
}

export async function salvarNotasDoMestre(campanhaId: string, texto: string) {
  await chamar((c) => c.from('notas_mestre').upsert({ campanha_id: campanhaId, texto, atualizado_em: new Date().toISOString() }))
}

export async function trocarCodigo(campanhaId: string): Promise<string> {
  return (await chamar((c) => c.rpc('trocar_codigo', { c: campanhaId }))) as string
}

export async function alterarCampanha(campanhaId: string, campos: Partial<Pick<Campanha, 'nome' | 'tema' | 'descricao' | 'imagem'>>) {
  await chamar((c) => c.from('campanhas').update(campos).eq('id', campanhaId))
}

export async function sairDaCampanha(campanhaId: string) {
  await chamar((c) =>
    c
      .from('membros')
      .delete()
      .eq('campanha_id', campanhaId)
      .eq('usuario', usuarioAtual() ?? ''),
  )
  await listarCampanhas()
}

export async function removerDaMesa(campanhaId: string, usuario: string) {
  await chamar((c) => c.from('membros').delete().eq('campanha_id', campanhaId).eq('usuario', usuario))
}

export async function apagarCampanha(campanhaId: string) {
  await chamar((c) => c.from('campanhas').delete().eq('id', campanhaId))
  await listarCampanhas()
}

export type FichaDaMesa = { tipo: 'dnd5e'; personagem: Personagem } | { tipo: 'livre'; ficha: FichaLivre; modelo: Modelo }

/** Lê o que veio da nuvem: ficha de D&D ou ficha livre com a cópia do modelo. */
export function fichaDaMesaDeDados(dados: unknown): FichaDaMesa | null {
  const d = dados as { sistema?: string; ficha?: unknown; modelo?: unknown } | null
  if (d?.sistema === 'livre') {
    const ficha = normalizarFichaLivre(d.ficha)
    const modelo = normalizarModelo(d.modelo)
    return ficha && modelo ? { tipo: 'livre', ficha, modelo } : null
  }
  return pareceComPersonagem(dados) ? { tipo: 'dnd5e', personagem: normalizarPersonagem(dados) } : null
}

/** Ficha de um jogador da mesa, só para leitura do mestre. */
export async function lerFichaDaMesa(personagemId: string): Promise<FichaDaMesa | null> {
  const linha = (await chamar((c) => c.from('personagens').select('dados, excluido').eq('id', personagemId).maybeSingle())) as {
    dados: unknown
    excluido: boolean
  } | null
  if (!linha || linha.excluido) return null
  return fichaDaMesaDeDados(linha.dados)
}

/* ---------- Rolagens ao vivo ---------- */

const COLUNAS_ROLAGEM = 'id, campanha_id, autor, quem, rotulo, expressao, total, detalhe, criado_em'

export async function rolagensRecentes(campanhaId: string, limite = 50): Promise<RolagemDaMesa[]> {
  const linhas = (await chamar((c) =>
    c.from('rolagens').select(COLUNAS_ROLAGEM).eq('campanha_id', campanhaId).order('id', { ascending: false }).limit(limite),
  )) as unknown[]
  return juntarRolagens(
    [],
    linhas.map(lerRolagemDaMesa).filter((x): x is RolagemDaMesa => x !== null),
    limite,
  )
}

export async function limparRolagens(campanhaId: string) {
  await chamar((c) => c.from('rolagens').delete().eq('campanha_id', campanhaId))
}

/** Recebe cada rolagem nova da campanha. Devolve a função que para de ouvir. */
export function ouvirRolagens(campanhaId: string, aoChegar: (r: RolagemDaMesa) => void): () => void {
  let parar = () => {}
  let parado = false
  void obterCliente().then((c) => {
    if (parado) return
    const canal = c
      .channel(`rolagens:${campanhaId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rolagens', filter: `campanha_id=eq.${campanhaId}` }, (msg) => {
        const r = lerRolagemDaMesa(msg.new)
        if (r) aoChegar(r)
      })
      .subscribe()
    parar = () => void c.removeChannel(canal)
  })
  return () => {
    parado = true
    parar()
  }
}

export async function enviarRolagem(campanhaId: string, quem: string, r: Rolagem): Promise<RolagemDaMesa | null> {
  const linha = await chamar((c) =>
    c
      .from('rolagens')
      .insert(linhaDeRolagem(campanhaId, quem, r))
      .select(COLUNAS_ROLAGEM)
      .single(),
  )
  return lerRolagemDaMesa(linha)
}

/** Rolagem feita numa ficha (de D&D ou livre): vai para todas as campanhas em que ela está vinculada. */
export function compartilharRolagemDaFicha(ficha: { id: string; nome: string }, r: Rolagem) {
  if (!usuarioAtual()) return
  for (const campanhaId of vinculos.get(ficha.id) ?? []) {
    enviarRolagem(campanhaId, ficha.nome || 'Jogador', r).catch(() => {
      /* sem internet: a rolagem vale só aqui */
    })
  }
}

// Mantém os vínculos atualizados para compartilhar rolagens sem abrir a tela de campanhas.
depoisDeSincronizar(() => {
  listarCampanhas().catch(() => {
    /* as tabelas de campanha podem ainda não existir (só a migração 0001 rodou) */
  })
})

/** Rolagem feita na tela da campanha: vai para a mesa com o nome de quem rolou. */
export function compartilharRolagemNaCampanha(campanhaId: string, r: Rolagem, nomeDoPersonagem: (id: string) => string | undefined) {
  const c = ultimaLista.find((x) => x.id === campanhaId)
  if (!usuarioAtual() || !c) return
  const quem = c.souMestre ? 'Mestre' : (c.meuPersonagem && nomeDoPersonagem(c.meuPersonagem)) || 'Jogador'
  enviarRolagem(campanhaId, quem, r).catch(() => {})
}
