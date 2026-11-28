import { useMemo, useState } from 'react'
import {
  linhasDaArvore,
  montarArvore,
  type ArvoreDeEvolucao,
  type EscolhaNoNivel,
  type EstadoDoNo,
  type LinhaDaArvore,
  type NoDaArvore,
  type RamoDaArvore,
} from '../../../../regras/dnd5e/motor/arvore'
import type { PropsBloco } from '../contexto'

const NOME_ESTADO: Record<EstadoDoNo, string> = {
  liberado: 'Liberado',
  atual: 'Você está aqui',
  proximo: 'Próximo nível',
  futuro: 'Ainda não chegou',
}

type Forma = 'circulo' | 'losango' | 'hexagono'

/** Hexágono: o caminho da subclasse. Losango: o nível pede uma escolha. Círculo: só habilidades. */
function formaDo(no: NoDaArvore, forquilha: boolean): Forma {
  if (forquilha || no.escolhas.some((e) => e.tipo === 'subclasse')) return 'hexagono'
  return no.escolhas.length > 0 ? 'losango' : 'circulo'
}

interface ResumoDoNo {
  titulo: string
  extra: number
  nota: { texto: string; pendente: boolean } | null
}

function resumoDoNo(no: NoDaArvore): ResumoDoNo {
  const itens = no.caracteristicas.length + no.escolhas.length
  const primeira = no.escolhas[0]
  // O rótulo completo ("Aumento de atributo ou talento") fica para o detalhe; no nó cabe a versão curta.
  const titulo = no.caracteristicas[0]?.nome ?? (primeira?.tipo === 'atributo' ? 'Atributo ou talento' : (primeira?.rotulo ?? ''))
  const pendente = no.escolhas.some((e) => e.pendente)
  const feita = no.escolhas.find((e) => e.valor)
  return {
    titulo,
    extra: Math.max(0, itens - 1),
    nota: pendente ? { texto: 'falta escolher', pendente: true } : feita ? { texto: feita.valor!, pendente: false } : null,
  }
}

function Detalhe({ no, id }: { no: NoDaArvore; id: string }) {
  return (
    <div className="trilha__detalhe" id={id} role="region" aria-label={`Nível ${no.nivel}`}>
      {no.caracteristicas.map((h) => (
        <div key={h.id} className="trilha__carac">
          <h4>{h.nome}</h4>
          <p>{h.resumo}</p>
          <p className="suave">{h.pagina ? `LdJ p. ${h.pagina}` : 'LdJ p. ?'}</p>
        </div>
      ))}
      {no.escolhas.map((e, i) => (
        <Escolha key={`${e.tipo}${i}`} e={e} />
      ))}
    </div>
  )
}

function Escolha({ e }: { e: EscolhaNoNivel }) {
  const classe = e.pendente ? 'trilha__escolha trilha__escolha--pendente' : e.valor ? 'trilha__escolha trilha__escolha--feita' : 'trilha__escolha'
  return (
    <p className={classe}>
      <span className="trilha__escolha-rotulo">{e.rotulo}</span>
      <span className="trilha__escolha-valor">{e.pendente ? 'falta escolher' : (e.valor ?? 'a escolher')}</span>
    </p>
  )
}

interface MarcoProps {
  no: NoDaArvore
  forma: Forma
  aberto: boolean
  alternar: () => void
  controla: string
}

function Marco({ no, forma, aberto, alternar, controla }: MarcoProps) {
  const r = resumoDoNo(no)
  const pendente = no.escolhas.some((e) => e.pendente)
  return (
    <button
      type="button"
      className={`trilha__marco trilha__marco--${no.estado}`}
      aria-expanded={aberto}
      aria-controls={aberto ? controla : undefined}
      aria-current={no.estado === 'atual' ? 'step' : undefined}
      aria-label={`Nível ${no.nivel}: ${r.titulo}${r.extra ? ` e mais ${r.extra}` : ''}. ${NOME_ESTADO[no.estado]}${pendente ? '. Falta escolher' : ''}`}
      onClick={alternar}
    >
      <span className={`trilha__no trilha__no--${forma}`} aria-hidden="true">
        <span className="trilha__nivel">{no.nivel}</span>
        {pendente && <span className="trilha__alerta" />}
      </span>
      <span className="trilha__texto">
        {no.estado === 'atual' && <span className="trilha__aqui">Você está aqui</span>}
        <span className="trilha__titulo">
          {r.titulo}
          {r.extra > 0 && <span className="trilha__mais">+{r.extra}</span>}
        </span>
        {r.nota && <span className={r.nota.pendente ? 'trilha__nota trilha__nota--pendente' : 'trilha__nota'}>{r.nota.texto}</span>}
      </span>
    </button>
  )
}

function estadoDoIntervalo(de: number, ate: number, nivel: number): EstadoDoNo {
  if (ate < nivel) return 'liberado'
  return de <= nivel ? 'atual' : 'futuro'
}

function textoDoIntervalo(de: number, ate: number): string {
  if (de === ate) return `nível ${de}`
  return `níveis ${de} a ${ate}`
}

