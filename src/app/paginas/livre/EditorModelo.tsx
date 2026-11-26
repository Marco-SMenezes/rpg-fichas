import { useMemo, useState } from 'react'
import { livres, useModelos } from '../../../universal/armazenamento'
import { FUNCOES } from '../../../universal/formula'
import {
  calcularFichaLivre,
  chaveDe,
  expressaoDaRolagem,
  novoCampo,
  novoId,
  renomearChave,
  TIPOS_DE_CAMPO,
  valoresIniciais,
  type Calculo,
  type Campo,
  type Modelo,
  type TipoCampo,
} from '../../../universal/modelo'
import { Icone } from '../../componentes/Icone'
import { Topo } from '../../componentes/Topo'
import { caminho, irPara } from '../../rotas'

const LARGURAS: [Campo['largura'], string][] = [
  [3, '¼'],
  [4, '⅓'],
  [6, '½'],
  [8, '⅔'],
  [12, 'Inteira'],
]

const formatar = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ','))

/** Editor do modelo: abas, campos, fórmulas. Cada mudança é salva na hora. */
export function EditorModelo({ id }: { id: string }) {
  const modelos = useModelos()
  const modelo = modelos.find((m) => m.id === id)
  if (!modelo) {
    return (
      <>
        <Topo voltarPara={caminho.modelos()} titulo="Modelo" />
        <main id="conteudo" tabIndex={-1} className="pagina vazio">
          <h1>Modelo não encontrado</h1>
          <a className="botao" href={caminho.modelos()}>
            Ver modelos
          </a>
        </main>
      </>
    )
  }
  return <Editor key={modelo.id} modelo={modelo} />
}

