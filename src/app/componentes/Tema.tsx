import { useEffect, useState } from 'react'
import { CORES, lerPreferencias, normalizarHex, resolverModo, textoSobre, type Modo, type PreferenciasTema } from '../../tema/tema'
import { Dialogo } from './Dialogo'
import { Icone } from './Icone'

const CHAVE = 'tomo:tema:v1'
const ESCURO = '(prefers-color-scheme: dark)'
const COR_DO_FUNDO = { claro: '#f4f5f7', escuro: '#141517' }

function ler(): PreferenciasTema {
  try {
    return lerPreferencias(localStorage.getItem(CHAVE))
  } catch {
    return lerPreferencias(null)
  }
}

function aplicar(p: PreferenciasTema) {
  const modo = resolverModo(p.modo, window.matchMedia(ESCURO).matches)
  const raiz = document.documentElement
  raiz.dataset.tema = modo
  raiz.style.setProperty('--acento', p.acento)
  raiz.style.setProperty('--sobre-acento', textoSobre(p.acento))
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COR_DO_FUNDO[modo])
}

/** Aplica o tema salvo antes do primeiro desenho, para não piscar. */
export function iniciarTema() {
  aplicar(ler())
}

function usePreferenciasTema() {
  const [pref, setPref] = useState(ler)
  useEffect(() => {
    aplicar(pref)
    try {
      localStorage.setItem(CHAVE, JSON.stringify(pref))
    } catch {
      /* sem armazenamento: vale só nesta visita */
    }
    if (pref.modo !== 'sistema') return
    const m = window.matchMedia(ESCURO)
    const aoMudar = () => aplicar(pref)
    m.addEventListener('change', aoMudar)
    return () => m.removeEventListener('change', aoMudar)
  }, [pref])
  return [pref, setPref] as const
}

const MODOS: [Modo, string][] = [
  ['sistema', 'Automático'],
  ['claro', 'Claro'],
  ['escuro', 'Escuro'],
]

/** Botão de paleta no topo: modo claro/escuro e cor de destaque. */
export function SeletorTema() {
  const [aberto, setAberto] = useState(false)
  const [pref, setPref] = usePreferenciasTema()
  const personalizada = !CORES.some((c) => c.hex === pref.acento)

  return (
    <>
      <button type="button" className="botao botao--fantasma botao--icone" onClick={() => setAberto(true)} aria-label="Aparência">
        <Icone nome="paleta" />
      </button>
      <Dialogo aberto={aberto} titulo="Aparência" aoFechar={() => setAberto(false)}>
        <div className="campo">
          <span className="rotulo">Modo</span>
          <div className="segmentos" role="group" aria-label="Modo de cor">
            {MODOS.map(([id, nome]) => (
              <button key={id} type="button" aria-pressed={pref.modo === id} onClick={() => setPref({ ...pref, modo: id })}>
                {nome}
              </button>
            ))}
          </div>
          <span className="campo__ajuda">Automático segue o tema do aparelho.</span>
        </div>

        <fieldset className="grupo">
          <legend className="rotulo">Cor de destaque</legend>
          <div className="amostras">
            {CORES.map((c) => (
              <label key={c.hex} className="amostra" title={c.nome}>
                <input
                  type="radio"
                  name="acento"
                  className="visualmente-oculto"
                  checked={pref.acento === c.hex}
                  onChange={() => setPref({ ...pref, acento: c.hex })}
                />
                <span className="amostra__cor" style={{ background: c.hex }} aria-hidden="true" />
                <span className="visualmente-oculto">{c.nome}</span>
              </label>
            ))}
            <label className="amostra amostra--livre" title="Cor personalizada">
              <input
                type="color"
                value={pref.acento}
                onChange={(e) => {
                  const hex = normalizarHex(e.target.value)
                  if (hex) setPref({ ...pref, acento: hex })
                }}
                aria-label="Cor personalizada"
              />
              <span
                className={`amostra__cor amostra__cor--livre ${personalizada ? 'ativa' : ''}`}
                style={personalizada ? { background: pref.acento } : undefined}
                aria-hidden="true"
              >
                <Icone nome="mais" tamanho={16} />
              </span>
            </label>
          </div>
        </fieldset>

        <div className="previa-tema" aria-hidden="true">
          <span className="botao botao--primario">Botão</span>
          <span className="etiqueta etiqueta--acento">Destaque</span>
          <span className="previa-tema__link">Link</span>
        </div>
      </Dialogo>
    </>
  )
}
