import { useEffect, useMemo, useRef, useState } from 'react'
import { obterAntecedente, obterClasse, obterRaca } from '../../../regras/dnd5e/dados'
import { NOME_ATRIBUTO } from '../../../regras/dnd5e/dados/atributos'
import { criarPersonagem, ferramentasRepetidas, opcoesDePericiaDaClasse, periciasFixas, periciasRepetidas } from '../../../regras/dnd5e/motor/criacao'
import { calcularFicha } from '../../../regras/dnd5e/motor/ficha'
import { faltaEscolherMagias, magiasDoPersonagem, magiasValidas, precisaEscolherMagias } from '../../../regras/dnd5e/motor/magias'
import { criarEmNivel, problemaNasEscolhasDoTalento, requisitoDoTalento } from '../../../regras/dnd5e/motor/progressao'
import { TALENTO_POR_ID } from '../../../regras/dnd5e/dados/talentos'
import { sinal } from '../../../rolagem/rolagem'
import { Icone } from '../../componentes/Icone'
import { Topo } from '../../componentes/Topo'
import { SeletorDeMagias } from '../ficha/blocos/Magias'
import { personagens } from '../../estado'
import { caminho, irPara } from '../../rotas'
import { formatarNumero, resumoPersonagem } from '../../util'
import {
  PassoAntecedente,
  PassoAtributos,
  PassoClasse,
  PassoEquipamento,
  PassoHistoria,
  PassoNiveis,
  PassoNome,
  PassoPericias,
  PassoRaca,
  type PropsPasso,
} from './Passos'
import { niveisDoRascunho, pendenciaNiveis } from './niveis'
import { atributosBase, gravarRascunho, lerRascunho, rascunhoInicial, type Rascunho } from './rascunho'

type IdPasso = 'nome' | 'raca' | 'classe' | 'antecedente' | 'atributos' | 'pericias' | 'niveis' | 'magias' | 'equipamento' | 'historia' | 'revisao'

const TODOS_OS_PASSOS: { id: IdPasso; titulo: string; componente: (p: PropsPasso) => React.JSX.Element }[] = [
  { id: 'nome', titulo: 'Nome e conceito', componente: PassoNome },
  { id: 'raca', titulo: 'Raça', componente: PassoRaca },
  { id: 'classe', titulo: 'Classe', componente: PassoClasse },
  { id: 'antecedente', titulo: 'Antecedente', componente: PassoAntecedente },
  { id: 'atributos', titulo: 'Atributos', componente: PassoAtributos },
  { id: 'pericias', titulo: 'Perícias', componente: PassoPericias },
  { id: 'niveis', titulo: 'Níveis', componente: PassoNiveis },
  { id: 'magias', titulo: 'Magias', componente: PassoMagias },
  { id: 'equipamento', titulo: 'Equipamento', componente: PassoEquipamento },
  { id: 'historia', titulo: 'História', componente: PassoHistoria },
  { id: 'revisao', titulo: 'Revisão', componente: PassoRevisao },
]

const ATRIBUTOS_PROVISORIOS = { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 }

/** O passo Magias só existe para quem conjura neste nível. Antes de fechar os atributos, conta com valores neutros para a lista de passos não mudar. */
function conjura(r: Rascunho): boolean {
  try {
    const p = criarEmNivel({ ...r, atributosBase: atributosBase(r) ?? ATRIBUTOS_PROVISORIOS }, niveisDoRascunho(r))
    return precisaEscolherMagias(p)
  } catch {
    return false
  }
}

/** O passo Níveis só existe quando o personagem começa acima do 1º nível; o de Magias, para quem conjura. */
function passosAtivos(r: Rascunho) {
  const comMagias = conjura(r)
  return TODOS_OS_PASSOS.filter((p) => (p.id !== 'niveis' || r.nivel > 1) && (p.id !== 'magias' || comMagias))
}

