/**
 * Combate ao vivo no Supabase (migração 0010). As regras de quem vê o quê estão no banco:
 * jogadores nunca recebem vida, CA nem condições dos monstros (segredos_do_combate).
 */
import { nomesNumerados, ordenarParticipantes, proximoTurno, rolarPV, vezDepoisDeRemover } from '../combate/regras'
import type { Monstro } from '../regras/dnd5e/dados/monstros/tipos'
import { erroLegivel } from './campanhas'
import { obterCliente, usuarioAtual } from './nuvem'

export interface Combate {
  id: string
  campanha_id: string
  rodada: number
  vez: string | null
}

export interface Participante {
  id: string
  combate_id: string
  tipo: 'jogador' | 'monstro'
  personagem_id: string | null
  usuario: string | null
  nome: string
  resumo: string
  foto: string | null
  iniciativa: number | null
  desempate: number
  pv: number | null
  pv_max: number | null
  pv_temp: number | null
}

export interface Segredo {
  participante_id: string
  pv: number
  pv_max: number
  pv_temp: number
  ca: number
  condicoes: string[]
  monstro: Monstro | null
}

export interface EstadoDoCombate {
  combate: Combate | null
  participantes: Participante[]
  segredos: Record<string, Segredo>
}

export interface NovaLinhaJogador {
  personagem_id: string
  usuario: string
  nome: string
  resumo: string
  foto: string | null
  desempate: number
  pv: number
  pv_max: number
  pv_temp: number
}

type NovoParticipante = Omit<Participante, 'id' | 'combate_id' | 'pv' | 'pv_max' | 'pv_temp'> & Partial<Pick<Participante, 'pv' | 'pv_max' | 'pv_temp'>>

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

const COLUNAS_PARTICIPANTE = 'id, combate_id, tipo, personagem_id, usuario, nome, resumo, foto, iniciativa, desempate, pv, pv_max, pv_temp'
const mod = (v: number) => Math.floor((v - 10) / 2)

/* ---------- Linhas (puras) ---------- */

export function linhaDeSegredo(m: Monstro, pv: number): Omit<Segredo, 'participante_id'> {
  return { pv, pv_max: pv, pv_temp: 0, ca: m.ca, condicoes: [], monstro: m }
}

/** Participantes e segredos para `quantidade` cópias do monstro. */
export function linhasDeMonstros(
  m: Monstro,
  quantidade: number,
  rolar: boolean,
  existentes: string[],
  rng: () => number = Math.random,
): { participante: NovoParticipante; segredo: Omit<Segredo, 'participante_id'> }[] {
  return nomesNumerados(m.nome, quantidade, existentes).map((nome) => ({
    participante: {
      tipo: 'monstro',
      personagem_id: null,
      usuario: null,
      nome,
      resumo: `Monstro · ${m.tipo || 'sem tipo'}`,
      foto: m.foto ?? null,
      iniciativa: null,
      desempate: mod(m.atributos.des),
    },
    segredo: linhaDeSegredo(m, rolar ? rolarPV(m.dadosDeVida, m.pv, rng) : m.pv),
  }))
}

/* ---------- Leitura e tempo real ---------- */

export async function carregarCombate(campanhaId: string): Promise<EstadoDoCombate> {
  const combate = (await chamar((c) =>
    c.from('combates').select('id, campanha_id, rodada, vez').eq('campanha_id', campanhaId).maybeSingle(),
  )) as Combate | null
  if (!combate) return { combate: null, participantes: [], segredos: {} }
  const participantes = (await chamar((c) =>
    c.from('participantes').select(COLUNAS_PARTICIPANTE).eq('combate_id', combate.id).order('criado_em'),
  )) as Participante[]
  const ids = participantes.map((p) => p.id)
  // Para jogadores o RLS devolve nada: os segredos são só do mestre.
  const segredos = ids.length
    ? ((await chamar((c) =>
        c.from('segredos_do_combate').select('participante_id, pv, pv_max, pv_temp, ca, condicoes, monstro').in('participante_id', ids),
      )) as Segredo[])
    : []
  return {
    combate,
    participantes: ordenarParticipantes(participantes),
    segredos: Object.fromEntries(segredos.map((s) => [s.participante_id, { ...s, monstro: s.monstro && 'nome' in s.monstro ? s.monstro : null }])),
  }
}

