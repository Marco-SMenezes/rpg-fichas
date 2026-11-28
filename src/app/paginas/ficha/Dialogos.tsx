import { useMemo, useState } from 'react'
import { NOME_PERICIA } from '../../../regras/dnd5e/dados/atributos'
import { obterClasse } from '../../../regras/dnd5e/dados'
import { rolarDado } from '../../../regras/dnd5e/motor/criacao'
import { calcularFicha, especializacoesDe, periciasProficientes } from '../../../regras/dnd5e/motor/ficha'
import { limitesDeMagia, magiasValidas, precisaEscolherMagias } from '../../../regras/dnd5e/motor/magias'
import {
  descansoCurto,
  descansoLongo,
  requisitosDoNivel,
  motivoDeBloqueio,
  magiasTravadas,
  requisitoDoTalento,
  type TrocaPermitida,
  requisitosDoProximoNivel,
  subirDeNivel,
} from '../../../regras/dnd5e/motor/progressao'
import type { Atributo, Especializavel, Personagem, TalentoEscolhido, ValoresAtributos } from '../../../regras/dnd5e/tipos'
import { Contador } from '../../componentes/Contador'
import { EditorIncremento } from '../../componentes/EditorIncremento'
import { opcoesJaUsadas, SeletorEscolha } from '../../componentes/SeletorEscolha'
import { SeletorTalento } from '../../componentes/SeletorTalento'
import { Dialogo } from '../../componentes/Dialogo'
import type { FichaCalculada } from '../../../regras/dnd5e/motor/ficha'
import { SeletorDeMagias } from './blocos/Magias'

interface Base {
  aberto: boolean
  aoFechar: () => void
  p: Personagem
  f: FichaCalculada
  atualizar: (p: Personagem) => void
}

/* ---------- Descansos ---------- */
export function DialogoDescanso({ aberto, aoFechar, p, f, atualizar }: Base) {
  const [dados, setDados] = useState(1)
  const [resultado, setResultado] = useState('')
  const restantes = f.dadosDeVidaRestantes
  return (
    <Dialogo
      aberto={aberto}
      titulo="Descanso"
      aoFechar={() => {
        setResultado('')
        aoFechar()
      }}
    >
      <section className="bloco">
        <h3>Descanso curto</h3>
        <p className="suave">Pelo menos 1 hora. Gaste dados de vida: cada um cura d{f.dadoDeVida} + Con (LdJ p. 188).</p>
        <p className="numeros">
          Dados de vida disponíveis: <strong>{restantes}</strong> de {f.dadosDeVidaTotal}
        </p>
        {restantes > 0 ? (
          <div className="acoes">
            <Contador rotulo="dados de vida" valor={Math.min(dados, restantes)} min={1} max={restantes} aoMudar={setDados} />
            <button
              type="button"
              className="botao botao--primario"
              onClick={() => {
                const qtd = Math.min(dados, restantes)
                const rolagens = Array.from({ length: qtd }, () => rolarDado(f.dadoDeVida))
                const novo = descansoCurto(p, rolagens)
                atualizar(novo)
                setResultado(
                  `Rolou ${rolagens.join(', ')} (Con ${f.atributos.con.modificador >= 0 ? '+' : ''}${f.atributos.con.modificador} cada): +${novo.estado.pvAtual - p.estado.pvAtual} PV.`,
                )
              }}
            >
              Gastar e rolar
            </button>
          </div>
        ) : (
          <p className="suave">Sem dados de vida. Eles voltam no descanso longo.</p>
        )}
        <p role="status" aria-live="polite" className="numeros">
          {resultado}
        </p>
      </section>
      <section className="bloco">
        <h3>Descanso longo</h3>
        <p className="suave">
          8 horas. Recupera todos os PV, metade dos dados de vida (arredondada para baixo) e os espaços de magia; os PV temporários acabam (LdJ p.
          188). Exige ao menos 1 PV.
        </p>
        <button
          type="button"
          className="botao"
          disabled={p.estado.pvAtual < 1}
          onClick={() => {
            atualizar(descansoLongo(p))
            setResultado('')
            aoFechar()
          }}
        >
          Fazer descanso longo
        </button>
      </section>
    </Dialogo>
  )
}

