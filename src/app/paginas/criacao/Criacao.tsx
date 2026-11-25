import { useEffect, useRef, useState } from 'react'
import { obterAntecedente, obterClasse } from '../../../regras/dnd5e/dados'
import { NOME_ATRIBUTO } from '../../../regras/dnd5e/dados/atributos'
import {
  criarPersonagem,
  ferramentasRepetidas,
  opcoesDePericiaDaClasse,
  periciasFixas,
  periciasRepetidas,
} from '../../../regras/dnd5e/motor/criacao'
import { calcularFicha } from '../../../regras/dnd5e/motor/ficha'
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
  PassoNome,
  PassoPericias,
  PassoRaca,
  type PropsPasso,
} from './Passos'
import { atributosBase, gravarRascunho, lerRascunho, rascunhoInicial, type Rascunho } from './rascunho'

const PASSOS: { titulo: string; componente: (p: PropsPasso) => React.JSX.Element }[] = [
  { titulo: 'Nome e conceito', componente: PassoNome },
  { titulo: 'Raça', componente: PassoRaca },
  { titulo: 'Classe', componente: PassoClasse },
  { titulo: 'Antecedente', componente: PassoAntecedente },
  { titulo: 'Atributos', componente: PassoAtributos },
  { titulo: 'Perícias', componente: PassoPericias },
  { titulo: 'Equipamento', componente: PassoEquipamento },
  { titulo: 'História', componente: PassoHistoria },
  { titulo: 'Revisão', componente: PassoRevisao },
]

/** Mensagem do que falta no passo, ou null se está tudo certo. */
function pendencia(r: Rascunho, passo: number): string | null {
  const classe = obterClasse(r.classeId)
  switch (passo) {
    case 0:
      return r.nome.trim() ? null : 'Dê um nome ao personagem.'
    case 3: {
      const antecedente = obterAntecedente(r.antecedenteId)
      const precisa = (antecedente.escolhaFerramenta ? 1 : 0) + ferramentasRepetidas(r.classeId, r.antecedenteId).length
      const feitas = r.ferramentasEscolhidas.slice(0, precisa).filter((f) => f?.trim()).length
      return feitas < precisa ? 'Escolha as ferramentas que faltam.' : null
    }
    case 4:
      if (r.metodoAtributos === 'rolagem' && r.rolagens.length === 0) return 'Role os valores primeiro.'
      return atributosBase(r) ? null : 'Atribua um valor a cada atributo.'
    case 5: {
      const fixas = periciasFixas(r.racaId, r.subracaId, r.antecedenteId)
      const opcoes = opcoesDePericiaDaClasse(r.classeId, fixas)
      const daClasse = r.periciasEscolhidas.filter((p) => opcoes.includes(p)).length
      const extras = periciasRepetidas(r.racaId, r.subracaId, r.antecedenteId)
      if (daClasse < classe.pericias.quantidade) return `Escolha ${classe.pericias.quantidade} perícias da classe.`
      if (r.periciasEscolhidas.length < classe.pericias.quantidade + extras) return 'Escolha a perícia extra.'
      const esp = classe.especializacao?.find((e) => e.nivel === 1)?.quantidade ?? 0
      return r.especializacoes.length < esp ? `Escolha ${esp} especializações.` : null
    }
    default:
      return null
  }
}

function montar(r: Rascunho) {
  const base = atributosBase(r)
  if (!base) return null
  return criarPersonagem({ ...r, atributosBase: base })
}

export function Criacao() {
  const [r, setR] = useState<Rascunho>(lerRascunho)
  const [erro, setErro] = useState('')
  const titulo = useRef<HTMLHeadingElement>(null)
  const passo = Math.min(r.passo, PASSOS.length - 1)
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
    const falta = pendencia(r, passo)
    if (falta) {
      setErro(falta)
      return
    }
    if (passo < PASSOS.length - 1) {
      mudar({ passo: passo + 1 })
      return
    }
    const p = montar(r)
    if (!p) return
    const salvo = personagens.salvar(p)
    gravarRascunho(null)
    irPara(caminho.ficha(salvo.id), true)
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
            <li key={p.titulo} aria-current={i === passo ? 'step' : undefined} className={i < passo ? 'feito' : ''}>
              <button
                type="button"
                disabled={i > passo}
                onClick={() => mudar({ passo: i })}
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
  if (!p) return <p className="aviso">Faltam os atributos. Volte ao passo 5.</p>
  const f = calcularFicha(p)
  const destaques = [
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
