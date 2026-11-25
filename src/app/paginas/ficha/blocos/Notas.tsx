import { CamposAparencia, CamposObjetivo, CamposPersonalidade } from '../../../componentes/CamposHistoria'
import type { PropsBloco } from '../contexto'

export function BlocoProficiencias({ f }: PropsBloco) {
  return (
    <dl className="definicoes">
      <dt>Armaduras</dt>
      <dd>{f.proficiencias.armaduras.join(', ')}</dd>
      <dt>Armas</dt>
      <dd>{f.proficiencias.armas.join(', ')}</dd>
      <dt>Ferramentas</dt>
      <dd>{f.proficiencias.ferramentas.join(', ')}</dd>
      <dt>Idiomas</dt>
      <dd>{f.proficiencias.idiomas.filter(Boolean).join(', ')}</dd>
      <dt>Sentidos</dt>
      <dd>
        {f.visaoNoEscuro ? `Visão no escuro ${f.visaoNoEscuro} m · ` : ''}Percepção passiva {f.percepcaoPassiva}
      </dd>
      <dt>Tamanho</dt>
      <dd>{f.tamanho}</dd>
      {f.resistenciasDano.length > 0 && (
        <>
          <dt>Resistências</dt>
          <dd>{f.resistenciasDano.join(', ')}</dd>
        </>
      )}
    </dl>
  )
}

export function BlocoObjetivo({ p, atualizar }: PropsBloco) {
  return <CamposObjetivo historia={p.historia} aoMudar={(campo, valor) => atualizar({ ...p, historia: { ...p.historia, [campo]: valor } })} />
}

export function BlocoAparencia({ p, atualizar }: PropsBloco) {
  return <CamposAparencia historia={p.historia} aoMudar={(campo, valor) => atualizar({ ...p, historia: { ...p.historia, [campo]: valor } })} />
}

export function BlocoPersonalidade({ p, atualizar }: PropsBloco) {
  return (
    <CamposPersonalidade
      personalidade={p.personalidade}
      aoMudar={(campo, valor) => atualizar({ ...p, personalidade: { ...p.personalidade, [campo]: valor } })}
    />
  )
}

export function BlocoAnotacoes({ p, atualizar }: PropsBloco) {
  return (
    <label className="campo">
      <span className="visualmente-oculto">Anotações</span>
      <textarea
        rows={8}
        value={p.anotacoes}
        placeholder="Nomes, pistas, dívidas, aliados…"
        onChange={(e) => atualizar({ ...p, anotacoes: e.target.value })}
      />
    </label>
  )
}

export function BlocoIdentidade({ p, atualizar }: PropsBloco) {
  return (
    <>
      <label className="campo">
        <span className="rotulo">Nome</span>
        <input
          defaultValue={p.nome}
          onBlur={(e) => e.target.value.trim() && e.target.value !== p.nome && atualizar({ ...p, nome: e.target.value.trim() })}
        />
      </label>
      <label className="campo">
        <span className="rotulo">Conceito</span>
        <input value={p.conceito} onChange={(e) => atualizar({ ...p, conceito: e.target.value })} />
      </label>
      <label className="campo">
        <span className="rotulo">Jogador</span>
        <input value={p.jogador} onChange={(e) => atualizar({ ...p, jogador: e.target.value })} />
      </label>
    </>
  )
}