function Editor({ modelo }: { modelo: Modelo }) {
  const [aberto, setAberto] = useState<string | null>(null)
  const salvar = (m: Modelo) => livres.salvarModelo(m)
  const calculo = useMemo(() => calcularFichaLivre(modelo, valoresIniciais(modelo)), [modelo])
  const numericos = modelo.campos.filter((c) => c.tipo === 'numero' || c.tipo === 'formula' || c.tipo === 'recurso' || c.tipo === 'marcador')

  const mudarCampo = (campoId: string, parcial: Partial<Campo>) =>
    salvar({ ...modelo, campos: modelo.campos.map((c) => (c.id === campoId ? { ...c, ...parcial } : c)) })

  const moverCampo = (campoId: string, direcao: -1 | 1) => {
    const campo = modelo.campos.find((c) => c.id === campoId)!
    const daAba = modelo.campos.filter((c) => c.secao === campo.secao)
    const i = daAba.findIndex((c) => c.id === campoId)
    const vizinho = daAba[i + direcao]
    if (!vizinho) return
    const campos = [...modelo.campos]
    const a = campos.findIndex((c) => c.id === campoId)
    const b = campos.findIndex((c) => c.id === vizinho.id)
    ;[campos[a], campos[b]] = [campos[b]!, campos[a]!]
    salvar({ ...modelo, campos })
  }

  const adicionarCampo = (tipo: TipoCampo, secao: string) => {
    const c = novoCampo(modelo, tipo, secao, TIPOS_DE_CAMPO.find((t) => t.id === tipo)!.nome)
    salvar({ ...modelo, campos: [...modelo.campos, c] })
    setAberto(c.id)
  }

  const renomearAba = (antiga: string, nova: string) => {
    const limpa = nova.trim()
    if (!limpa || limpa === antiga || modelo.secoes.includes(limpa)) return
    salvar({
      ...modelo,
      secoes: modelo.secoes.map((s) => (s === antiga ? limpa : s)),
      campos: modelo.campos.map((c) => (c.secao === antiga ? { ...c, secao: limpa } : c)),
    })
  }

  const moverAba = (secao: string, direcao: -1 | 1) => {
    const i = modelo.secoes.indexOf(secao)
    const j = i + direcao
    if (j < 0 || j >= modelo.secoes.length) return
    const secoes = [...modelo.secoes]
    ;[secoes[i], secoes[j]] = [secoes[j]!, secoes[i]!]
    salvar({ ...modelo, secoes })
  }

  const novaAba = () => {
    let n = modelo.secoes.length + 1
    while (modelo.secoes.includes(`Aba ${n}`)) n++
    salvar({ ...modelo, secoes: [...modelo.secoes, `Aba ${n}`] })
  }

  const removerAba = (secao: string) => {
    if (modelo.secoes.length === 1) return
    const destino = modelo.secoes.find((s) => s !== secao)!
    salvar({
      ...modelo,
      secoes: modelo.secoes.filter((s) => s !== secao),
      campos: modelo.campos.map((c) => (c.secao === secao ? { ...c, secao: destino } : c)),
    })
  }

  return (
    <>
      <Topo
        voltarPara={caminho.modelos()}
        titulo={modelo.nome}
        acoes={
          <button
            type="button"
            className="botao botao--primario"
            aria-label="Criar ficha"
            onClick={() => irPara(caminho.livre(livres.criarFicha(modelo, 'Nova ficha').id))}
          >
            <Icone nome="mais" />
            <span className="so-largo">Criar ficha</span>
            <span className="so-estreito" aria-hidden="true">
              Ficha
            </span>
          </button>
        }
      />
      <main id="conteudo" tabIndex={-1} className="pagina editor-modelo">
        <section className="bloco">
          <label className="campo">
            <span className="rotulo">Nome do modelo</span>
            <input value={modelo.nome} onChange={(e) => salvar({ ...modelo, nome: e.target.value })} maxLength={80} />
          </label>
          <label className="campo">
            <span className="rotulo">Descrição</span>
            <textarea rows={2} value={modelo.descricao} onChange={(e) => salvar({ ...modelo, descricao: e.target.value })} placeholder="Para que sistema é, regras da casa…" />
          </label>
          <p className="campo__ajuda">Tudo é salvo na hora. As fichas já criadas com este modelo mudam junto.</p>
        </section>

        <AjudaFormulas numericos={numericos} />

        {modelo.secoes.map((secao, i) => {
          const campos = modelo.campos.filter((c) => c.secao === secao)
          return (
            <section key={secao} className="bloco editor-modelo__aba" aria-label={`Aba ${secao}`}>
              <div className="editor-modelo__aba-cabeca">
                <input
                  className="editor-modelo__aba-nome"
                  defaultValue={secao}
                  aria-label="Nome da aba"
                  onBlur={(e) => renomearAba(secao, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                  }}
                />
                <div className="acoes">
                  <button type="button" className="botao botao--fantasma botao--icone" onClick={() => moverAba(secao, -1)} disabled={i === 0} aria-label={`Mover a aba ${secao} para antes`}>
                    <Icone nome="voltar" />
                  </button>
                  <button
                    type="button"
                    className="botao botao--fantasma botao--icone"
                    onClick={() => moverAba(secao, 1)}
                    disabled={i === modelo.secoes.length - 1}
                    aria-label={`Mover a aba ${secao} para depois`}
                  >
                    <Icone nome="avancar" />
                  </button>
                  {modelo.secoes.length > 1 && (
                    <button type="button" className="botao botao--fantasma botao--icone" onClick={() => removerAba(secao)} aria-label={`Remover a aba ${secao}`} title="Remover aba (os campos vão para outra aba)">
                      <Icone nome="lixo" />
                    </button>
                  )}
                </div>
              </div>

              {campos.length === 0 && <p className="suave">Aba vazia.</p>}
              <ul className="editor-modelo__campos">
                {campos.map((c, j) => (
                  <CartaoCampo
                    key={c.id}
                    campo={c}
                    modelo={modelo}
                    calculo={calculo}
                    aberto={aberto === c.id}
                    aoAbrir={() => setAberto(aberto === c.id ? null : c.id)}
                    aoMudar={(parcial) => mudarCampo(c.id, parcial)}
                    aoRenomearChave={(chave) => salvar(renomearChave(modelo, c.id, chave))}
                    aoMudarRotulo={(rotulo) => {
                      // Chave gerada sozinha acompanha o nome; chave escolhida à mão fica.
                      const automatica = c.chave === chaveDe(c.rotulo) || /_\d+$/.test(c.chave)
                      const comRotulo = { ...modelo, campos: modelo.campos.map((x) => (x.id === c.id ? { ...x, rotulo } : x)) }
                      salvar(automatica && rotulo.trim() ? renomearChave(comRotulo, c.id, rotulo) : comRotulo)
                    }}
                    aoMover={(d) => moverCampo(c.id, d)}
                    podeSubir={j > 0}
                    podeDescer={j < campos.length - 1}
                    aoDuplicar={() => {
                      const copia = { ...c, id: novoId('campo'), rotulo: `${c.rotulo} (cópia)` }
                      const comCopia = { ...modelo, campos: [...modelo.campos, copia] }
                      salvar(renomearChave(comCopia, copia.id, chaveDe(copia.rotulo)))
                    }}
                    aoExcluir={() => salvar({ ...modelo, campos: modelo.campos.filter((x) => x.id !== c.id) })}
                  />
                ))}
              </ul>
              <AdicionarCampo aoAdicionar={(tipo) => adicionarCampo(tipo, secao)} />
            </section>
          )
        })}

        <div>
          <button type="button" className="botao" onClick={novaAba}>
            <Icone nome="mais" />
            Nova aba
          </button>
        </div>
      </main>
    </>
  )
}

