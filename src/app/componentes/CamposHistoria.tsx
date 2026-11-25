import { TENDENCIAS } from '../../regras/dnd5e/dados/historia'
import type { Historia, Personalidade } from '../../regras/dnd5e/tipos'

const APARENCIA: [keyof Historia, string, string][] = [
  ['idade', 'Idade', '120 anos…'],
  ['genero', 'Gênero', 'Feminino…'],
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

interface Props {
  historia: Historia
  personalidade: Personalidade
  aoMudarHistoria: (campo: keyof Historia, valor: string) => void
  aoMudarPersonalidade: (campo: keyof Personalidade, valor: string) => void
  /** Nível dos títulos das seções (h2 na ficha, h3 na criação). */
  titulo?: 'h2' | 'h3'
}

/** Campos de história do personagem (LdJ p. 123–126), usados na criação e na ficha. */
export function CamposHistoria({ historia, personalidade, aoMudarHistoria, aoMudarPersonalidade, titulo: T = 'h3' }: Props) {
  return (
    <>
      <section className="bloco">
        <T>Objetivo e passado</T>
        <label className="campo">
          <span className="rotulo">Objetivo</span>
          <textarea
            rows={2}
            value={historia.objetivo}
            onChange={(e) => aoMudarHistoria('objetivo', e.target.value)}
            placeholder="Encontrar quem traiu a guilda…"
          />
          <span className="campo__ajuda">O que move o personagem a se aventurar.</span>
        </label>
        <label className="campo">
          <span className="rotulo">Passado</span>
          <textarea
            rows={4}
            value={historia.passado}
            onChange={(e) => aoMudarHistoria('passado', e.target.value)}
            placeholder="Cresceu na floresta, foi levada para a cidade…"
          />
        </label>
        <label className="campo">
          <span className="rotulo">Tendência</span>
          <select value={historia.tendencia} onChange={(e) => aoMudarHistoria('tendencia', e.target.value)}>
            <option value="">Sem tendência definida</option>
            {TENDENCIAS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <span className="campo__ajuda">LdJ p. 124.</span>
        </label>
      </section>

      <section className="bloco">
        <T>Aparência</T>
        <div className="grade-campos">
          {APARENCIA.map(([id, nome, exemplo]) => (
            <label key={id} className="campo">
              <span className="rotulo">{nome}</span>
              <input
                value={historia[id]}
                onChange={(e) => aoMudarHistoria(id, e.target.value)}
                placeholder={exemplo}
                autoComplete="off"
              />
            </label>
          ))}
        </div>
        <label className="campo">
          <span className="rotulo">Descrição</span>
          <textarea
            rows={3}
            value={historia.aparencia}
            onChange={(e) => aoMudarHistoria('aparencia', e.target.value)}
            placeholder="Cicatriz no queixo, capa verde remendada…"
          />
        </label>
      </section>

      <section className="bloco">
        <T>Personalidade</T>
        <p className="campo__ajuda">O antecedente do livro tem tabelas para inspirar ou rolar (LdJ p. 129 em diante).</p>
        <div className="colunas">
          {PERSONALIDADE.map(([id, nome, exemplo]) => (
            <label key={id} className="campo">
              <span className="rotulo">{nome}</span>
              <textarea
                rows={3}
                value={personalidade[id]}
                onChange={(e) => aoMudarPersonalidade(id, e.target.value)}
                placeholder={exemplo}
              />
            </label>
          ))}
        </div>
      </section>
    </>
  )
}
