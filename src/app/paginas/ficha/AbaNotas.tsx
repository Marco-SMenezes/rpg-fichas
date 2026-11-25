import { CamposHistoria } from '../../componentes/CamposHistoria'
import type { PropsAba } from './contexto'

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

      <CamposHistoria
        titulo="h2"
        historia={p.historia}
        personalidade={p.personalidade}
        aoMudarHistoria={(campo, valor) => atualizar({ ...p, historia: { ...p.historia, [campo]: valor } })}
        aoMudarPersonalidade={(campo, valor) => atualizar({ ...p, personalidade: { ...p.personalidade, [campo]: valor } })}
      />

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
