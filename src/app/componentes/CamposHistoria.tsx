import { TENDENCIAS } from '../../regras/dnd5e/dados/historia'
import type { Historia, Personalidade } from '../../regras/dnd5e/tipos'
import { SeletorGenero } from './SeletorGenero'

const APARENCIA: [keyof Historia, string, string][] = [
  ['idade', 'Idade', '120 anos…'],
  ['altura', 'Altura', '1,65 m…'],
  ['peso', 'Peso', '55 kg…'],
  ['olhos', 'Olhos', 'Verdes…'],
  ['cabelo', 'Cabelo', 'Castanho, trançado…'],
  ['pele', 'Pele', 'Cobreada…'],
]

const PERSONALIDADE: [keyof Personalidade, string, string][] = [
  ['tracos', 'Traços de personalidade', 'Fala pouco e observa tudo…'],
  ['ideais', 'Ideais', 'Liberdade: ninguém deve viver preso…'],
  ['vinculos', 'Vínculos', 'Devo a vida à minha irmã mais velha…'],
  ['defeitos', 'Defeitos', 'Não resisto a uma fechadura difícil…'],
]

interface PropsHistoria {
  historia: Historia
  aoMudar: (campo: keyof Historia, valor: string) => void
}

/** Objetivo, passado e tendência (LdJ p. 124). */
export function CamposObjetivo({ historia, aoMudar }: PropsHistoria) {
  return (
    <>
      <label className="campo">
        <span className="rotulo">Objetivo</span>
        <textarea
          rows={2}
          value={historia.objetivo}
          onChange={(e) => aoMudar('objetivo', e.target.value)}
          placeholder="Encontrar quem traiu a guilda…"
        />
        <span className="campo__ajuda">O que move o personagem a se aventurar.</span>
      </label>
      <label className="campo">
        <span className="rotulo">Passado</span>
        <textarea
          rows={4}
          value={historia.passado}
          onChange={(e) => aoMudar('passado', e.target.value)}
          placeholder="Cresceu na floresta, foi levada para a cidade…"
        />
      </label>
      <label className="campo">
        <span className="rotulo">Tendência</span>
        <select value={historia.tendencia} onChange={(e) => aoMudar('tendencia', e.target.value)}>
          <option value="">Sem tendência definida</option>
          {TENDENCIAS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <span className="campo__ajuda">LdJ p. 124.</span>
      </label>
    </>
  )
}

export function CamposAparencia({ historia, aoMudar }: PropsHistoria) {
  return (
    <>
      <SeletorGenero valor={historia.genero} aoMudar={(v) => aoMudar('genero', v)} />
      <div className="grade-campos">
        {APARENCIA.map(([id, nome, exemplo]) => (
          <label key={id} className="campo">
            <span className="rotulo">{nome}</span>
            <input value={historia[id]} onChange={(e) => aoMudar(id, e.target.value)} placeholder={exemplo} autoComplete="off" />
          </label>
        ))}
      </div>
      <label className="campo">
        <span className="rotulo">Descrição</span>
        <textarea
          rows={3}
          value={historia.aparencia}
          onChange={(e) => aoMudar('aparencia', e.target.value)}
          placeholder="Cicatriz no queixo, capa verde remendada…"
        />
      </label>
    </>
  )
}

export function CamposPersonalidade({
  personalidade,
  aoMudar,
}: {
  personalidade: Personalidade
  aoMudar: (campo: keyof Personalidade, valor: string) => void
}) {
  return (
    <>
      <p className="campo__ajuda">Cada antecedente do livro tem tabelas para inspirar ou rolar (LdJ p. 129 em diante).</p>
      <div className="grade-textos">
        {PERSONALIDADE.map(([id, nome, exemplo]) => (
          <label key={id} className="campo">
            <span className="rotulo">{nome}</span>
            <textarea rows={3} value={personalidade[id]} onChange={(e) => aoMudar(id, e.target.value)} placeholder={exemplo} />
          </label>
        ))}
      </div>
    </>
  )
}

interface Props {
  historia: Historia
  personalidade: Personalidade
  aoMudarHistoria: (campo: keyof Historia, valor: string) => void
  aoMudarPersonalidade: (campo: keyof Personalidade, valor: string) => void
}

/** Todos os campos de história juntos, para a criação guiada (LdJ p. 123–126). */
export function CamposHistoria({ historia, personalidade, aoMudarHistoria, aoMudarPersonalidade }: Props) {
  return (
    <>
      <section className="bloco">
        <h3>Objetivo e passado</h3>
        <CamposObjetivo historia={historia} aoMudar={aoMudarHistoria} />
      </section>
      <section className="bloco">
        <h3>Aparência</h3>
        <CamposAparencia historia={historia} aoMudar={aoMudarHistoria} />
      </section>
      <section className="bloco">
        <h3>Personalidade</h3>
        <CamposPersonalidade personalidade={personalidade} aoMudar={aoMudarPersonalidade} />
      </section>
    </>
  )
}