function AjudaFormulas({ numericos }: { numericos: Campo[] }) {
  return (
    <details className="bloco editor-modelo__ajuda">
      <summary>Como escrever fórmulas</summary>
      <p>
        Use o nome dos campos (a "chave"), números e <code>+ - * /</code> com parênteses. Funções:{' '}
        {Object.keys(FUNCOES).map((f, i) => (
          <span key={f}>
            {i ? ', ' : ''}
            <code>{f}()</code>
          </span>
        ))}
        . Exemplo: <code>floor((forca - 10) / 2)</code>.
      </p>
      {numericos.length > 0 && (
        <p>
          Campos com número:{' '}
          {numericos.map((c, i) => (
            <span key={c.id}>
              {i ? ' · ' : ''}
              <code>{c.chave}</code>
            </span>
          ))}
        </p>
      )}
    </details>
  )
}

function AdicionarCampo({ aoAdicionar }: { aoAdicionar: (tipo: TipoCampo) => void }) {
  const [tipo, setTipo] = useState<TipoCampo>('numero')
  return (
    <div className="editor-modelo__adicionar">
      <label className="campo">
        <span className="rotulo">Tipo do campo novo</span>
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoCampo)}>
          {TIPOS_DE_CAMPO.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
        <span className="campo__ajuda">{TIPOS_DE_CAMPO.find((t) => t.id === tipo)?.ajuda}</span>
      </label>
      <button type="button" className="botao" onClick={() => aoAdicionar(tipo)}>
        <Icone nome="mais" />
        Adicionar campo
      </button>
    </div>
  )
}

interface PropsCartao {
  campo: Campo
  modelo: Modelo
  calculo: Calculo
  aberto: boolean
  aoAbrir: () => void
  aoMudar: (parcial: Partial<Campo>) => void
  aoRenomearChave: (chave: string) => void
  aoMudarRotulo: (rotulo: string) => void
  aoMover: (direcao: -1 | 1) => void
  podeSubir: boolean
  podeDescer: boolean
  aoDuplicar: () => void
  aoExcluir: () => void
}

