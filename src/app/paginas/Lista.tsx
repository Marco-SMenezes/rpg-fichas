import { useRef, useState } from 'react'
import { duplicarPersonagem, exportar, importar } from '../../armazenamento/personagens'
import { calcularFicha } from '../../regras/dnd5e/motor/ficha'
import type { Personagem } from '../../regras/dnd5e/tipos'
import { Dialogo } from '../componentes/Dialogo'
import { Icone } from '../componentes/Icone'
import { Topo } from '../componentes/Topo'
import { useFichasLivres, useModelos } from '../../universal/armazenamento'
import { Retrato } from '../componentes/CampoRetrato'
import { personagens, useNuvem, usePersonagens } from '../estado'
import { caminho } from '../rotas'
import { baixarArquivo, nomeDeArquivo, resumoPersonagem } from '../util'

export function Lista() {
  const lista = usePersonagens()
  const livresDoAparelho = useFichasLivres()
  const modelosDoAparelho = useModelos()
  const conectado = useNuvem().status === 'logado'
  const entrada = useRef<HTMLInputElement>(null)
  const [mensagem, setMensagem] = useState('')
  const [excluindo, setExcluindo] = useState<Personagem | null>(null)

  async function aoEscolherArquivo(arquivo: File | undefined) {
    if (!arquivo) return
    const resultado = importar(await arquivo.text(), lista)
    if (!resultado.ok) {
      setMensagem(resultado.erro)
      return
    }
    personagens.adicionarVarios(resultado.personagens)
    const n = resultado.personagens.length
    setMensagem(n === 1 ? `${resultado.personagens[0]!.nome} importado.` : `${n} personagens importados.`)
  }

  return (
    <>
      <Topo />
      <main id="conteudo" tabIndex={-1} className="pagina lista">
        <div className="lista__cabeca">
          <div>
            <h1>Personagens</h1>
            <p className="suave">{conectado ? 'Salvos neste aparelho e na sua conta.' : 'Salvos neste aparelho.'}</p>
          </div>
          <div className="acoes">
            <button type="button" className="botao" onClick={() => entrada.current?.click()}>
              <Icone nome="subir" />
              Importar
            </button>
            {lista.length > 1 && (
              <button
                type="button"
                className="botao"
                onClick={() => baixarArquivo('tomo-personagens.json', exportar(lista))}
              >
                <Icone nome="baixar" />
                Exportar todos
              </button>
            )}
            <a className="botao botao--primario" href={caminho.criacao()}>
              <Icone nome="mais" />
              Novo personagem
            </a>
          </div>
          <input
            ref={entrada}
            type="file"
            accept="application/json,.json"
            className="visualmente-oculto"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              void aoEscolherArquivo(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>

        <p className="lista__mensagem" role="status" aria-live="polite">
          {mensagem}
        </p>

        {lista.length === 0 ? (
          <div className="vazio">
            <h2>Nenhum personagem ainda</h2>
            <p className="suave">
              A criação guiada leva uns cinco minutos: raça, classe, antecedente, atributos, perícias e equipamento. A
              ficha calcula o resto.
            </p>
            <a className="botao botao--primario" href={caminho.criacao()}>
              Criar o primeiro personagem
            </a>
          </div>
        ) : (
          <ul className="lista__itens">
            {lista.map((p) => (
              <LinhaPersonagem
                key={p.id}
                p={p}
                aoDuplicar={() => {
                  const copia = personagens.salvar(duplicarPersonagem(p))
                  setMensagem(`${copia.nome} criado.`)
                }}
                aoExportar={() => baixarArquivo(`${nomeDeArquivo(p.nome)}.json`, exportar([p]))}
                aoExcluir={() => setExcluindo(p)}
              />
            ))}
          </ul>
        )}

        <section className="bloco lista__livres" aria-labelledby="t-livres">
          <div className="bloco__cabeca">
            <h2 id="t-livres">Fichas personalizadas</h2>
            <a className="botao" href={caminho.modelos()}>
              <Icone nome="grade" />
              Construtor de fichas
            </a>
          </div>
          {livresDoAparelho.length === 0 ? (
            <p className="suave">Para outros sistemas: monte um modelo de ficha com seus campos, fórmulas e rolagens.</p>
          ) : (
            <ul className="lista__itens">
              {livresDoAparelho.map((f) => (
                <li key={f.id} className="pj">
                  <a className="pj__link" href={caminho.livre(f.id)}>
                    <span className="pj__nivel" aria-hidden="true">
                      <Icone nome="grade" />
                    </span>
                    <span className="pj__texto">
                      <span className="pj__nome">{f.nome}</span>
                      <span className="pj__resumo">{modelosDoAparelho.find((m) => m.id === f.modeloId)?.nome ?? 'Modelo excluído'}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Dialogo
        aberto={!!excluindo}
        titulo="Excluir personagem"
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
                if (!excluindo) return
                personagens.excluir(excluindo.id)
                setMensagem(`${excluindo.nome} excluído.`)
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
          <strong>{excluindo?.nome}</strong> será apagado deste aparelho. Se quiser guardar uma cópia, exporte antes.
        </p>
      </Dialogo>
    </>
  )
}

function LinhaPersonagem({
  p,
  aoDuplicar,
  aoExportar,
  aoExcluir,
}: {
  p: Personagem
  aoDuplicar: () => void
  aoExportar: () => void
  aoExcluir: () => void
}) {
  const ficha = calcularFicha(p)
  const pv = Math.max(0, Math.min(1, p.estado.pvAtual / ficha.pvMaximo))
  return (
    <li className="pj">
      <a className="pj__link" href={caminho.ficha(p.id)}>
        {p.retrato ? (
          <Retrato src={p.retrato} nome={p.nome} tamanho={48} />
        ) : (
          <span className="pj__nivel numeros" aria-hidden="true">
            {p.nivel}
          </span>
        )}
        <span className="pj__texto">
          <span className="pj__nome">{p.nome}</span>
          <span className="pj__resumo">{resumoPersonagem(p)}</span>
          <span className="pj__pv numeros">
            <span className="pj__barra" aria-hidden="true">
              <span style={{ inlineSize: `${pv * 100}%` }} />
            </span>
            PV {p.estado.pvAtual}/{ficha.pvMaximo} · CA {ficha.ca.valor}
          </span>
        </span>
      </a>
      <div className="pj__acoes">
        <button type="button" className="botao botao--fantasma botao--icone" onClick={aoDuplicar} aria-label={`Duplicar ${p.nome}`} title="Duplicar">
          <Icone nome="copiar" />
        </button>
        <button type="button" className="botao botao--fantasma botao--icone" onClick={aoExportar} aria-label={`Exportar ${p.nome}`} title="Exportar JSON">
          <Icone nome="baixar" />
        </button>
        <button type="button" className="botao botao--fantasma botao--icone" onClick={aoExcluir} aria-label={`Excluir ${p.nome}`} title="Excluir">
          <Icone nome="lixo" />
        </button>
      </div>
    </li>
  )
}
