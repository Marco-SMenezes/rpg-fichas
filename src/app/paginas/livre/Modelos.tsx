import { useRef, useState } from 'react'
import { exportarModelo, importarModelo, livres, useFichasLivres, useModelos } from '../../../universal/armazenamento'
import type { Modelo } from '../../../universal/modelo'
import { Dialogo } from '../../componentes/Dialogo'
import { Icone } from '../../componentes/Icone'
import { Topo } from '../../componentes/Topo'
import { caminho, irPara } from '../../rotas'
import { baixarArquivo, nomeDeArquivo } from '../../util'

/** Construtor de fichas: modelos próprios para qualquer sistema. */
export function Modelos() {
  const modelos = useModelos()
  const fichas = useFichasLivres()
  const entrada = useRef<HTMLInputElement>(null)
  const [mensagem, setMensagem] = useState('')
  const [criandoCom, setCriandoCom] = useState<Modelo | null>(null)
  const [excluindo, setExcluindo] = useState<Modelo | null>(null)
  const [nome, setNome] = useState('')

  async function importar(arquivo: File | undefined) {
    if (!arquivo) return
    const r = importarModelo(await arquivo.text())
    setMensagem(r.ok ? `Modelo "${r.modelo.nome}" importado${r.fichas ? ` com ${r.fichas} ficha(s)` : ''}.` : r.erro)
  }

  return (
    <>
      <Topo voltarPara={caminho.lista()} titulo="Construtor de fichas" />
      <main id="conteudo" tabIndex={-1} className="pagina lista">
        <div className="lista__cabeca">
          <div>
            <h1>Construtor de fichas</h1>
            <p className="suave">Monte o modelo de ficha do seu sistema (campos, fórmulas, rolagens) e crie fichas com ele.</p>
          </div>
          <div className="acoes">
            <button type="button" className="botao" onClick={() => entrada.current?.click()}>
              <Icone nome="subir" />
              Importar modelo
            </button>
            <button type="button" className="botao" onClick={() => irPara(caminho.modelo(livres.novoModelo(true).id))}>
              Começar do exemplo
            </button>
            <button type="button" className="botao botao--primario" onClick={() => irPara(caminho.modelo(livres.novoModelo(false).id))}>
              <Icone nome="mais" />
              Modelo em branco
            </button>
          </div>
          <input
            ref={entrada}
            type="file"
            accept="application/json,.json"
            className="visualmente-oculto"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              void importar(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
        <p className="lista__mensagem" role="status" aria-live="polite">
          {mensagem}
        </p>

        {modelos.length === 0 ? (
          <div className="vazio">
            <h2>Nenhum modelo ainda</h2>
            <p className="suave">
              Comece do exemplo (atributos, vida, esforço e testes com d20) e adapte, ou monte do zero. Cada modelo pode ter várias
              fichas.
            </p>
          </div>
        ) : (
          <ul className="lista__itens">
            {modelos.map((m) => {
              const doModelo = fichas.filter((f) => f.modeloId === m.id)
              return (
                <li key={m.id} className="pj">
                  <a className="pj__link" href={caminho.modelo(m.id)}>
                    <span className="pj__nivel" aria-hidden="true">
                      <Icone nome="grade" />
                    </span>
                    <span className="pj__texto">
                      <span className="pj__nome">{m.nome}</span>
                      <span className="pj__resumo">
                        {m.campos.length} campos · {m.secoes.length} {m.secoes.length === 1 ? 'aba' : 'abas'} · {doModelo.length}{' '}
                        {doModelo.length === 1 ? 'ficha' : 'fichas'}
                      </span>
                    </span>
                  </a>
                  <div className="pj__acoes">
                    <button type="button" className="botao" onClick={() => { setCriandoCom(m); setNome('') }}>
                      <Icone nome="mais" />
                      Ficha
                    </button>
                    <button type="button" className="botao botao--fantasma botao--icone" onClick={() => livres.duplicarModelo(m)} aria-label={`Duplicar ${m.nome}`} title="Duplicar">
                      <Icone nome="copiar" />
                    </button>
                    <button
                      type="button"
                      className="botao botao--fantasma botao--icone"
                      onClick={() => baixarArquivo(`modelo-${nomeDeArquivo(m.nome)}.json`, exportarModelo(m))}
                      aria-label={`Exportar ${m.nome}`}
                      title="Exportar modelo"
                    >
                      <Icone nome="baixar" />
                    </button>
                    <button type="button" className="botao botao--fantasma botao--icone" onClick={() => setExcluindo(m)} aria-label={`Excluir ${m.nome}`} title="Excluir">
                      <Icone nome="lixo" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>

      <Dialogo
        aberto={!!criandoCom}
        titulo={`Nova ficha · ${criandoCom?.nome ?? ''}`}
        aoFechar={() => setCriandoCom(null)}
        rodape={
          <button
            type="button"
            className="botao botao--primario"
            onClick={() => {
              if (!criandoCom) return
              const f = livres.criarFicha(criandoCom, nome)
              setCriandoCom(null)
              irPara(caminho.livre(f.id))
            }}
          >
            Criar ficha
          </button>
        }
      >
        <label className="campo">
          <span className="rotulo">Nome do personagem</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome…" autoComplete="off" autoFocus />
        </label>
      </Dialogo>

      <Dialogo
        aberto={!!excluindo}
        titulo="Excluir modelo"
        aoFechar={() => setExcluindo(null)}
        rodape={
          <>
            <button type="button" className="botao" onClick={() => setExcluindo(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="botao botao--perigo"
              onClick={() => {
                if (excluindo) livres.excluirModelo(excluindo.id)
                setExcluindo(null)
              }}
            >
              <Icone nome="lixo" />
              Excluir
            </button>
          </>
        }
      >
        <p>
          <strong>{excluindo?.nome}</strong> e as {fichas.filter((f) => f.modeloId === excluindo?.id).length} fichas feitas com ele serão
          apagados deste aparelho. Exporte antes se quiser guardar.
        </p>
      </Dialogo>
    </>
  )
}