/** Mensagem do que falta no passo, ou null se está tudo certo. */
function pendencia(r: Rascunho, passo: IdPasso): string | null {
  const classe = obterClasse(r.classeId)
  switch (passo) {
    case 'nome':
      return r.nome.trim() ? null : 'Dê um nome ao personagem.'
    case 'raca': {
      const raca = obterRaca(r.racaId)
      const fontes = [raca, ...raca.subracas.filter((x) => x.id === r.subracaId)]
      const esc = r.escolhasRaciais
      if (raca.ancestrais && !esc.ancestral) return 'Escolha o ancestral dracônico.'
      const qtdAumentos = fontes.reduce((n, x) => n + (x.aumentosEscolha?.quantidade ?? 0), 0)
      if (esc.aumentos.length < qtdAumentos) return `Escolha ${qtdAumentos} atributos para +1.`
      const qtdPericias = fontes.reduce((n, x) => n + (x.periciasEscolha ?? 0), 0)
      if (esc.pericias.length < qtdPericias) return `Escolha ${qtdPericias} perícias.`
      if (fontes.some((x) => x.escolhaFerramenta) && !esc.ferramenta) return 'Escolha a ferramenta.'
      if (raca.talento) return esc.talento ? problemaNasEscolhasDoTalento(esc.talento) : 'Escolha o talento.'
      return null
    }
    case 'classe': {
      if (classe.nivelSubclasse === 1 && !r.subclasseId) return `Escolha: ${classe.nomeSubclasse}.`
      const sub = classe.nivelSubclasse === 1 ? classe.subclasses.find((s) => s.id === r.subclasseId) : undefined
      const falta = [...(classe.escolhas ?? []), ...(sub?.escolhas ?? [])].find((e) => e.nivel === 1 && !r.escolhasDeClasse[e.id])
      return falta ? `Escolha: ${falta.rotulo}.` : null
    }
    case 'antecedente': {
      const antecedente = obterAntecedente(r.antecedenteId)
      const precisa = (antecedente.escolhaFerramenta ? 1 : 0) + ferramentasRepetidas(r.classeId, r.antecedenteId).length
      const feitas = r.ferramentasEscolhidas.slice(0, precisa).filter((f) => f?.trim()).length
      if (feitas < precisa) return 'Escolha as ferramentas que faltam.'
      const raca = obterRaca(r.racaId)
      const sub = raca.subracas.find((x) => x.id === r.subracaId)
      const idiomas = (raca.idiomasExtras ?? 0) + (sub?.idiomasExtras ?? 0) + antecedente.idiomasExtras
      return r.idiomasEscolhidos.slice(0, idiomas).filter(Boolean).length < idiomas ? 'Escolha os idiomas.' : null
    }
    case 'atributos':
      if (r.metodoAtributos === 'rolagem' && r.rolagens.length === 0) return 'Role os valores primeiro.'
      return atributosBase(r) ? requisitoDoTalentoRacial(r) : 'Atribua um valor a cada atributo.'
    case 'pericias': {
      const fixas = periciasFixas(r.racaId, r.subracaId, r.antecedenteId, r.escolhasRaciais.pericias)
      const opcoes = opcoesDePericiaDaClasse(r.classeId, fixas)
      const daClasse = r.periciasEscolhidas.filter((p) => opcoes.includes(p)).length
      const extras = periciasRepetidas(r.racaId, r.subracaId, r.antecedenteId, r.escolhasRaciais.pericias)
      if (daClasse < classe.pericias.quantidade) return `Escolha ${classe.pericias.quantidade} perícias da classe.`
      if (r.periciasEscolhidas.length < classe.pericias.quantidade + extras) return 'Escolha a perícia extra.'
      const esp = classe.especializacao?.find((e) => e.nivel === 1)?.quantidade ?? 0
      return r.especializacoes.length < esp ? `Escolha ${esp} especializações.` : null
    }
    case 'niveis':
      return r.nivel > 1 ? (pendenciaNiveis(r) ?? erroAoMontar(r)) : null
    default:
      return null
  }
}

/** Talento do humano variante: os pré-requisitos só dá para conferir com atributos e classe definidos. */
function requisitoDoTalentoRacial(r: Rascunho): string | null {
  const esc = r.escolhasRaciais
  const base = atributosBase(r)
  if (!obterRaca(r.racaId).talento || !esc.talento || !base) return null
  const t = TALENTO_POR_ID[esc.talento.id]
  if (!t) return null
  const p = criarPersonagem({ ...r, atributosBase: base, escolhasRaciais: { ...esc, talento: null } })
  const motivo = requisitoDoTalento(p, t)
  return motivo ? `Talento ${t.nome}: ${motivo} Troque o talento no passo Raça ou ajuste os atributos.` : null
}

/** Erro do motor ao montar o personagem nos níveis (ex.: pré-requisito de talento). */
function erroAoMontar(r: Rascunho): string | null {
  const base = atributosBase(r)
  if (!base) return null
  try {
    criarEmNivel({ ...r, atributosBase: base }, niveisDoRascunho(r))
    return null
  } catch (e) {
    return e instanceof Error ? e.message : 'Algo não fecha nos níveis.'
  }
}