function CartaoCampo({ campo: c, modelo, calculo, aberto, aoAbrir, aoMudar, aoRenomearChave, aoMudarRotulo, aoMover, podeSubir, podeDescer, aoDuplicar, aoExcluir }: PropsCartao) {
  const tipo = TIPOS_DE_CAMPO.find((t) => t.id === c.tipo)!
  const erro = calculo.erros[c.id]
  const resultado =
    c.tipo === 'formula' && !erro
      ? `= ${formatar(calculo.porChave[c.chave] ?? 0)}`
      : c.tipo === 'recurso' && !erro
        ? `máximo ${formatar(calculo.expressoes[c.id] ?? 0)}`
        : c.tipo === 'rolagem' && !erro
          ? `rola ${expressaoDaRolagem(c, calculo) ?? '—'}`
          : null

  return (
    <li className={`campo-modelo ${erro ? 'campo-modelo--erro' : ''}`}>
      <div className="campo-modelo__cabeca">
        <button type="button" className="campo-modelo__titulo" onClick={aoAbrir} aria-expanded={aberto}>
          <strong>{c.rotulo || 'Sem nome'}</strong>
          <span className="suave">
            {tipo.nome} · <code>{c.chave}</code>
            {resultado ? ` · ${resultado}` : ''}
          </span>
          {erro && <span className="campo-modelo__erro">{erro}</span>}
        </button>
        <div className="acoes">
          <button type="button" className="botao botao--fantasma botao--icone" onClick={() => aoMover(-1)} disabled={!podeSubir} aria-label={`Subir ${c.rotulo}`}>
            <Icone nome="seta_cima" />
          </button>
          <button type="button" className="botao botao--fantasma botao--icone campo-modelo__descer" onClick={() => aoMover(1)} disabled={!podeDescer} aria-label={`Descer ${c.rotulo}`}>
            <Icone nome="seta_cima" />
          </button>
        </div>
      </div>

      {aberto && (
        <div className="campo-modelo__corpo">
          <div className="grade-campos">
            <label className="campo">
              <span className="rotulo">Nome na ficha</span>
              <input
                value={c.rotulo}
                onChange={(e) => aoMudarRotulo(e.target.value)}
              />
            </label>
            <label className="campo">
              <span className="rotulo">Chave (nas fórmulas)</span>
              <input defaultValue={c.chave} key={c.chave} onBlur={(e) => aoRenomearChave(e.target.value)} spellCheck={false} autoCapitalize="off" />
            </label>
            <label className="campo">
              <span className="rotulo">Tipo</span>
              <select value={c.tipo} onChange={(e) => aoMudar({ ...novoCampo(modelo, e.target.value as TipoCampo, c.secao), id: c.id, chave: c.chave, rotulo: c.rotulo, secao: c.secao })}>
                {TIPOS_DE_CAMPO.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span className="rotulo">Aba</span>
              <select value={c.secao} onChange={(e) => aoMudar({ secao: e.target.value })}>
                {modelo.secoes.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="campo">
            <span className="rotulo">Largura no computador</span>
            <div className="segmentos" role="group" aria-label="Largura do campo">
              {LARGURAS.map(([l, nome]) => (
                <button key={l} type="button" aria-pressed={c.largura === l} onClick={() => aoMudar({ largura: l })}>
                  {nome}
                </button>
              ))}
            </div>
          </div>

          {c.tipo === 'numero' && (
            <label className="campo">
              <span className="rotulo">Valor inicial</span>
              <input type="number" value={c.padrao ?? 0} onChange={(e) => aoMudar({ padrao: Number(e.target.value) || 0 })} />
            </label>
          )}
          {c.tipo === 'recurso' && (
            <label className="campo">
              <span className="rotulo">Máximo (número ou fórmula)</span>
              <input value={c.expressao ?? ''} onChange={(e) => aoMudar({ expressao: e.target.value })} spellCheck={false} autoCapitalize="off" placeholder="10 + vigor * 2" />
            </label>
          )}
          {c.tipo === 'formula' && (
            <label className="campo">
              <span className="rotulo">Fórmula</span>
              <input value={c.expressao ?? ''} onChange={(e) => aoMudar({ expressao: e.target.value })} spellCheck={false} autoCapitalize="off" placeholder="floor((forca - 10) / 2)" />
            </label>
          )}
          {c.tipo === 'rolagem' && (
            <div className="grade-campos">
              <label className="campo">
                <span className="rotulo">Dados</span>
                <input value={c.dados ?? ''} onChange={(e) => aoMudar({ dados: e.target.value })} spellCheck={false} placeholder="1d20, 3d6, 2d20kh1…" />
              </label>
              <label className="campo">
                <span className="rotulo">Bônus (fórmula)</span>
                <input value={c.expressao ?? ''} onChange={(e) => aoMudar({ expressao: e.target.value })} spellCheck={false} autoCapitalize="off" placeholder="forca + treino" />
              </label>
            </div>
          )}
          <label className="campo">
            <span className="rotulo">Dica (opcional)</span>
            <input value={c.ajuda ?? ''} onChange={(e) => aoMudar({ ajuda: e.target.value })} placeholder="Aparece pequena embaixo do campo na ficha" />
          </label>

          <div className="acoes">
            <button type="button" className="botao botao--fantasma" onClick={aoDuplicar}>
              <Icone nome="copiar" />
              Duplicar
            </button>
            <button type="button" className="botao botao--perigo" onClick={aoExcluir}>
              <Icone nome="lixo" />
              Excluir campo
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
