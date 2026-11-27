import { useMemo, useState } from 'react'
import { montarArvore, type EscolhaNoNivel, type NoDaArvore, type RamoDaArvore } from '../../../../regras/dnd5e/motor/arvore'
import type { HabilidadeDeClasse } from '../../../../regras/dnd5e/tipos'
import type { PropsBloco } from '../contexto'

const NOME_ESTADO = { liberado: 'Liberado', atual: 'Nível atual', proximo: 'Próximo nível', futuro: 'Ainda não chegou' } as const

function Escolha({ e }: { e: EscolhaNoNivel }) {
  const classe = e.pendente ? 'arvore__escolha arvore__escolha--pendente' : e.valor ? 'arvore__escolha arvore__escolha--feita' : 'arvore__escolha'
  return (
    <li className={classe}>
      <span className="arvore__escolha-rotulo">{e.rotulo}</span>
      <span className="arvore__escolha-valor">{e.pendente ? 'falta escolher' : (e.valor ?? 'a escolher')}</span>
    </li>
  )
}

function Caracteristica({ h, aberta, alternar }: { h: HabilidadeDeClasse; aberta: boolean; alternar: () => void }) {
  return (
    <li className="arvore__carac">
      <button type="button" className="arvore__carac-botao" aria-expanded={aberta} onClick={alternar}>
        {h.nome}
      </button>
      {aberta && (
        <div className="arvore__carac-texto">
          <p>{h.resumo}</p>
          <p className="suave">{h.pagina ? `LdJ p. ${h.pagina}` : 'LdJ p. ?'}</p>
        </div>
      )}
    </li>
  )
}

function No({
  no,
  chave,
  aberta,
  alternar,
  rotulo,
}: {
  no: NoDaArvore
  chave: string
  aberta: string | null
  alternar: (id: string) => void
  rotulo?: string
}) {
  return (
    <div className={`arvore__no arvore__no--${no.estado}`} data-estado={no.estado}>
      {rotulo && <span className="arvore__ramo-nome">{rotulo}</span>}
      <span className="sr-only">{NOME_ESTADO[no.estado]}. </span>
      {no.caracteristicas.length > 0 && (
        <ul className="arvore__lista">
          {no.caracteristicas.map((h) => (
            <Caracteristica key={h.id} h={h} aberta={aberta === `${chave}:${h.id}`} alternar={() => alternar(`${chave}:${h.id}`)} />
          ))}
        </ul>
      )}
      {no.escolhas.length > 0 && (
        <ul className="arvore__escolhas">
          {no.escolhas.map((e, i) => (
            <Escolha key={`${e.tipo}${i}`} e={e} />
          ))}
        </ul>
      )}
    </div>
  )
}

/** Antes da subclasse: cada ramo possível numa lista que se abre, para comparar sem ocupar a tela toda. */
function RamosPossiveis({ ramos, aberta, alternar }: { ramos: RamoDaArvore[]; aberta: string | null; alternar: (id: string) => void }) {
  return (
    <div className="arvore__possiveis">
      <h3>Caminhos possíveis</h3>
      <p className="campo__ajuda">Você ainda não escolheu. Cada caminho muda o que a personagem ganha daqui para a frente.</p>
      {ramos.map((r) => (
        <details key={r.id} className="arvore__possivel">
          <summary>{r.nome}</summary>
          {r.nos.map((n) => (
            <div key={n.nivel} className="arvore__possivel-nivel">
              <span className="arvore__nivel-num">{n.nivel}</span>
              <No no={n} chave={`${r.id}-${n.nivel}`} aberta={aberta} alternar={alternar} />
            </div>
          ))}
        </details>
      ))}
    </div>
  )
}

export function BlocoEvolucao({ p, abrir }: PropsBloco) {
  const arvore = useMemo(() => montarArvore(p), [p])
  const [aberta, setAberta] = useState<string | null>(null)
  const alternar = (id: string) => setAberta((a) => (a === id ? null : id))
  const unico = arvore.ramos[0]
  const ramo = arvore.ramos.length === 1 && unico?.ativo ? unico : null
  const doRamo = new Map(ramo?.nos.map((n) => [n.nivel, n]))

  return (
    <>
      <div className="arvore__topo">
        <p className="arvore__resumo">
          {arvore.classe} {arvore.nivel}
          {ramo && <> · {ramo.nome}</>}
        </p>
        {arvore.nivel < 20 && (
          <button type="button" className="botao botao--primario so-edicao" onClick={() => abrir('nivel')}>
            Subir de nível
          </button>
        )}
      </div>
      <ol className="arvore" aria-label="Evolução por nível">
        {arvore.tronco.map((no) => {
          const lateral = doRamo.get(no.nivel)
          const vazio = no.caracteristicas.length === 0 && no.escolhas.length === 0
          return (
            <li key={no.nivel} className={`arvore__linha arvore__linha--${no.estado}`} aria-current={no.estado === 'atual' ? 'step' : undefined}>
              <span className="arvore__nivel">
                <span className="arvore__nivel-num">{no.nivel}</span>
                <span className="arvore__nivel-rotulo">{NOME_ESTADO[no.estado]}</span>
              </span>
              {vazio ? (
                <span className="arvore__vazio">sem novidade</span>
              ) : (
                <No no={no} chave={`t${no.nivel}`} aberta={aberta} alternar={alternar} />
              )}
              {lateral && <No no={lateral} chave={`r${no.nivel}`} aberta={aberta} alternar={alternar} rotulo={ramo!.nome} />}
            </li>
          )
        })}
      </ol>
      {!ramo && <RamosPossiveis ramos={arvore.ramos} aberta={aberta} alternar={alternar} />}
      {ramo && arvore.outrasSubclasses > 0 && (
        <p className="campo__ajuda">Existem outros {arvore.outrasSubclasses} caminhos que você não escolheu. Só o seu aparece aqui.</p>
      )}
    </>
  )
}
