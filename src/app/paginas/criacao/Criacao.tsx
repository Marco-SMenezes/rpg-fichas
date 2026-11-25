import { useEffect, useRef, useState } from 'react'
import { obterAntecedente, obterClasse, obterRaca } from '../../../regras/dnd5e/dados'
import { NOME_ATRIBUTO } from '../../../regras/dnd5e/dados/atributos'
import {
  ferramentasRepetidas,
  opcoesDePericiaDaClasse,
  periciasFixas,
  periciasRepetidas,
} from '../../../regras/dnd5e/motor/criacao'
import { calcularFicha } from '../../../regras/dnd5e/motor/ficha'
import { criarEmNivel } from '../../../regras/dnd5e/motor/progressao'
import { sinal } from '../../../rolagem/rolagem'
import { Icone } from '../../componentes/Icone'
import { Topo } from '../../componentes/Topo'
import { personagens } from '../../estado'
import { caminho, irPara } from '../../rotas'
import { formatarNumero } from '../../util'
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

type IdPasso = 'nome' | 'raca' | 'classe' | 'antecedente' | 'atributos' | 'pericias' | 'niveis' | 'equipamento' | 'historia' | 'revisao'

const TODOS_OS_PASSOS: { id: IdPasso; titulo: string; componente: (p: PropsPasso) => React.JSX.Element }[] = [
  { id: 'nome', titulo: 'Nome e conceito', componente: PassoNome },
  { id: 'raca', titulo: 'Raça', componente: PassoRaca },
  { id: 'classe', titulo: 'Classe', componente: PassoClasse },
  { id: 'antecedente', titulo: 'Antecedente', componente: PassoAntecedente },
  { id: 'atributos', titulo: 'Atributos', componente: PassoAtributos },
  { id: 'pericias', titulo: 'Perícias', componente: PassoPericias },
  { id: 'niveis', titulo: 'Níveis', componente: PassoNiveis },
  { id: 'equipamento', titulo: 'Equipamento', componente: PassoEquipamento },
  { id: 'historia', titulo: 'História', componente: PassoHistoria },
  { id: 'revisao', titulo: 'Revisão', componente: PassoRevisao },
]

/** O passo Níveis só existe quando o personagem começa acima do 1º nível. */
function passosAtivos(r: Rascunho) {
  return TODOS_OS_PASSOS.filter((p) => p.id !== 'niveis' || r.nivel > 1)
}

/** Mensagem do que falta no passo, ou null se está tudo certo. */
function pendencia(r: Rascunho, passo: IdPasso): string | null {
  const classe = obterClasse(r.classeId)
  switch (passo) {
    case 'nome':
      return r.nome.trim() ? null : 'Dê um nome ao personagem.'
    case 'raca': {
      const raca = obterRaca(r.racaId)
      const fontes = [raca, ...(raca.subracas.filter((x) => x.id === r.subracaId))]
      const esc = r.escolhasRaciais
      if (raca.ancestrais && !esc.ancestral) return 'Escolha o ancestral dracônico.'
      const qtdAumentos = fontes.reduce((n, x) => n + (x.aumentosEscolha?.quantidade ?? 0), 0)
      if (esc.aumentos.length < qtdAumentos) return `Escolha ${qtdAumentos} atributos para +1.`
      const qtdPericias = fontes.reduce((n, x) => n + (x.periciasEscolha ?? 0), 0)
      if (esc.pericias.length < qtdPericias) return `Escolha ${qtdPericias} perícias.`
      if (fontes.some((x) => x.escolhaFerramenta) && !esc.ferramenta) return 'Escolha a ferramenta.'
      return null
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
      return atributosBase(r) ? null : 'Atribua um valor a cada atributo.'
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
      return r.nivel > 1 ? pendenciaNiveis(r) : null
    default:
      return null
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
    const p = montar(r)
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
              <button
                type="button"
                disabled={i > alcancado}
                onClick={() => irParaPasso(i)}
                aria-label={`${i + 1}. ${p.titulo}`}
              >
                <span className="numeros">{i + 1}</span>
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

function PassoRevisao({ r }: PropsPasso) {
  const p = montar(r)
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
    <div className="formulario">
      <div>
        <h2>{p.nome}</h2>
        <p className="suave">{p.conceito}</p>
      </div>
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
      <dl className="destaques numeros">
        {destaques.map(([nome, valor]) => (
          <div key={nome}>
            <dt className="rotulo">{nome}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
      </dl>
      <dl className="destaques destaques--atributos numeros">
        {Object.entries(f.atributos).map(([id, a]) => (
          <div key={id}>
            <dt className="rotulo">{NOME_ATRIBUTO[id as keyof typeof NOME_ATRIBUTO]}</dt>
            <dd>
              {a.valor} <span className="suave">({sinal(a.modificador)})</span>
            </dd>
          </div>
        ))}
      </dl>
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
      <p className="suave">Tudo pode ser ajustado na ficha depois.</p>
    </div>
  )
}
