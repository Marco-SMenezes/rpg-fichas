import { useMemo, useRef, useState } from 'react'
import { exportarMonstros, importarMonstros, meusMonstros, useMeusMonstros } from '../../../bestiario/meus'
import { filtrarMonstros, TIPOS_DE_MONSTRO } from '../../../regras/dnd5e/dados/monstros/busca'
import type { Monstro } from '../../../regras/dnd5e/dados/monstros/tipos'
import { BlocoMonstro } from '../../componentes/BlocoMonstro'
import { Retrato } from '../../componentes/CampoRetrato'
import { Icone } from '../../componentes/Icone'
import { Topo } from '../../componentes/Topo'
import { caminho, irPara } from '../../rotas'
import { baixarArquivo } from '../../util'
import { CREDITO_SRD, SeletorOrdem, useMonstrosSRD, type OrdemDeMonstros } from '../Compendio'

type Origem = 'meus' | 'srd'

/**
 * Lista pesquisável de monstros (meus e do SRD). Sem `aoEscolher`, é a página do bestiário;
 * com ele, serve para escolher um monstro (o combate usa assim, dentro de um diálogo).
 */
export function SeletorDeMonstro({ aoEscolher, soMeus = false }: { aoEscolher?: (m: Monstro) => void; soMeus?: boolean }) {
  const meus = useMeusMonstros()
  const { lista: srd, erro } = useMonstrosSRD()
  const [origem, setOrigem] = useState<Origem>(meus.length || soMeus ? 'meus' : 'srd')
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('')
  const [ordem, setOrdem] = useState<OrdemDeMonstros>('nome')
  const [aberto, setAberto] = useState<string | null>(null)
  const fonte = origem === 'meus' ? meus : (srd ?? [])
  const achados = useMemo(() => filtrarMonstros(fonte, { termo: busca, tipo, ndMin: null, ndMax: null, ordem }), [fonte, busca, tipo, ordem])

  return (
    <div className="bestiario">
      {!soMeus && (
        <div className="segmentos segmentos--cheio" role="group" aria-label="Origem dos monstros">
          <button type="button" aria-pressed={origem === 'meus'} onClick={() => setOrigem('meus')}>
            Meus monstros ({meus.length})
          </button>
          <button type="button" aria-pressed={origem === 'srd'} onClick={() => setOrigem('srd')}>
            SRD ({srd?.length ?? '…'})
          </button>
        </div>
      )}
      <div className="compendio__filtros">
        <label className="campo">
          <span className="rotulo">Buscar</span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome em português ou inglês…"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <SeletorOrdem valor={ordem} aoMudar={setOrdem} />
        <label className="campo">
          <span className="rotulo">Tipo</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            {TIPOS_DE_MONSTRO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      {origem === 'srd' && erro && <p className="aviso">{erro}</p>}
      {origem === 'srd' && !srd && !erro && <p className="suave">Carregando monstros…</p>}
      {origem === 'meus' && meus.length === 0 && (
        <p className="suave">Você ainda não tem monstros próprios. Crie um, importe um arquivo ou copie um do SRD.</p>
      )}

      <ul className="lista__itens">
        {achados.map((m) => (
          <li key={m.id} className="bestiario__item">
            <div className="pj">
              <button
                type="button"
                className="pj__link bestiario__abrir"
                aria-expanded={aberto === m.id}
                onClick={() => setAberto(aberto === m.id ? null : m.id)}
              >
                <span className="pj__nivel" aria-hidden="true">
                  {m.foto ? <Retrato src={m.foto} nome={m.nome} tamanho={40} /> : <span className="numeros">{m.nd}</span>}
                </span>
                <span className="pj__texto">
                  <span className="pj__nome">{m.nome}</span>
                  <span className="pj__resumo">
                    ND {m.nd} · {m.tipo || 'Sem tipo'} · CA {m.ca} · PV {m.pv}
                  </span>
                </span>
              </button>
              <div className="pj__acoes">
                {aoEscolher ? (
                  <button type="button" className="botao botao--primario" onClick={() => aoEscolher(m)}>
                    Escolher
                  </button>
                ) : m.origem === 'meu' ? (
                  <a className="botao" href={caminho.monstro(m.id)}>
                    <Icone nome="ajustes" />
                    Editar
                  </a>
                ) : (
                  <button
                    type="button"
                    className="botao"
                    onClick={() => irPara(caminho.monstro(meusMonstros.copiar(m).id))}
                    aria-label={`Copiar ${m.nome} para meus monstros`}
                  >
                    <Icone nome="copiar" />
                    <span className="so-largo">Copiar para meus monstros</span>
                    <span className="so-estreito" aria-hidden="true">
                      Copiar
                    </span>
                  </button>
                )}
              </div>
            </div>
            {aberto === m.id && (
              <div className="bestiario__bloco">
                <BlocoMonstro m={m} />
              </div>
            )}
          </li>
        ))}
      </ul>
      {origem === 'srd' && srd && <p className="suave compendio__credito">{CREDITO_SRD}</p>}
    </div>
  )
}

export function Bestiario() {
  const meus = useMeusMonstros()
  const entrada = useRef<HTMLInputElement>(null)
  const [mensagem, setMensagem] = useState('')

  async function importar(arquivo: File | undefined) {
    if (!arquivo) return
    const r = importarMonstros(await arquivo.text())
    setMensagem(r.ok ? `${r.quantos} ${r.quantos === 1 ? 'monstro importado' : 'monstros importados'}.` : r.erro)
  }

  return (
    <>
      <Topo voltarPara={caminho.compendio()} titulo="Bestiário" />
      <main id="conteudo" tabIndex={-1} className="pagina lista">
        <div className="lista__cabeca">
          <div>
            <h1>Bestiário</h1>
            <p className="suave">Os monstros do SRD e os seus. Os seus ficam na sua conta e só você vê.</p>
          </div>
          <div className="acoes">
            <button type="button" className="botao" onClick={() => entrada.current?.click()}>
              <Icone nome="subir" />
              Importar
            </button>
            <button
              type="button"
              className="botao"
              disabled={!meus.length}
              onClick={() => baixarArquivo('meus-monstros.json', exportarMonstros(meus))}
            >
              <Icone nome="baixar" />
              Exportar meus monstros
            </button>
            <button type="button" className="botao botao--primario" onClick={() => irPara(caminho.monstro(meusMonstros.novo().id))}>
              <Icone nome="mais" />
              Novo monstro
            </button>
          </div>
          <input
            ref={entrada}
            type="file"
            accept="application/json,.json"
            className="visualmente-oculto"
            tabIndex={-1}
            aria-hidden="true"
            aria-label="Arquivo de monstros"
            onChange={(e) => {
              void importar(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
        <p className="lista__mensagem" role="status" aria-live="polite">
          {mensagem}
        </p>
        <SeletorDeMonstro />
      </main>
    </>
  )
}
