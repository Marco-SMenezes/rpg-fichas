import type { Personagem } from '../../../regras/dnd5e/tipos'
import type { PropsAba } from './contexto'

const CAMPOS: [keyof Personagem['personalidade'], string][] = [
  ['tracos', 'Traços de personalidade'],
  ['ideais', 'Ideais'],
  ['vinculos', 'Vínculos'],
  ['defeitos', 'Defeitos'],
]

export function AbaNotas({ p, f, atualizar }: PropsAba) {
  return (
    <div className="aba-notas">
      <section className="bloco" aria-labelledby="t-proficiencias">
        <h2 id="t-proficiencias">Proficiências e idiomas</h2>
        <dl className="definicoes">
          <dt>Armaduras</dt>
          <dd>{f.proficiencias.armaduras.join(', ')}</dd>
          <dt>Armas</dt>
          <dd>{f.proficiencias.armas.join(', ')}</dd>
          <dt>Ferramentas</dt>
          <dd>{f.proficiencias.ferramentas.join(', ')}</dd>
          <dt>Idiomas</dt>
          <dd>{f.proficiencias.idiomas.join(', ')}</dd>
        </dl>
      </section>

      <section className="bloco" aria-labelledby="t-personalidade">
        <h2 id="t-personalidade">Personalidade</h2>
        <div className="colunas">
          {CAMPOS.map(([id, nome]) => (
            <label key={id} className="campo">
              <span className="rotulo">{nome}</span>
              <textarea
                rows={3}
                defaultValue={p.personalidade[id]}
                onBlur={(e) => {
                  if (e.target.value !== p.personalidade[id]) {
                    atualizar({ ...p, personalidade: { ...p.personalidade, [id]: e.target.value } })
                  }
                }}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="bloco" aria-labelledby="t-anotacoes">
        <h2 id="t-anotacoes">Anotações</h2>
        <label className="campo">
          <span className="visualmente-oculto">Anotações</span>
          <textarea
            rows={10}
            defaultValue={p.anotacoes}
            placeholder="Nomes, pistas, dívidas, aliados…"
            onBlur={(e) => {
              if (e.target.value !== p.anotacoes) atualizar({ ...p, anotacoes: e.target.value })
            }}
          />
          <span className="campo__ajuda">Salva ao sair do campo.</span>
        </label>
      </section>

      <section className="bloco" aria-labelledby="t-identidade">
        <h2 id="t-identidade">Identidade</h2>
        <div className="colunas">
          <label className="campo">
            <span className="rotulo">Nome</span>
            <input
              defaultValue={p.nome}
              onBlur={(e) => e.target.value.trim() && e.target.value !== p.nome && atualizar({ ...p, nome: e.target.value.trim() })}
            />
          </label>
          <label className="campo">
            <span className="rotulo">Conceito</span>
            <input defaultValue={p.conceito} onBlur={(e) => e.target.value !== p.conceito && atualizar({ ...p, conceito: e.target.value })} />
          </label>
        </div>
      </section>
    </div>
  )
}