function montar(r: Rascunho) {
  const base = atributosBase(r)
  if (!base) return null
  try {
    return criarEmNivel({ ...r, atributosBase: base }, niveisDoRascunho(r))
  } catch {
    return null
  }
}

/** O personagem pronto, já com as magias escolhidas (as que não servem mais para a classe ou o nível ficam de fora). */
function montarComMagias(r: Rascunho) {
  const p = montar(r)
  return p ? { ...p, magias: magiasValidas(p, r.magias ?? []) } : null
}

export function Criacao() {
  const [r, setR] = useState<Rascunho>(lerRascunho)
  const [erro, setErro] = useState('')
  const titulo = useRef<HTMLHeadingElement>(null)
  const PASSOS = passosAtivos(r)
  const passo = Math.min(r.passo, PASSOS.length - 1)
  const alcancado = Math.max(passo, Math.min(r.alcancado ?? 0, PASSOS.length - 1))
  const atual = PASSOS[passo]!

  useEffect(() => gravarRascunho(r), [r])
  useEffect(() => {
    titulo.current?.focus()
    window.scrollTo({ top: 0 })
    // No celular a barra de passos rola de lado: mantém o passo atual à vista.
    document.querySelector('.passos [aria-current="step"]')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [passo])

  const mudar = (parcial: Partial<Rascunho>) => {
    setErro('')
    setR((x) => ({ ...x, ...parcial }))
  }

  const avancar = () => {
    const falta = pendencia(r, atual.id)
    if (falta) {
      setErro(falta)
      return
    }
    if (passo < PASSOS.length - 1) {
      mudar({ passo: passo + 1, alcancado: Math.max(alcancado, passo + 1) })
      return
    }
    const p = montarComMagias(r)
    if (!p) return
    const salvo = personagens.salvar(p)
    gravarRascunho(null)
    irPara(caminho.ficha(salvo.id), true)
  }

  /** Pula para um passo já alcançado. Indo para a frente, para no primeiro passo com pendência. */
  const irParaPasso = (destino: number) => {
    for (let i = passo; i < destino; i++) {
      const falta = pendencia(r, PASSOS[i]!.id)
      if (falta) {
        mudar({ passo: i })
        setErro(falta)
        return
      }
    }
    mudar({ passo: destino })
  }

  const Componente = atual.componente

  return (
    <>
      <Topo
        titulo="Novo personagem"
        voltarPara={caminho.lista()}
        acoes={
          <button
            type="button"
            className="botao botao--fantasma"
            onClick={() => {
              setR(rascunhoInicial())
              setErro('')
            }}
          >
            Recomeçar
          </button>
        }
      />
      <main id="conteudo" tabIndex={-1} className="pagina criacao">
        <ol className="passos" aria-label="Passos da criação">
          {PASSOS.map((p, i) => (
            <li
              key={p.titulo}
              aria-current={i === passo ? 'step' : undefined}
              className={i !== passo && i <= alcancado && !pendencia(r, p.id) ? 'feito' : ''}
            >
              <button type="button" disabled={i > alcancado} onClick={() => irParaPasso(i)}>
                <span className="numeros passos__numero">{i + 1}</span>
                <span className="passos__titulo">{p.titulo}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="rotulo numeros">
          Passo {passo + 1} de {PASSOS.length}
        </p>
        <h1 ref={titulo} tabIndex={-1} className="criacao__titulo">
          {atual.titulo}
        </h1>

        <form
          className="criacao__corpo"
          onSubmit={(e) => {
            e.preventDefault()
            avancar()
          }}
        >
          <Componente r={r} mudar={mudar} />

          <p className="aviso-campo" role="alert">
            {erro}
          </p>

          <div className="criacao__navegacao">
            <button type="button" className="botao" onClick={() => mudar({ passo: passo - 1 })} disabled={passo === 0}>
              <Icone nome="voltar" />
              Voltar
            </button>
            <button type="submit" className="botao botao--primario">
              {passo === PASSOS.length - 1 ? 'Criar personagem' : 'Próximo'}
              {passo < PASSOS.length - 1 && <Icone nome="avancar" />}
            </button>
          </div>
        </form>
      </main>
    </>
  )
}

function PassoMagias({ r, mudar }: PropsPasso) {
  const base = useMemo(() => montar(r), [r])
  if (!base) return <p className="aviso">Falta completar os atributos ou as escolhas de nível. Volte a esses passos.</p>
  const p = { ...base, magias: magiasValidas(base, r.magias ?? []) }
  const falta = faltaEscolherMagias(p)
  const partes = [
    falta.truques > 0 ? `${falta.truques} ${falta.truques === 1 ? 'truque' : 'truques'}` : null,
    falta.conhecidas > 0 ? `${falta.conhecidas} ${falta.conhecidas === 1 ? 'magia conhecida' : 'magias conhecidas'}` : null,
    falta.preparadas > 0 ? `${falta.preparadas} ${falta.preparadas === 1 ? 'magia preparada' : 'magias preparadas'}` : null,
  ].filter(Boolean)
  return (
    <div className="formulario">
      <p className="suave">
        Marque os truques e as magias de {obterClasse(r.classeId).nome.toLowerCase()}. Os limites vêm da classe e do nível. Dá para mudar tudo depois,
        na aba Magias da ficha.
      </p>
      <SeletorDeMagias p={p} aoMudar={(novo) => mudar({ magias: novo.magias })} />
      <p className="campo__ajuda" role="status">
        {partes.length > 0 ? `Ainda faltam ${partes.join(', ')}. Pode seguir e completar depois.` : 'Escolhas completas.'}
      </p>
    </div>
  )
}

function PassoRevisao({ r }: PropsPasso) {
  const p = montarComMagias(r)
  if (!p) return <p className="aviso">Falta completar os atributos ou as escolhas de nível. Volte a esses passos.</p>
  const f = calcularFicha(p)
  const destaques = [
    ['Nível', p.nivel],
    ['CA', f.ca.valor],
    ['PV', f.pvMaximo],
    ['Iniciativa', sinal(f.iniciativa)],
    ['Deslocamento', `${formatarNumero(f.deslocamento)} m`],
    ['Proficiência', sinal(f.proficiencia)],
    ['Percepção passiva', f.percepcaoPassiva],
  ] as const
  return (
    <div className="formulario revisao">
      <header className="revisao__cabeca">
        <h2>{p.nome}</h2>
        <p className="rotulo">{resumoPersonagem(p)}</p>
        {p.conceito && <p className="suave">{p.conceito}</p>}
      </header>
      {(p.historia.objetivo || p.historia.tendencia) && (
        <dl className="definicoes">
          {p.historia.objetivo && (
            <>
              <dt>Objetivo</dt>
              <dd>{p.historia.objetivo}</dd>
            </>
          )}
          {p.historia.tendencia && (
            <>
              <dt>Tendência</dt>
              <dd>{p.historia.tendencia}</dd>
            </>
          )}
        </dl>
      )}
      <div className="revisao__numeros">
        <section className="bloco">
          <h3>Combate</h3>
          <dl className="destaques destaques--sete numeros">
            {destaques.map(([nome, valor]) => (
              <div key={nome}>
                <dt className="rotulo">{nome}</dt>
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="bloco">
          <h3>Atributos</h3>
          <dl className="destaques destaques--seis numeros">
            {Object.entries(f.atributos).map(([id, a]) => (
              <div key={id}>
                <dt className="rotulo">{NOME_ATRIBUTO[id as keyof typeof NOME_ATRIBUTO]}</dt>
                <dd>
                  {a.valor} <span className="suave">({sinal(a.modificador)})</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <section className="bloco">
        <h3>Perícias com proficiência</h3>
        <p>
          {f.pericias
            .filter((x) => x.grau > 0)
            .map((x) => `${x.nome} ${sinal(x.bonus)}${x.grau === 2 ? ' (especialização)' : ''}`)
            .join(' · ')}
        </p>
      </section>
      <section className="bloco">
        <h3>Ataques</h3>
        <p>{f.ataques.map((a) => `${a.nome} ${sinal(a.bonusAtaque)}, ${a.dano} ${a.tipoDano}`).join(' · ')}</p>
      </section>
      {p.magias.length > 0 && (
        <section className="bloco">
          <h3>Magias</h3>
          <p>
            {magiasDoPersonagem(p)
              .map((m) => `${m.nome}${m.nivel === 0 ? ' (truque)' : ''}`)
              .join(' · ')}
          </p>
        </section>
      )}
      <p className="suave">Tudo pode ser ajustado na ficha depois.</p>
    </div>
  )
}