function Linha({
  linha,
  arvore,
  ramo,
  aberto,
  alternar,
}: {
  linha: LinhaDaArvore
  arvore: ArvoreDeEvolucao
  ramo: RamoDaArvore | null
  aberto: string | null
  alternar: (id: string) => void
}) {
  if (linha.tipo === 'vazio') {
    const estado = estadoDoIntervalo(linha.de, linha.ate, arvore.nivel)
    return (
      <li className={`trilha__vazio trilha__linha--${estado}${linha.ramo ? ' trilha__linha--ramo-passa' : ''}`}>
        <span>{textoDoIntervalo(linha.de, linha.ate)} · sem novidade</span>
      </li>
    )
  }

  const idT = `trilha-${linha.nivel}-t`
  const idR = `trilha-${linha.nivel}-r`
  const noAberto = aberto === idT ? linha.tronco : aberto === idR ? linha.ramo : null
  const eForquilhaSemEscolha = !ramo && linha.tronco?.escolhas.some((e) => e.tipo === 'subclasse' && !e.valor)
  const classes = [
    'trilha__linha',
    `trilha__linha--${linha.estado}`,
    linha.ramoPassa ? 'trilha__linha--ramo-passa' : '',
    linha.forquilha ? 'trilha__linha--forquilha' : '',
    linha.ramoFim ? 'trilha__linha--ramo-fim' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li className={classes}>
      <div className="trilha__col">
        {linha.tronco && (
          <Marco
            no={linha.tronco}
            forma={formaDo(linha.tronco, false)}
            aberto={aberto === idT}
            alternar={() => alternar(idT)}
            controla={`${idT}-detalhe`}
          />
        )}
      </div>
      {ramo && (
        <div className="trilha__col trilha__col--ramo">
          {linha.ramo && (
            <>
              {linha.forquilha && <span className="trilha__ramo-nome">{ramo.nome}</span>}
              <Marco
                no={linha.ramo}
                forma={formaDo(linha.ramo, linha.forquilha)}
                aberto={aberto === idR}
                alternar={() => alternar(idR)}
                controla={`${idR}-detalhe`}
              />
            </>
          )}
        </div>
      )}
      {eForquilhaSemEscolha && (
        <ul className="trilha__galhos" aria-label="Caminhos possíveis">
          {arvore.ramos.map((r) => (
            <li key={r.id}>{r.nome}</li>
          ))}
        </ul>
      )}
      {noAberto && <Detalhe no={noAberto} id={`${aberto}-detalhe`} />}
    </li>
  )
}

function Legenda() {
  return (
    <p className="trilha__legenda">
      <span>
        <span className="trilha__mini trilha__mini--circulo" aria-hidden="true" /> Habilidade
      </span>
      <span>
        <span className="trilha__mini trilha__mini--losango" aria-hidden="true" /> Escolha
      </span>
      <span>
        <span className="trilha__mini trilha__mini--hexagono" aria-hidden="true" /> Caminho
      </span>
    </p>
  )
}

/** Antes da subclasse: cada caminho possível numa lista que se abre, para comparar sem ocupar a tela toda. */
function RamosPossiveis({ ramos }: { ramos: RamoDaArvore[] }) {
  return (
    <div className="trilha__possiveis">
      <h3>Caminhos possíveis</h3>
      <p className="campo__ajuda">Você ainda não escolheu. Cada caminho muda o que a personagem ganha daqui para a frente.</p>
      {ramos.map((r) => (
        <details key={r.id} className="trilha__possivel">
          <summary>{r.nome}</summary>
          <ul>
            {r.nos.flatMap((n) => [
              ...n.caracteristicas.map((h) => (
                <li key={`${n.nivel}-${h.id}`}>
                  <span className="trilha__mini-nivel">{n.nivel}</span>
                  <span>
                    <strong>{h.nome}.</strong> {h.resumo}
                  </span>
                </li>
              )),
              ...n.escolhas.map((e, i) => (
                <li key={`${n.nivel}-e${i}`}>
                  <span className="trilha__mini-nivel">{n.nivel}</span>
                  <span>
                    <strong>Escolha:</strong> {e.rotulo}
                  </span>
                </li>
              )),
            ])}
          </ul>
        </details>
      ))}
    </div>
  )
}

export function BlocoEvolucao({ p, abrir }: PropsBloco) {
  const arvore = useMemo(() => montarArvore(p), [p])
  const linhas = useMemo(() => linhasDaArvore(arvore), [arvore])
  const [aberto, setAberto] = useState<string | null>(null)
  const alternar = (id: string) => setAberto((a) => (a === id ? null : id))
  const unico = arvore.ramos[0]
  const ramo = arvore.ramos.length === 1 && unico?.ativo ? unico : null

  return (
    <>
      <div className="trilha__topo">
        <p className="trilha__resumo">
          {arvore.classe} {arvore.nivel}
          {ramo && <> · {ramo.nome}</>}
        </p>
        {arvore.nivel < 20 && (
          <button type="button" className="botao botao--primario so-edicao" onClick={() => abrir('nivel')}>
            Subir de nível
          </button>
        )}
      </div>
      <ol className={ramo ? 'trilha trilha--ramo' : 'trilha'} aria-label="Evolução por nível">
        {linhas.map((l) => (
          <Linha key={l.tipo === 'marco' ? l.nivel : `v${l.de}`} linha={l} arvore={arvore} ramo={ramo} aberto={aberto} alternar={alternar} />
        ))}
      </ol>
      <Legenda />
      {!ramo && <RamosPossiveis ramos={arvore.ramos} />}
      {ramo && arvore.outrasSubclasses > 0 && (
        <p className="campo__ajuda">Existem outros {arvore.outrasSubclasses} caminhos que você não escolheu. Só o seu aparece aqui.</p>
      )}
    </>
  )
}
