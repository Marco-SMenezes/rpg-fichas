import { useState } from 'react'
import type { PropsBloco } from '../contexto'

export function BlocoHabilidades({ p, f, atualizar }: PropsBloco) {
  const [editando, setEditando] = useState<string | null>(null)
  return (
    <>
      <p className="campo__ajuda">
        Os resumos são curtos e com palavras próprias. Para ter o texto completo, toque em “Meu texto” e copie do seu
        livro.
      </p>
      <ul className="habilidades">
        {f.habilidades.map((h) => {
          const texto = p.anotacoesHabilidades[h.id] ?? ''
          const aberto = editando === h.id
          return (
            <li key={h.id} className="habilidade">
              <div className="habilidade__cabeca">
                <h3>{h.nome}</h3>
                <span className="etiqueta">{h.origem}</span>
              </div>
              <p>{h.resumo}</p>
              <p className="suave">{h.pagina ? `LdJ p. ${h.pagina}` : 'LdJ p. ?'}</p>
              {texto && !aberto && <p className="habilidade__texto">{texto}</p>}
              {aberto ? (
                <label className="campo">
                  <span className="rotulo">Meu texto</span>
                  <textarea
                    rows={6}
                    defaultValue={texto}
                    autoFocus
                    onBlur={(e) => {
                      atualizar({ ...p, anotacoesHabilidades: { ...p.anotacoesHabilidades, [h.id]: e.target.value.trim() } })
                      setEditando(null)
                    }}
                  />
                  <span className="campo__ajuda">Salva ao sair do campo.</span>
                </label>
              ) : (
                <button type="button" className="botao botao--fantasma habilidade__editar" onClick={() => setEditando(h.id)}>
                  {texto ? 'Editar meu texto' : 'Meu texto'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
