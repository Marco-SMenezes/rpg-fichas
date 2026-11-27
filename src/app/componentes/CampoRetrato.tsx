import { useRef, useState } from 'react'
import { lerRetrato } from '../../imagem/retrato'
import { Icone } from './Icone'

interface Props {
  valor: string | undefined
  aoMudar: (retrato: string | undefined) => void
  nome?: string
  rotulo?: string
  ajuda?: string
  /** Lado maior da imagem salva, em pixels. */
  lado?: number
}

/** Foto do personagem (opcional): escolhe do aparelho, reduz e mostra a prévia. */
export function CampoRetrato({
  valor,
  aoMudar,
  nome,
  rotulo = 'Foto do personagem',
  ajuda = 'Opcional. A imagem é reduzida e fica salva junto com a ficha.',
  lado,
}: Props) {
  const entrada = useRef<HTMLInputElement>(null)
  const [erro, setErro] = useState('')
  const [lendo, setLendo] = useState(false)

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return
    setErro('')
    setLendo(true)
    try {
      aoMudar(await lerRetrato(arquivo, lado))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para usar essa imagem.')
    } finally {
      setLendo(false)
    }
  }

  return (
    <div className="campo campo-retrato">
      <span className="rotulo">{rotulo}</span>
      <div className="campo-retrato__linha">
        <Retrato src={valor} nome={nome} tamanho={96} />
        <div className="campo-retrato__acoes">
          <div className="acoes">
            <button type="button" className="botao" onClick={() => entrada.current?.click()} disabled={lendo}>
              <Icone nome="foto" />
              {lendo ? 'Carregando…' : valor ? 'Trocar foto' : 'Escolher foto'}
            </button>
            {valor && (
              <button type="button" className="botao botao--fantasma" onClick={() => aoMudar(undefined)}>
                Remover
              </button>
            )}
          </div>
          <span className="campo__ajuda">{ajuda}</span>
          {erro && (
            <span className="aviso" role="alert">
              {erro}
            </span>
          )}
        </div>
      </div>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="visualmente-oculto"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          void escolher(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}

/** Foto do personagem ou a inicial do nome, quando não há foto. */
export function Retrato({ src, nome, tamanho = 48 }: { src?: string; nome?: string; tamanho?: number }) {
  const estilo = { inlineSize: tamanho, blockSize: tamanho }
  if (src) return <img className="retrato" src={src} alt={nome ? `Foto de ${nome}` : 'Foto do personagem'} style={estilo} />
  return (
    <span className="retrato retrato--vazio" style={estilo} aria-hidden="true">
      {nome?.trim()[0]?.toUpperCase() ?? <Icone nome="foto" />}
    </span>
  )
}