/** Avisa a cada mudança no combate desta campanha (a tela recarrega). Devolve a função que para de ouvir. */
export function ouvirCombate(campanhaId: string, aoMudar: () => void): () => void {
  let parar = () => {}
  let parado = false
  void obterCliente().then((c) => {
    if (parado) return
    let canal = c.channel(`combate:${campanhaId}`)
    for (const tabela of ['combates', 'participantes', 'segredos_do_combate', 'ajustes_de_vida'])
      canal = canal.on('postgres_changes', { event: '*', schema: 'public', table: tabela }, () => aoMudar())
    canal.subscribe()
    parar = () => void c.removeChannel(canal)
  })
  return () => {
    parado = true
    parar()
  }
}

/* ---------- Mestre ---------- */

export async function novoCombate(campanhaId: string) {
  await chamar((c) => c.from('combates').insert({ campanha_id: campanhaId }))
}

export async function encerrarCombate(combateId: string) {
  await chamar((c) => c.from('combates').delete().eq('id', combateId))
}

export async function adicionarJogadores(combateId: string, linhas: NovaLinhaJogador[]) {
  if (!linhas.length) return
  await chamar((c) => c.from('participantes').insert(linhas.map((l) => ({ ...l, combate_id: combateId, tipo: 'jogador', iniciativa: null }))))
}

export async function adicionarMonstros(combateId: string, m: Monstro, quantidade: number, rolar: boolean, existentes: string[]) {
  const linhas = linhasDeMonstros(m, quantidade, rolar, existentes)
  const criados = (await chamar((c) =>
    c
      .from('participantes')
      .insert(linhas.map((l) => ({ ...l.participante, combate_id: combateId })))
      .select('id, nome'),
  )) as { id: string; nome: string }[]
  const porNome = new Map(linhas.map((l) => [l.participante.nome, l.segredo]))
  await chamar((c) => c.from('segredos_do_combate').insert(criados.map((p) => ({ ...porNome.get(p.nome)!, participante_id: p.id }))))
}

export async function alterarParticipante(id: string, campos: Partial<Pick<Participante, 'iniciativa' | 'nome'>>) {
  await chamar((c) => c.from('participantes').update(campos).eq('id', id))
}

export async function alterarSegredo(id: string, campos: Partial<Pick<Segredo, 'pv' | 'pv_max' | 'pv_temp' | 'condicoes'>>) {
  await chamar((c) => c.from('segredos_do_combate').update(campos).eq('participante_id', id))
}

export async function removerParticipante(estado: EstadoDoCombate, id: string) {
  const cb = estado.combate
  if (!cb) return
  const vez = vezDepoisDeRemover(ordenarParticipantes(estado.participantes), cb.vez, id)
  if (vez !== cb.vez) await chamar((c) => c.from('combates').update({ vez }).eq('id', cb.id))
  await chamar((c) => c.from('participantes').delete().eq('id', id))
}

export async function passarTurno(estado: EstadoDoCombate) {
  const cb = estado.combate
  if (!cb) return
  const { vez, rodada } = proximoTurno(ordenarParticipantes(estado.participantes), cb.vez, cb.rodada)
  await chamar((c) => c.from('combates').update({ vez, rodada }).eq('id', cb.id))
}

/** O mestre pede um ajuste de vida no jogador; o aparelho do jogador aplica na ficha. */
export async function pedirAjuste(participanteId: string, delta: number) {
  if (!Math.trunc(delta)) return
  await chamar((c) => c.from('ajustes_de_vida').insert({ participante_id: participanteId, delta: Math.trunc(delta) }))
}

/* ---------- Jogador ---------- */

export async function atualizarMeuParticipante(id: string, campos: { pv?: number; pv_max?: number; pv_temp?: number; iniciativa?: number | null }) {
  await chamar((c) => c.rpc('atualizar_meu_participante', { p: id, campos }))
}

/** Os participantes jogador que são meus (todas as campanhas com combate ativo). */
export async function meusParticipantes(): Promise<Participante[]> {
  const eu = usuarioAtual()
  if (!eu) return []
  return (await chamar((c) => c.from('participantes').select(COLUNAS_PARTICIPANTE).eq('usuario', eu).eq('tipo', 'jogador'))) as Participante[]
}

export async function meusAjustesPendentes(): Promise<{ id: number; participante_id: string; delta: number }[]> {
  const meus = await meusParticipantes()
  if (!meus.length) return []
  return (await chamar((c) =>
    c
      .from('ajustes_de_vida')
      .select('id, participante_id, delta')
      .eq('aplicado', false)
      .in(
        'participante_id',
        meus.map((p) => p.id),
      )
      .order('id'),
  )) as { id: number; participante_id: string; delta: number }[]
}

/** Marca o ajuste como aplicado e devolve o delta; null se outro aparelho já pegou. */
export async function pegarAjuste(id: number): Promise<number | null> {
  return ((await chamar((c) => c.rpc('pegar_ajuste', { a: id }))) as number | null) ?? null
}
