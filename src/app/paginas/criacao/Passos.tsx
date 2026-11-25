import type { ReactNode } from 'react'
import { ATRIBUTOS, NOME_ATRIBUTO, NOME_PERICIA, PONTOS_DISPONIVEIS } from '../../../regras/dnd5e/dados/atributos'
import { ANTECEDENTES, CLASSES, RACAS, obterAntecedente, obterClasse, obterRaca, obterSubraca } from '../../../regras/dnd5e/dados'
import { buscarItem, PACOTES } from '../../../regras/dnd5e/dados/equipamento'
import { modificador } from '../../../regras/dnd5e/motor/calculos'
import {
  custoCompraPontos,
  ferramentasRepetidas,
  opcoesDeEspecializacao,
  opcoesDePericiaDaClasse,
  periciasFixas,
  periciasRepetidas,
  rolar4d6,
  rolarDado,
  todasAsPericias,
} from '../../../regras/dnd5e/motor/criacao'
import { somarAumentos } from '../../../regras/dnd5e/motor/ficha'
import type { Atributo, Especializavel, Habilidade, PericiaId } from '../../../regras/dnd5e/tipos'
import { sinal } from '../../../rolagem/rolagem'
import { CamposHistoria } from '../../componentes/CamposHistoria'
import { EditorIncremento } from '../../componentes/EditorIncremento'
import { Contador } from '../../componentes/Contador'
import { atributosAntesDoNivel, planoDeNiveis } from './niveis'
import { atributosBase, conjuntoDeValores, type Rascunho } from './rascunho'

export interface PropsPasso {
  r: Rascunho
  mudar: (parcial: Partial<Rascunho>) => void
}

const pag = (n: number | null) => (n ? `LdJ p. ${n}` : 'LdJ p. ?')

function ListaHabilidades({ itens }: { itens: Habilidade[] }) {
  return (
    <ul className="habilidades-curtas">
      {itens.map((h) => (
        <li key={h.id}>
          <strong>{h.nome}.</strong> {h.resumo} <span className="suave">({pag(h.pagina)})</span>
        </li>
      ))}
    </ul>
  )
}

function Opcao({
  tipo = 'radio',
  nome,
  marcado,
  desativado,
  aoMudar,
  titulo,
  detalhe,
}: {
  tipo?: 'radio' | 'checkbox'
  nome: string
  marcado: boolean
  desativado?: boolean
  aoMudar: () => void
  titulo: ReactNode
  detalhe?: ReactNode
}) {
  return (
    <label className="opcao">
      <input type={tipo} name={nome} checked={marcado} disabled={desativado} onChange={aoMudar} />
      <span className="opcao__texto">
        <span className="opcao__titulo">{titulo}</span>
        {detalhe && <span className="opcao__detalhe">{detalhe}</span>}
      </span>
    </label>
  )
}

/* ---------- 1. Nome e conceito ---------- */
export function PassoNome({ r, mudar }: PropsPasso) {
  return (
    <div className="formulario">
      <label className="campo">
        <span className="rotulo">Nome do personagem</span>
        <input value={r.nome} onChange={(e) => mudar({ nome: e.target.value })} placeholder="Lia Folhaverde…" autoComplete="off" />
      </label>
      <label className="campo">
        <span className="rotulo">Conceito</span>
        <input
          value={r.conceito}
          onChange={(e) => mudar({ conceito: e.target.value })}
          placeholder="Batedora que fugiu de uma guilda…"
          autoComplete="off"
        />
        <span className="campo__ajuda">Uma frase sobre quem é o personagem. Opcional.</span>
      </label>
      <label className="campo">
        <span className="rotulo">Jogador</span>
        <input value={r.jogador} onChange={(e) => mudar({ jogador: e.target.value })} placeholder="Seu nome…" autoComplete="given-name" />
      </label>
    </div>
  )
}

