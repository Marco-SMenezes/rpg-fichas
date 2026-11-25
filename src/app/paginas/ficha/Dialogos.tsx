import { useState } from 'react'
import { NOME_PERICIA } from '../../../regras/dnd5e/dados/atributos'
import { obterClasse } from '../../../regras/dnd5e/dados'
import { rolarDado } from '../../../regras/dnd5e/motor/criacao'
import { periciasProficientes } from '../../../regras/dnd5e/motor/ficha'
import {
  aplicarDano,
  curar,
  definirTemporario,
  descansoCurto,
  descansoLongo,
  requisitosDoNivel,
  requisitosDoProximoNivel,
  subirDeNivel,
} from '../../../regras/dnd5e/motor/progressao'
import type { Atributo, Especializavel, Personagem, ValoresAtributos } from '../../../regras/dnd5e/tipos'
import { Contador } from '../../componentes/Contador'
import { EditorIncremento } from '../../componentes/EditorIncremento'
import { SeletorEscolha } from '../../componentes/SeletorEscolha'
import { Dialogo } from '../../componentes/Dialogo'
import type { FichaCalculada } from '../../../regras/dnd5e/motor/ficha'

interface Base {
  aberto: boolean
  aoFechar: () => void
  p: Personagem
  f: FichaCalculada
  atualizar: (p: Personagem) => void
}

/* ---------- Vida ---------- */
export function DialogoVida({ aberto, aoFechar, p, f, atualizar }: Base) {
  const [valor, setValor] = useState('')
  const n = Math.max(0, Math.floor(Number(valor) || 0))
  const aplicar = (fn: (p: Personagem, v: number) => Personagem) => {
    if (!n && fn !== definirTemporario) return
    atualizar(fn(p, n))
    setValor('')
    aoFechar()
  }
  return (
    <Dialogo aberto={aberto} titulo="Pontos de vida" aoFechar={aoFechar}>
      <p className="numeros">
        Atual <strong>{p.estado.pvAtual}</strong> de {f.pvMaximo}
        {p.estado.pvTemporario > 0 && <> · temporários <strong>{p.estado.pvTemporario}</strong></>}
      </p>
      <label className="campo">
        <span className="rotulo">Quantidade</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="numeros vida__entrada"
          placeholder="0"
        />
      </label>
      <div className="acoes acoes--tres">
        <button type="button" className="botao botao--perigo" onClick={() => aplicar(aplicarDano)}>
          Dano
        </button>
        <button type="button" className="botao" onClick={() => aplicar(curar)}>
          Cura
        </button>
        <button type="button" className="botao" onClick={() => aplicar(definirTemporario)}>
          Temporários
        </button>
      </div>
      <p className="campo__ajuda">
        O dano gasta primeiro os PV temporários. PV temporários não se somam: o valor novo substitui o anterior, se você
        preferir (LdJ p. 200).
      </p>
    </Dialogo>
  )
}

/* ---------- Descansos ---------- */
export function DialogoDescanso({ aberto, aoFechar, p, f, atualizar }: Base) {
  const [dados, setDados] = useState(1)
  const [resultado, setResultado] = useState('')
  const restantes = f.dadosDeVidaRestantes
  return (
    <Dialogo aberto={aberto} titulo="Descanso" aoFechar={() => { setResultado(''); aoFechar() }}>
      <section className="bloco">
        <h3>Descanso curto</h3>
        <p className="suave">
          Pelo menos 1 hora. Gaste dados de vida: cada um cura d{f.dadoDeVida} + Con (LdJ p. 188).
        </p>
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
  const [especializacoes, setEspecializacoes] = useState<Especializavel[]>([])
  const [escolhas, setEscolhas] = useState<Record<string, string>>({})
  const [erro, setErro] = useState('')

  if (!req) {
    return (
      <Dialogo aberto={aberto} titulo="Subir de nível" aoFechar={aoFechar}>
        <p>Nível 20 é o máximo.</p>
      </Dialogo>
    )
  }

  const opcoesEsp: Especializavel[] = [
    ...[...periciasProficientes(p)].filter((x) => !p.especializacoes.includes(x)),
    ...(p.especializacoes.includes('ferramentasDeLadrao') ? [] : (['ferramentasDeLadrao'] as const)),
  ]

  const confirmar = () => {
    try {
      const novo = subirDeNivel(p, {
        pv: pv ?? req.pvMedio,
        subclasseId: req.escolherSubclasse ? subclasse : undefined,
        incremento: req.incremento ? incremento : undefined,
        especializacoes: req.especializacoes ? especializacoes : undefined,
        escolhas,
      })
      atualizar(novo)
      setPv(null)
      setIncremento({})
      setEspecializacoes([])
      setEscolhas({})
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
              <span className="opcao__titulo numeros">Rolar d{req.dadoDeVida}{pv !== null && `: tirou ${pv}`}</span>
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
          bloqueadas={e.id.startsWith('estiloDeLuta') ? Object.entries(p.escolhasDeClasse).filter(([k]) => k.startsWith('estiloDeLuta')).map(([, v]) => v) : []}
          aoMudar={(v) => setEscolhas({ ...escolhas, [e.id]: v })}
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
          <p className="campo__ajuda">Ladrão e Trapaceiro Arcano entram numa próxima etapa.</p>
        </fieldset>
      )}

      {req.incremento && (
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
                  onChange={() =>
                    setEspecializacoes((x) => (x.includes(e) ? x.filter((y) => y !== e) : [...x, e]))
                  }
                />
                <span className="opcao__texto">
                  <span className="opcao__titulo">{e === 'ferramentasDeLadrao' ? 'Ferramentas de ladrão' : NOME_PERICIA[e]}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <p className="aviso-campo" role="alert">
        {erro}
      </p>
    </Dialogo>
  )
}