/* ---------- Subir de nível ---------- */
export function DialogoNivel({ aberto, aoFechar, p, f, atualizar }: Base) {
  const req = requisitosDoProximoNivel(p)
  const classe = obterClasse(p.classeId)
  const [pv, setPv] = useState<number | null>(null)
  const [subclasse, setSubclasse] = useState(classe.subclasses[0]?.id ?? '')
  const [incremento, setIncremento] = useState<Partial<ValoresAtributos>>({})
  const [usarTalento, setUsarTalento] = useState(false)
  const [talento, setTalento] = useState<TalentoEscolhido | null>(null)
  const [especializacoes, setEspecializacoes] = useState<Especializavel[]>([])
  const [escolhas, setEscolhas] = useState<Record<string, string>>({})
  const [trocas, setTrocas] = useState<Record<string, { sai: string; entra: string }>>({})
  const [magias, setMagias] = useState<Personagem['magias'] | null>(null)
  const [erro, setErro] = useState('')
  /** As magias que a ficha terá ao confirmar: as de hoje mais as marcadas aqui. Servem para os requisitos de magia das invocações. */
  const idsDasMagias = (magias ?? p.magias).map((m) => m.id)

  /** A personagem já no novo nível, para os limites e a lista de magias certos. Fica null enquanto as escolhas acima estiverem incompletas. */
  const novoNivel = useMemo(() => {
    if (!req) return null
    try {
      return subirDeNivel(p, {
        pv: pv ?? req.pvMedio,
        subclasseId: req.escolherSubclasse ? subclasse : undefined,
        incremento: req.incremento && !usarTalento ? incremento : undefined,
        talento: req.incremento && usarTalento ? (talento ?? { id: '', escolhas: {} }) : undefined,
        especializacoes: req.especializacoes ? especializacoes : undefined,
        escolhas,
        trocas,
        magias: idsDasMagias,
      })
    } catch {
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, req, pv, subclasse, incremento, usarTalento, talento, especializacoes, escolhas, trocas, magias])

  if (!req) {
    return (
      <Dialogo aberto={aberto} titulo="Subir de nível" aoFechar={aoFechar}>
        <p>Nível 20 é o máximo.</p>
      </Dialogo>
    )
  }

  // Sem as outras escolhas completas ainda não há o novo nível pronto; a seção de magias usa uma prévia só para ler limites e lista.
  const previa = novoNivel ?? previaDoNivel(p, req.novoNivel, req.escolherSubclasse ? subclasse : p.subclasseId)

  const opcoesEsp: Especializavel[] = [
    ...[...periciasProficientes(p)].filter((x) => !especializacoesDe(p).has(x)),
    ...(p.especializacoes.includes('ferramentasDeLadrao') ? [] : (['ferramentasDeLadrao'] as const)),
  ]

  const confirmar = () => {
    try {
      const novo = subirDeNivel(p, {
        pv: pv ?? req.pvMedio,
        subclasseId: req.escolherSubclasse ? subclasse : undefined,
        incremento: req.incremento && !usarTalento ? incremento : undefined,
        talento: req.incremento && usarTalento ? (talento ?? { id: '', escolhas: {} }) : undefined,
        especializacoes: req.especializacoes ? especializacoes : undefined,
        escolhas,
        trocas,
        magias: idsDasMagias,
      })
      atualizar({ ...novo, magias: magiasValidas(novo, magias ?? p.magias) })
      setMagias(null)
      setPv(null)
      setIncremento({})
      setUsarTalento(false)
      setTalento(null)
      setEspecializacoes([])
      setEscolhas({})
      setTrocas({})
      setErro('')
      aoFechar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para subir de nível.')
    }
  }

  return (
    <Dialogo
      aberto={aberto}
      titulo={`${classe.nome} ${req.novoNivel}º nível`}
      aoFechar={aoFechar}
      rodape={
        <button type="button" className="botao botao--primario" onClick={confirmar}>
          Subir para o {req.novoNivel}º nível
        </button>
      }
    >
      {req.novasHabilidades.length > 0 && <p>Novas habilidades: {req.novasHabilidades.join(', ')}.</p>}

      <fieldset className="grupo">
        <legend className="rotulo">Pontos de vida</legend>
        <div className="lista-opcoes">
          <label className="opcao">
            <input type="radio" name="pv" checked={pv === null} onChange={() => setPv(null)} />
            <span className="opcao__texto">
              <span className="opcao__titulo numeros">Valor fixo: {req.pvMedio}</span>
              <span className="opcao__detalhe numeros">
                + Con ({f.atributos.con.modificador >= 0 ? '+' : ''}
                {f.atributos.con.modificador})
              </span>
            </span>
          </label>
          <label className="opcao">
            <input type="radio" name="pv" checked={pv !== null} onChange={() => setPv(rolarDado(req.dadoDeVida))} />
            <span className="opcao__texto">
              <span className="opcao__titulo numeros">
                Rolar d{req.dadoDeVida}
                {pv !== null && `: tirou ${pv}`}
              </span>
              <span className="opcao__detalhe">Rola ao marcar. Para usar um dado físico, ajuste abaixo.</span>
            </span>
          </label>
        </div>
        {pv !== null && <Contador rotulo="resultado do dado de vida" valor={pv} min={1} max={req.dadoDeVida} aoMudar={setPv} />}
      </fieldset>

      {requisitosDoNivel(p.classeId, req.novoNivel, req.escolherSubclasse ? subclasse : p.subclasseId).escolhas.map((e) => (
        <SeletorEscolha
          key={e.id}
          escolha={e}
          valor={escolhas[e.id]}
          bloqueadas={opcoesJaUsadas(e.id, { ...p.escolhasDeClasse, ...escolhas })}
          escolhas={{ ...p.escolhasDeClasse, ...escolhas }}
          magias={idsDasMagias}
          idiomasConhecidos={f.proficiencias.idiomas}
          aoMudar={(v) => setEscolhas({ ...escolhas, [e.id]: v })}
        />
      ))}

      {req.trocas.map((t) => (
        <CampoTroca
          key={t.prefixo}
          troca={t}
          novoNivel={req.novoNivel}
          atuais={p.escolhasDeClasse}
          novas={escolhas}
          magias={idsDasMagias}
          valor={trocas[t.prefixo] ?? { sai: '', entra: '' }}
          aoMudar={(v) => setTrocas({ ...trocas, [t.prefixo]: v })}
        />
      ))}

      {req.escolherSubclasse && (
        <fieldset className="grupo">
          <legend className="rotulo">{classe.nomeSubclasse}</legend>
          <div className="lista-opcoes">
            {classe.subclasses.map((s) => (
              <label key={s.id} className="opcao">
                <input type="radio" name="subclasse" checked={subclasse === s.id} onChange={() => setSubclasse(s.id)} />
                <span className="opcao__texto">
                  <span className="opcao__titulo">{s.nome}</span>
                  <span className="opcao__detalhe">
                    {s.resumo} LdJ p. {s.pagina}.
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {req.incremento && (
        <div className="segmentos" role="group" aria-label="Incremento ou talento">
          <button type="button" aria-pressed={!usarTalento} onClick={() => setUsarTalento(false)}>
            Aumentar atributos
          </button>
          <button type="button" aria-pressed={usarTalento} onClick={() => setUsarTalento(true)}>
            Talento
          </button>
        </div>
      )}
      {req.incremento && usarTalento && (
        <>
          <p className="campo__ajuda">Talentos são regra opcional: combine com o Mestre.</p>
          <SeletorTalento
            valor={talento}
            aoMudar={setTalento}
            bloqueio={(t) => requisitoDoTalento(p, t)}
            idiomasConhecidos={f.proficiencias.idiomas}
          />
        </>
      )}
      {req.incremento && !usarTalento && (
        <EditorIncremento
          titulo="Incremento no valor de habilidade"
          atuais={Object.fromEntries(Object.entries(f.atributos).map(([k, a]) => [k, a.valor])) as Record<Atributo, number>}
          incremento={incremento}
          aoMudar={setIncremento}
        />
      )}

      {req.especializacoes > 0 && (
        <fieldset className="grupo">
          <legend className="rotulo numeros">
            Especialização ({especializacoes.length}/{req.especializacoes})
          </legend>
          <div className="lista-opcoes lista-opcoes--duas">
            {opcoesEsp.map((e) => (
              <label key={e} className="opcao">
                <input
                  type="checkbox"
                  checked={especializacoes.includes(e)}
                  disabled={!especializacoes.includes(e) && especializacoes.length >= req.especializacoes}
                  onChange={() => setEspecializacoes((x) => (x.includes(e) ? x.filter((y) => y !== e) : [...x, e]))}
                />
                <span className="opcao__texto">
                  <span className="opcao__titulo">{e === 'ferramentasDeLadrao' ? 'Ferramentas de ladrão' : NOME_PERICIA[e]}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {previa && conjuraNoNovoNivel(p, previa) && (
        <details className="grupo" open={limitesMaiores(p, previa)}>
          <summary className="rotulo">Magias</summary>
          <SeletorDeMagias
            p={{ ...previa, magias: magias ?? p.magias }}
            aoMudar={(novo) => setMagias(novo.magias)}
            travadas={magiasTravadas(p.classeId, req.escolherSubclasse ? subclasse : p.subclasseId, req.novoNivel, {
              ...p.escolhasDeClasse,
              ...escolhas,
            })}
          />
        </details>
      )}

      <p className="aviso-campo" role="alert">
        {erro}
      </p>
    </Dialogo>
  )
}

function previaDoNivel(p: Personagem, nivel: number, subclasseId: string | null): Personagem | null {
  try {
    const previa = { ...p, nivel, subclasseId }
    calcularFicha(previa)
    return previa
  } catch {
    return null
  }
}

function conjuraNoNovoNivel(p: Personagem, previa: Personagem): boolean {
  try {
    return precisaEscolherMagias({ ...previa, magias: p.magias }) || p.magias.length > 0
  } catch {
    return false
  }
}

/** Algum limite de magia subiu neste nível: abre a seção já aberta para chamar a atenção. */
function limitesMaiores(p: Personagem, novo: Personagem): boolean {
  const antes = limitesDeMagia(p)
  const depois = limitesDeMagia(novo)
  return (['truques', 'conhecidas', 'preparadas'] as const).some((k) => (depois[k] ?? 0) > (antes[k] ?? 0))
}

/** Troca opcional de uma opção já conhecida (manobra, disciplina, invocação) ao subir de nível. */
function CampoTroca({
  troca,
  novoNivel,
  atuais,
  novas,
  magias,
  valor,
  aoMudar,
}: {
  troca: TrocaPermitida
  novoNivel: number
  atuais: Record<string, string>
  novas: Record<string, string>
  magias: string[]
  valor: { sai: string; entra: string }
  aoMudar: (v: { sai: string; entra: string }) => void
}) {
  const daSerie = (k: string) => k.replace(/\d+$/, '') === troca.prefixo
  const conhecidas = Object.entries(atuais).filter(([k, v]) => daSerie(k) && v)
  if (conhecidas.length === 0) return null
  const nomeDe = (id: string) => troca.opcoes.find((o) => o.id === id)?.nome ?? id
  const usadas = new Set(
    Object.entries({ ...atuais, ...novas })
      .filter(([k, v]) => daSerie(k) && k !== valor.sai && v)
      .map(([, v]) => v),
  )
  const opcao = troca.opcoes.find((o) => o.id === valor.entra)
  return (
    <fieldset className="grupo">
      <legend className="rotulo">
        Trocar uma {troca.nome} (opcional{troca.pagina ? `, LdJ p. ${troca.pagina}` : ''})
      </legend>
      <div className="grade-campos">
        <label className="campo">
          <span className="rotulo">Sai</span>
          <select value={valor.sai} onChange={(e) => aoMudar({ sai: e.target.value, entra: e.target.value ? valor.entra : '' })}>
            <option value="">Não trocar</option>
            {conhecidas.map(([k, v]) => (
              <option key={k} value={k}>
                {nomeDe(v)}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="rotulo">Entra</span>
          <select value={valor.entra} disabled={!valor.sai} onChange={(e) => aoMudar({ ...valor, entra: e.target.value })}>
            <option value="">Escolha…</option>
            {troca.opcoes.map((o) => (
              <option key={o.id} value={o.id} disabled={usadas.has(o.id) || motivoDeBloqueio(o, novoNivel, { ...atuais, ...novas }, magias) !== null}>
                {o.nome}
                {motivoDeBloqueio(o, novoNivel, { ...atuais, ...novas }, magias)
                  ? ` (${motivoDeBloqueio(o, novoNivel, { ...atuais, ...novas }, magias)})`
                  : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
      {opcao && <p className="campo__ajuda">{opcao.resumo}</p>}
    </fieldset>
  )
}