/* ---------- 2. Raça ---------- */
const textoAumentos = (a: Partial<Record<Atributo, number>>) =>
  ATRIBUTOS.filter((x) => a[x.id])
    .map((x) => `${x.nome} ${sinal(a[x.id]!)}`)
    .join(', ')

export function PassoRaca({ r, mudar }: PropsPasso) {
  const raca = obterRaca(r.racaId)
  const subraca = obterSubraca(raca, r.subracaId)
  return (
    <div className="formulario">
      <fieldset className="grupo">
        <legend className="rotulo">Raça</legend>
        <div className="lista-opcoes">
          {RACAS.map((x) => (
            <Opcao
              key={x.id}
              nome="raca"
              marcado={x.id === r.racaId}
              aoMudar={() => mudar({ racaId: x.id, subracaId: x.subracas[0]?.id ?? null })}
              titulo={x.nome}
              detalhe={`${textoAumentos(x.aumentos)} · deslocamento ${String(x.deslocamento).replace('.', ',')} m · ${pag(x.pagina)}`}
            />
          ))}
        </div>
      </fieldset>
      {raca.subracas.length > 0 && (
        <fieldset className="grupo">
          <legend className="rotulo">Sub-raça</legend>
          <div className="lista-opcoes">
            {raca.subracas.map((s) => (
              <Opcao
                key={s.id}
                nome="subraca"
                marcado={s.id === r.subracaId}
                aoMudar={() => mudar({ subracaId: s.id })}
                titulo={s.nome}
                detalhe={`${textoAumentos(s.aumentos)} · ${pag(s.pagina)}`}
              />
            ))}
          </div>
        </fieldset>
      )}
      <section className="bloco">
        <h3>Traços</h3>
        <ListaHabilidades itens={[...raca.tracos, ...(subraca?.tracos ?? [])]} />
        <p className="suave">Idiomas: {raca.idiomas.join(', ')}.</p>
      </section>
      <p className="nota">Por enquanto o Tomo tem só o elfo da floresta. As outras raças entram depois que o motor estiver validado.</p>
    </div>
  )
}

/* ---------- 3. Classe ---------- */
export function PassoClasse({ r, mudar }: PropsPasso) {
  const classe = obterClasse(r.classeId)
  return (
    <div className="formulario">
      <fieldset className="grupo">
        <legend className="rotulo">Classe</legend>
        <div className="lista-opcoes">
          {CLASSES.map((c) => (
            <Opcao
              key={c.id}
              nome="classe"
              marcado={c.id === r.classeId}
              aoMudar={() =>
                mudar({
                  classeId: c.id,
                  periciasEscolhidas: [],
                  especializacoes: [],
                  equipamento: {},
                  subclasseId: null,
                  incrementos: {},
                  especializacoesExtras: [],
                })
              }
              titulo={c.nome}
              detalhe={`Dado de vida d${c.dadoDeVida} · resistências ${c.resistencias.map((a) => NOME_ATRIBUTO[a]).join(' e ')} · ${pag(c.pagina)}`}
            />
          ))}
        </div>
      </fieldset>
      <label className="campo campo--curto">
        <span className="rotulo">Nível inicial</span>
        <select value={r.nivel} onChange={(e) => mudar({ nivel: Number(e.target.value) })}>
          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}º nível
            </option>
          ))}
        </select>
        <span className="campo__ajuda">
          Para campanhas que começam acima do 1º nível. As escolhas de cada nível aparecem num passo próprio.
        </span>
      </label>
      <section className="bloco">
        <h3>Proficiências</h3>
        <dl className="definicoes">
          <dt>Armaduras</dt>
          <dd>Leves</dd>
          <dt>Armas</dt>
          <dd>
            Simples, {classe.armas.especificas.map((id) => buscarItem(id)?.nome.toLowerCase()).join(', ')}
          </dd>
          <dt>Ferramentas</dt>
          <dd>{classe.ferramentas.join(', ')}</dd>
          <dt>Perícias</dt>
          <dd>
            {classe.pericias.quantidade} entre {classe.pericias.opcoes.map((p) => NOME_PERICIA[p]).join(', ')}
          </dd>
        </dl>
      </section>
      <section className="bloco">
        <h3>No 1º nível</h3>
        <ListaHabilidades itens={classe.habilidades.filter((h) => h.nivel === 1)} />
        <p className="suave">
          O {classe.nomeSubclasse.toLowerCase()} ({classe.subclasses.map((s) => s.nome).join(', ')}) é escolhido ao chegar
          ao {classe.nivelSubclasse}º nível.
        </p>
      </section>
    </div>
  )
}

/* ---------- 4. Antecedente ---------- */
export function PassoAntecedente({ r, mudar }: PropsPasso) {
  const antecedente = obterAntecedente(r.antecedenteId)
  const repetidas = ferramentasRepetidas(r.classeId, r.antecedenteId)
  const escolha = antecedente.escolhaFerramenta
  const ferramentas = r.ferramentasEscolhidas
  const definirFerramenta = (indice: number, valor: string) => {
    const nova = [...ferramentas]
    nova[indice] = valor
    mudar({ ferramentasEscolhidas: nova })
  }
  return (
    <div className="formulario">
      <fieldset className="grupo">
        <legend className="rotulo">Antecedente</legend>
        <div className="lista-opcoes">
          {ANTECEDENTES.map((a) => (
            <Opcao
              key={a.id}
              nome="antecedente"
              marcado={a.id === r.antecedenteId}
              aoMudar={() => mudar({ antecedenteId: a.id, ferramentasEscolhidas: [], periciasEscolhidas: [], especializacoes: [] })}
              titulo={a.nome}
              detalhe={`${a.pericias.map((p) => NOME_PERICIA[p]).join(', ')} · ${a.moedasPo} po · ${pag(a.pagina)}`}
            />
          ))}
        </div>
      </fieldset>
      <section className="bloco">
        <h3>{antecedente.caracteristica.nome}</h3>
        <p>
          {antecedente.caracteristica.resumo} <span className="suave">({pag(antecedente.caracteristica.pagina)})</span>
        </p>
        <p className="suave">Ferramentas: {[...antecedente.ferramentas, escolha?.rotulo].filter(Boolean).join(', ')}.</p>
      </section>
      {escolha && (
        <label className="campo">
          <span className="rotulo">{escolha.rotulo}</span>
          <select value={ferramentas[0] ?? ''} onChange={(e) => definirFerramenta(0, e.target.value)}>
            <option value="">Escolha…</option>
            {escolha.opcoes.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
      )}
      {repetidas.map((f, i) => {
        const indice = (escolha ? 1 : 0) + i
        return (
          <label key={f} className="campo">
            <span className="rotulo">Ferramenta no lugar de {f.toLowerCase()}</span>
            <input
              value={ferramentas[indice] ?? ''}
              onChange={(e) => definirFerramenta(indice, e.target.value)}
              placeholder="Kit de falsificação…"
              autoComplete="off"
            />
            <span className="campo__ajuda">
              A classe e o antecedente dão a mesma proficiência, então você escolhe outra ferramenta (LdJ p. 127).
            </span>
          </label>
        )
      })}
    </div>
  )
}

/* ---------- 5. Atributos ---------- */
export function PassoAtributos({ r, mudar }: PropsPasso) {
  const raca = obterRaca(r.racaId)
  const racial = somarAumentos(raca.aumentos, obterSubraca(raca, r.subracaId)?.aumentos ?? {})
  const gastos = custoCompraPontos(r.compra) ?? 0
  const base = atributosBase(r)
  const valores = conjuntoDeValores(r)
  const usados = new Set(Object.values(r.atribuicao).filter((x): x is number => x !== null))

  return (
    <div className="formulario">
      <div className="segmentos" role="group" aria-label="Método">
        {(
          [
            ['compra', 'Compra de pontos'],
            ['padrao', 'Valores padrão'],
            ['rolagem', 'Rolagem 4d6'],
          ] as const
        ).map(([id, nome]) => (
          <button
            key={id}
            type="button"
            aria-pressed={r.metodoAtributos === id}
            onClick={() =>
              mudar({ metodoAtributos: id, atribuicao: { for: null, des: null, con: null, int: null, sab: null, car: null } })
            }
          >
            {nome}
          </button>
        ))}
      </div>

      {r.metodoAtributos === 'compra' && (
        <p className="nota numeros" aria-live="polite">
          {PONTOS_DISPONIVEIS - gastos} de {PONTOS_DISPONIVEIS} pontos restantes. Valores de 8 a 15 (LdJ p. 13).
        </p>
      )}
      {r.metodoAtributos === 'padrao' && <p className="nota">Distribua 15, 14, 13, 12, 10 e 8 entre os atributos (LdJ p. 13).</p>}
      {r.metodoAtributos === 'rolagem' && (
        <div className="rolagens">
          <button
            type="button"
            className="botao botao--primario"
            onClick={() =>
              mudar({
                rolagens: Array.from({ length: 6 }, () => rolar4d6()),
                atribuicao: { for: null, des: null, con: null, int: null, sab: null, car: null },
              })
            }
          >
            {r.rolagens.length ? 'Rolar de novo' : 'Rolar 6 vezes 4d6'}
          </button>
          {r.rolagens.length > 0 && (
            <ol className="rolagens__lista numeros">
              {r.rolagens.map((x, i) => (
                <li key={i}>
                  <strong>{x.total}</strong>
                  <span className="suave">{x.dados.join(' ')}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="campo__ajuda">Cada valor soma os três maiores de 4d6 (LdJ p. 13).</p>
        </div>
      )}

      <table className="tabela-atributos numeros">
        <thead>
          <tr>
            <th scope="col">Atributo</th>
            <th scope="col">Base</th>
            <th scope="col">Raça</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {ATRIBUTOS.map(({ id, nome }) => {
            const valorBase = base?.[id] ?? (r.metodoAtributos === 'compra' ? r.compra[id] : null)
            const total = valorBase === null ? null : valorBase + racial[id]
            return (
              <tr key={id}>
                <th scope="row">{nome}</th>
                <td>
                  {r.metodoAtributos === 'compra' ? (
                    <Contador
                      rotulo={nome}
                      valor={r.compra[id]}
                      min={8}
                      max={15}
                      aoMudar={(v) => {
                        const nova = { ...r.compra, [id]: v }
                        if ((custoCompraPontos(nova) ?? Infinity) <= PONTOS_DISPONIVEIS) mudar({ compra: nova })
                      }}
                    />
                  ) : (
                    <select
                      aria-label={`Valor de ${nome}`}
                      value={r.atribuicao[id] ?? ''}
                      disabled={valores.length === 0}
                      onChange={(e) =>
                        mudar({ atribuicao: { ...r.atribuicao, [id]: e.target.value === '' ? null : Number(e.target.value) } })
                      }
                    >
                      <option value="">—</option>
                      {valores.map((v, i) => (
                        <option key={i} value={i} disabled={usados.has(i) && r.atribuicao[id] !== i}>
                          {v}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td>{racial[id] ? sinal(racial[id]) : '—'}</td>
                <td>
                  {total === null ? (
                    '—'
                  ) : (
                    <>
                      <strong>{total}</strong> <span className="suave">({sinal(modificador(total))})</span>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- 6. Perícias ---------- */
const NOME_ESPECIALIZAVEL = (e: Especializavel) => (e === 'ferramentasDeLadrao' ? 'Ferramentas de ladrão' : NOME_PERICIA[e])

export function PassoPericias({ r, mudar }: PropsPasso) {
  const classe = obterClasse(r.classeId)
  const fixas = periciasFixas(r.racaId, r.subracaId, r.antecedenteId)
  const opcoes = opcoesDePericiaDaClasse(r.classeId, fixas)
  const extras = periciasRepetidas(r.racaId, r.subracaId, r.antecedenteId)
  const daClasse = r.periciasEscolhidas.filter((p) => opcoes.includes(p)).slice(0, classe.pericias.quantidade)
  const livres = r.periciasEscolhidas.filter((p) => !daClasse.includes(p)).slice(0, extras)
  const proficientes = [...fixas, ...daClasse, ...livres]
  const especializacao = classe.especializacao?.find((e) => e.nivel === 1)?.quantidade ?? 0
  const origem = (p: PericiaId) => {
    const raca = obterRaca(r.racaId)
    if (raca.pericias.includes(p) || obterSubraca(raca, r.subracaId)?.pericias.includes(p)) return raca.nome
    return obterAntecedente(r.antecedenteId).nome
  }

  // Mantém as especializações que continuam valendo: só sai a de uma perícia que deixou de ser proficiente.
  const escolherPericias = (novaClasse: PericiaId[], novasLivres: PericiaId[]) => {
    const validas = opcoesDeEspecializacao([...fixas, ...novaClasse, ...novasLivres], r.classeId)
    mudar({
      periciasEscolhidas: [...novaClasse, ...novasLivres],
      especializacoes: r.especializacoes.filter((e) => validas.includes(e)),
    })
  }

  const alternar = (lista: PericiaId[], p: PericiaId, limite: number) =>
    lista.includes(p) ? lista.filter((x) => x !== p) : lista.length < limite ? [...lista, p] : lista

  return (
    <div className="formulario">
      <section className="bloco">
        <h3>Já proficiente</h3>
        <ul className="etiquetas">
          {fixas.map((p) => (
            <li key={p}>
              <span className="etiqueta">{NOME_PERICIA[p]}</span> <span className="suave">{origem(p)}</span>
            </li>
          ))}
        </ul>
      </section>

      <fieldset className="grupo">
        <legend className="rotulo numeros">
          {classe.nome}: escolha {classe.pericias.quantidade} ({daClasse.length}/{classe.pericias.quantidade})
        </legend>
        <div className="lista-opcoes lista-opcoes--duas">
          {opcoes.map((p) => (
            <Opcao
              key={p}
              tipo="checkbox"
              nome="pericias-classe"
              marcado={daClasse.includes(p)}
              desativado={!daClasse.includes(p) && daClasse.length >= classe.pericias.quantidade}
              aoMudar={() => {
                escolherPericias(alternar(daClasse, p, classe.pericias.quantidade), livres)
              }}
              titulo={NOME_PERICIA[p]}
            />
          ))}
        </div>
      </fieldset>

      {extras > 0 && (
        <fieldset className="grupo">
          <legend className="rotulo">
            Perícia repetida entre raça e antecedente: escolha {extras} outra{extras > 1 ? 's' : ''} (LdJ p. 127)
          </legend>
          <div className="lista-opcoes lista-opcoes--duas">
            {todasAsPericias()
              .filter((p) => !fixas.includes(p) && !daClasse.includes(p))
              .map((p) => (
                <Opcao
                  key={p}
                  tipo="checkbox"
                  nome="pericias-livres"
                  marcado={livres.includes(p)}
                  desativado={!livres.includes(p) && livres.length >= extras}
                  aoMudar={() => escolherPericias(daClasse, alternar(livres, p, extras))}
                  titulo={NOME_PERICIA[p]}
                />
              ))}
          </div>
        </fieldset>
      )}

      {especializacao > 0 && (
        <fieldset className="grupo">
          <legend className="rotulo numeros">
            Especialização: escolha {especializacao} ({r.especializacoes.length}/{especializacao})
          </legend>
          <p className="campo__ajuda">O bônus de proficiência dobra nessas escolhas (LdJ p. 91).</p>
          <div className="lista-opcoes lista-opcoes--duas">
            {opcoesDeEspecializacao(proficientes, r.classeId).map((e) => (
              <Opcao
                key={e}
                tipo="checkbox"
                nome="especializacao"
                marcado={r.especializacoes.includes(e)}
                desativado={!r.especializacoes.includes(e) && r.especializacoes.length >= especializacao}
                aoMudar={() =>
                  mudar({
                    especializacoes: r.especializacoes.includes(e)
                      ? r.especializacoes.filter((x) => x !== e)
                      : [...r.especializacoes, e].slice(0, especializacao),
                  })
                }
                titulo={NOME_ESPECIALIZAVEL(e)}
              />
            ))}
          </div>
        </fieldset>
      )}
    </div>
  )
}

/* ---------- 7. Equipamento ---------- */
function nomeItens(itens: { itemId: string; quantidade: number }[]) {
  return itens
    .map(({ itemId, quantidade }) => {
      const nome = PACOTES[itemId]?.nome ?? buscarItem(itemId)?.nome ?? itemId
      return quantidade > 1 ? `${nome} (${quantidade})` : nome
    })
    .join(', ')
}

export function PassoEquipamento({ r, mudar }: PropsPasso) {
  const classe = obterClasse(r.classeId)
  const antecedente = obterAntecedente(r.antecedenteId)
  return (
    <div className="formulario">
      {classe.equipamentoEscolhas.map((escolha, n) => (
        <fieldset key={escolha.id} className="grupo">
          <legend className="rotulo">Escolha {n + 1}</legend>
          <div className="lista-opcoes">
            {escolha.opcoes.map((op, i) => (
              <Opcao
                key={op.rotulo}
                nome={escolha.id}
                marcado={(r.equipamento[escolha.id] ?? 0) === i}
                aoMudar={() => mudar({ equipamento: { ...r.equipamento, [escolha.id]: i } })}
                titulo={op.rotulo}
                detalhe={PACOTES[op.itens[0]!.itemId] ? nomeItens(PACOTES[op.itens[0]!.itemId]!.itens) : undefined}
              />
            ))}
          </div>
        </fieldset>
      ))}
      <section className="bloco">
        <h3>Sempre recebe</h3>
        <p>
          <span className="rotulo">{classe.nome}</span> {nomeItens(classe.equipamentoFixo)}
        </p>
        <p>
          <span className="rotulo">{antecedente.nome}</span> {nomeItens(antecedente.equipamento)} e {antecedente.moedasPo} po
        </p>
        <p className="suave">Equipamento inicial do ladino: LdJ p. 91. Pacotes: LdJ p. 153.</p>
      </section>
    </div>
  )
}

/* ---------- 8. História ---------- */
export function PassoHistoria({ r, mudar }: PropsPasso) {
  return (
    <div className="formulario">
      <p className="suave">Tudo aqui é opcional e pode ser preenchido ou mudado depois, na aba Notas da ficha.</p>
      <CamposHistoria
        historia={r.historia}
        personalidade={r.personalidade}
        aoMudarHistoria={(campo, valor) => mudar({ historia: { ...r.historia, [campo]: valor } })}
        aoMudarPersonalidade={(campo, valor) => mudar({ personalidade: { ...r.personalidade, [campo]: valor } })}
      />
    </div>
  )
}

/* ---------- Níveis (só quando o nível inicial é maior que 1) ---------- */
export function PassoNiveis({ r, mudar }: PropsPasso) {
  const classe = obterClasse(r.classeId)
  const plano = planoDeNiveis(r)
  const reqSubclasse = plano.find((x) => x.escolherSubclasse)
  const reqEsp = plano.find((x) => x.especializacoes > 0)
  const proficientes = [...periciasFixas(r.racaId, r.subracaId, r.antecedenteId), ...r.periciasEscolhidas]
  const opcoesEsp = opcoesDeEspecializacao(proficientes, r.classeId).filter((e) => !r.especializacoes.includes(e))
  const rolarTodos = () => mudar({ pvRolagens: plano.map((x) => rolarDado(x.dadoDeVida)) })

  return (
    <div className="formulario">
      <p className="suave">
        {classe.nome} do 2º ao {r.nivel}º nível. O personagem é criado no 1º e sobe nível a nível com estas escolhas.
      </p>

      <fieldset className="grupo">
        <legend className="rotulo">Pontos de vida</legend>
        <div className="segmentos" role="group" aria-label="Pontos de vida por nível">
          <button type="button" aria-pressed={r.pvModo === 'media'} onClick={() => mudar({ pvModo: 'media' })}>
            Valor fixo ({plano[0]?.pvMedio})
          </button>
          <button
            type="button"
            aria-pressed={r.pvModo === 'rolar'}
            onClick={() => mudar({ pvModo: 'rolar', pvRolagens: r.pvRolagens.length ? r.pvRolagens : plano.map((x) => rolarDado(x.dadoDeVida)) })}
          >
            Rolar d{classe.dadoDeVida}
          </button>
        </div>
        <p className="campo__ajuda">Cada nível soma o valor + modificador de Constituição (LdJ p. 90).</p>
        {r.pvModo === 'rolar' && (
          <>
            <ul className="lista-niveis">
              {plano.map((x, i) => (
                <li key={x.novoNivel}>
                  <span className="numeros">{x.novoNivel}º nível</span>
                  <Contador
                    rotulo={`dado de vida do ${x.novoNivel}º nível`}
                    valor={r.pvRolagens[i] ?? x.pvMedio}
                    min={1}
                    max={x.dadoDeVida}
                    aoMudar={(v) => {
                      const novas = plano.map((y, j) => r.pvRolagens[j] ?? y.pvMedio)
                      novas[i] = v
                      mudar({ pvRolagens: novas })
                    }}
                  />
                </li>
              ))}
            </ul>
            <button type="button" className="botao" onClick={rolarTodos}>
              Rolar de novo
            </button>
            <p className="campo__ajuda">Rolou com dados físicos? Ajuste cada valor.</p>
          </>
        )}
      </fieldset>

      {reqSubclasse && (
        <fieldset className="grupo">
          <legend className="rotulo">
            {classe.nomeSubclasse} ({reqSubclasse.novoNivel}º nível)
          </legend>
          <div className="lista-opcoes">
            {classe.subclasses.map((s) => (
              <Opcao
                key={s.id}
                nome="subclasse"
                marcado={r.subclasseId === s.id}
                aoMudar={() => mudar({ subclasseId: s.id })}
                titulo={s.nome}
                detalhe={`${s.resumo} ${pag(s.pagina)}`}
              />
            ))}
          </div>
          <p className="campo__ajuda">Ladrão e Trapaceiro Arcano entram numa próxima etapa.</p>
        </fieldset>
      )}

      {plano
        .filter((x) => x.incremento)
        .map((x) => (
          <EditorIncremento
            key={x.novoNivel}
            titulo={`Incremento do ${x.novoNivel}º nível`}
            atuais={atributosAntesDoNivel(r, x.novoNivel)}
            incremento={r.incrementos[x.novoNivel] ?? {}}
            aoMudar={(inc) => mudar({ incrementos: { ...r.incrementos, [x.novoNivel]: inc } })}
          />
        ))}

      {reqEsp && (
        <fieldset className="grupo">
          <legend className="rotulo numeros">
            Especialização do {reqEsp.novoNivel}º nível ({r.especializacoesExtras.length}/{reqEsp.especializacoes})
          </legend>
          <div className="lista-opcoes lista-opcoes--duas">
            {opcoesEsp.map((e) => (
              <Opcao
                key={e}
                tipo="checkbox"
                nome="especializacao-extra"
                marcado={r.especializacoesExtras.includes(e)}
                desativado={!r.especializacoesExtras.includes(e) && r.especializacoesExtras.length >= reqEsp.especializacoes}
                aoMudar={() =>
                  mudar({
                    especializacoesExtras: r.especializacoesExtras.includes(e)
                      ? r.especializacoesExtras.filter((x) => x !== e)
                      : [...r.especializacoesExtras, e],
                  })
                }
                titulo={NOME_ESPECIALIZAVEL(e)}
              />
            ))}
          </div>
        </fieldset>
      )}
    </div>
  )
}
