import { useEffect, useState } from 'react'
import {
  apagarCampanha,
  lerNotasDoMestre,
  limparRolagens,
  mesaDaCampanha,
  obterCampanha,
  ouvirRolagens,
  removerDaMesa,
  alterarCampanha,
  rolagensRecentes,
  sairDaCampanha,
  salvarNotas,
  salvarNotasDoMestre,
  trocarCodigo,
  vincularPersonagem,
  type MembroDaMesa,
  type MinhaCampanha,
} from '../../../nuvem/campanhas'
import { fichaServe, juntarRolagens, nomeDoSistema, type RolagemDaMesa } from '../../../nuvem/mesa'
import { sincronizar } from '../../../nuvem/nuvem'
import { CLASSES, RACAS } from '../../../regras/dnd5e/dados'
import { Dialogo } from '../../componentes/Dialogo'
import { Icone } from '../../componentes/Icone'
import { DetalheDados } from '../../componentes/Rolador'
import { Topo } from '../../componentes/Topo'
import { useNuvem, usePersonagens } from '../../estado'
import { useFichasLivres, useModelos } from '../../../universal/armazenamento'
import { caminho, irPara } from '../../rotas'
import { Combate } from './Combate'
import { useCarga } from './usarCarga'

const nomeDaClasse = (id: string | null) => CLASSES.find((c) => c.id === id)?.nome ?? ''
const nomeDaRaca = (id: string | null) => RACAS.find((r) => r.id === id)?.nome ?? ''

export function Campanha({ id, aba = null }: { id: string; aba?: 'combate' | null }) {
  const nuvem = useNuvem()
  const { dados: c, setDados, erro, carregando } = useCarga(() => (nuvem.status === 'logado' ? obterCampanha(id) : Promise.resolve(null)), [id, nuvem.status])

  useEffect(() => {
    if (c) document.title = `${c.nome} · Tomo`
    return () => {
      document.title = 'Tomo'
    }
  }, [c])

  return (
    <>
      <Topo voltarPara={caminho.campanhas()} titulo={c?.nome ?? 'Campanha'} />
      <main id="conteudo" tabIndex={-1} className="pagina campanha">
        {erro && (
          <p className="aviso" role="alert">
            {erro}
          </p>
        )}
        {(carregando || nuvem.status === 'iniciando') && !c && <p className="suave">Carregando…</p>}
        {!carregando && !c && !erro && nuvem.status !== 'iniciando' && (
          <div className="vazio">
            <h1>Campanha não encontrada</h1>
            <p className="suave">{nuvem.status === 'logado' ? 'Você saiu dela ou ela foi apagada.' : 'Entre na sua conta para ver as campanhas.'}</p>
            <a className="botao" href={caminho.campanhas()}>
              Ver campanhas
            </a>
          </div>
        )}
        {c && <ConteudoCampanha c={c} aoMudar={setDados} aba={aba} />}
      </main>
    </>
  )
}

function ConteudoCampanha({ c, aoMudar, aba }: { c: MinhaCampanha; aoMudar: (c: MinhaCampanha) => void; aba: 'combate' | null }) {
  const mesa = useCarga(() => mesaDaCampanha(c.id), [c.id, c.meuPersonagem])
  return (
    <>
      <header className="campanha__cabeca">
        <p className="rotulo">
          {nomeDoSistema(c.sistema)}
          {c.tema && ` · ${c.tema}`} · {c.souMestre ? 'Você é o mestre' : 'Você é jogador'}
        </p>
        <h1>{c.nome}</h1>
        {c.descricao && <p className="campanha__descricao">{c.descricao}</p>}
      </header>

      <nav className="abas-ficha campanha__abas" aria-label="Partes da campanha">
        <a className="abas-ficha__aba" href={caminho.campanha(c.id)} aria-current={aba === null ? 'page' : undefined}>
          Campanha
        </a>
        <a className="abas-ficha__aba" href={caminho.campanha(c.id, 'combate')} aria-current={aba === 'combate' ? 'page' : undefined}>
          Combate
        </a>
      </nav>

      {aba === 'combate' ? (
        <Combate c={c} />
      ) : (
        <>

      <div className="campanha__grade">
        <div className="campanha__coluna">
          {c.souMestre && <Convite c={c} aoMudar={aoMudar} />}
          {!c.souMestre && <MinhaFicha c={c} aoMudar={aoMudar} />}
          <Mesa c={c} membros={mesa.dados ?? []} erro={mesa.erro} aoRemover={() => void mesa.recarregar()} />
          <Notas c={c} />
        </div>
        <div className="campanha__coluna">
          <Rolagens c={c} />
        </div>
      </div>

      <ZonaDePerigo c={c} />
        </>
      )}
    </>
  )
}

function Convite({ c, aoMudar }: { c: MinhaCampanha; aoMudar: (c: MinhaCampanha) => void }) {
  const [copiado, setCopiado] = useState(false)
  const [nome, setNome] = useState(c.nome)
  const [tema, setTema] = useState(c.tema)
  const [descricao, setDescricao] = useState(c.descricao)
  return (
    <section className="bloco">
      <h2>Convite</h2>
      <p className="suave">Passe este código para os jogadores. Eles entram em Campanhas → Entrar com código.</p>
      <div className="campanha__codigo">
        <span className="numeros" translate="no">
          {c.codigo}
        </span>
        <button
          type="button"
          className="botao"
          onClick={() => {
            void navigator.clipboard?.writeText(c.codigo).then(() => setCopiado(true))
          }}
        >
          <Icone nome="copiar" />
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <div className="acoes">
        <button
          type="button"
          className="botao botao--fantasma"
          onClick={() => void trocarCodigo(c.id).then((codigo) => aoMudar({ ...c, codigo }))}
        >
          Gerar outro código
        </button>
      </div>
      <p className="campo__ajuda">Um código novo impede novas entradas pelo antigo; quem já entrou continua.</p>
      <label className="campo">
        <span className="rotulo">Nome da campanha</span>
        <input
          value={nome}
          maxLength={80}
          onChange={(e) => setNome(e.target.value)}
          onBlur={() => {
            if (nome.trim() && nome !== c.nome) void alterarCampanha(c.id, { nome: nome.trim() }).then(() => aoMudar({ ...c, nome: nome.trim() }))
          }}
        />
      </label>
      <label className="campo">
        <span className="rotulo">Tema</span>
        <input
          value={tema}
          maxLength={80}
          placeholder="Fantasia sombria, cyberpunk, terror…"
          onChange={(e) => setTema(e.target.value)}
          onBlur={() => {
            if (tema.trim() !== c.tema) void alterarCampanha(c.id, { tema: tema.trim() }).then(() => aoMudar({ ...c, tema: tema.trim() }))
          }}
        />
      </label>
      <label className="campo">
        <span className="rotulo">Descrição</span>
        <textarea
          rows={3}
          value={descricao}
          maxLength={2000}
          placeholder="Do que se trata, onde começa, o que os jogadores precisam saber…"
          onChange={(e) => setDescricao(e.target.value)}
          onBlur={() => {
            if (descricao.trim() !== c.descricao)
              void alterarCampanha(c.id, { descricao: descricao.trim() }).then(() => aoMudar({ ...c, descricao: descricao.trim() }))
          }}
        />
      </label>
      <p className="campo__ajuda">
        Sistema: <strong>{nomeDoSistema(c.sistema)}</strong>. Ele é escolhido ao criar a campanha e não muda.
      </p>
    </section>
  )
}

function MinhaFicha({ c, aoMudar }: { c: MinhaCampanha; aoMudar: (c: MinhaCampanha) => void }) {
  const personagens = usePersonagens()
  const livres = useFichasLivres()
  const modelos = useModelos()
  const [erro, setErro] = useState('')
  const personalizada = c.sistema === 'personalizada'
  const opcoes = (personalizada
    ? livres.map((f) => ({ id: f.id, texto: `${f.nome} · ${modelos.find((m) => m.id === f.modeloId)?.nome ?? 'modelo'}` }))
    : personagens.map((p) => ({ id: p.id, texto: `${p.nome} · nível ${p.nivel}` }))
  ).filter((o) => fichaServe(c.sistema, o.id))
  const atual = c.meuPersonagem
  const [ocupado, setOcupado] = useState(false)

  async function escolher(personagemId: string) {
    setOcupado(true)
    setErro('')
    try {
      // A ficha precisa estar na nuvem para o mestre ver.
      await sincronizar()
      await vincularPersonagem(c.id, personagemId || null)
      aoMudar({ ...c, meuPersonagem: personagemId || null })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível vincular.')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <section className="bloco">
      <h2>Sua ficha nesta campanha</h2>
      <label className="campo">
        <span className="rotulo">Personagem</span>
        <select value={c.meuPersonagem ?? ''} onChange={(e) => void escolher(e.target.value)} disabled={ocupado}>
          <option value="">Nenhum</option>
          {opcoes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.texto}
            </option>
          ))}
          {atual && !opcoes.some((o) => o.id === atual) && <option value={atual}>Ficha que não está neste aparelho</option>}
        </select>
        <span className="campo__ajuda">
          Campanha {nomeDoSistema(c.sistema)}: {personalizada ? 'só entram fichas personalizadas' : 'só entram fichas de D&D 5e'}. O mestre vê esta ficha
          (sem poder mudar) e as rolagens feitas nela aparecem para a mesa.
        </span>
      </label>
      {opcoes.length === 0 && (
        <p className="suave">
          {personalizada ? (
            <>
              Você ainda não tem ficha personalizada. Crie uma no <a href={caminho.modelos()}>Construtor de fichas</a>.
            </>
          ) : (
            <>
              Você ainda não tem ficha de D&D 5e. <a href={caminho.criacao()}>Criar personagem</a>.
            </>
          )}
        </p>
      )}
      {erro && (
        <p className="aviso" role="alert">
          {erro}
        </p>
      )}
      {c.meuPersonagem && (
        <div>
          <a className="botao" href={c.meuPersonagem.startsWith('livre-') ? caminho.livre(c.meuPersonagem) : caminho.ficha(c.meuPersonagem)}>
            Abrir a ficha
          </a>
        </div>
      )}
    </section>
  )
}

function Mesa({ c, membros, erro, aoRemover }: { c: MinhaCampanha; membros: MembroDaMesa[]; erro: string; aoRemover: () => void }) {
  const [removendo, setRemovendo] = useState<MembroDaMesa | null>(null)
  return (
    <section className="bloco">
      <h2>Mesa</h2>
      {erro && <p className="aviso">{erro}</p>}
      {membros.length === 0 && !erro && <p className="suave">Ninguém entrou ainda.</p>}
      <ul className="mesa">
        {membros.map((m) => (
          <li key={m.usuario} className="mesa__membro">
            <span className="mesa__texto">
              <strong>{m.personagem_nome ?? 'Sem ficha'}</strong>
              <span className="suave">
                {[
                  m.apelido,
                  m.sistema === 'livre' ? m.modelo_nome && `Personalizada · ${m.modelo_nome}` : m.classe && `${nomeDaRaca(m.raca)} · ${nomeDaClasse(m.classe)} ${m.nivel ?? ''}`,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Jogador'}
              </span>
            </span>
            {c.souMestre && m.personagem_id && (
              <a className="botao" href={caminho.fichaMesa(c.id, m.personagem_id)}>
                <Icone nome="olho" />
                Ver ficha
              </a>
            )}
            {c.souMestre && (
              <button type="button" className="botao botao--fantasma botao--icone" onClick={() => setRemovendo(m)} aria-label={`Remover ${m.apelido || m.personagem_nome || 'jogador'}`}>
                <Icone nome="fechar" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <Dialogo
        aberto={!!removendo}
        titulo="Remover da mesa"
        aoFechar={() => setRemovendo(null)}
        rodape={
          <>
            <button type="button" className="botao" onClick={() => setRemovendo(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="botao botao--perigo"
              onClick={() => {
                if (removendo) void removerDaMesa(c.id, removendo.usuario).then(aoRemover)
                setRemovendo(null)
              }}
            >
              Remover
            </button>
          </>
        }
      >
        <p>A pessoa sai da campanha. A ficha dela continua na conta dela; ela pode voltar com o código.</p>
      </Dialogo>
    </section>
  )
}

function CampoNotas({ titulo, ajuda, inicial, salvar }: { titulo: string; ajuda: string; inicial: string; salvar: (t: string) => Promise<void> }) {
  const [texto, setTexto] = useState(inicial)
  const [estado, setEstado] = useState('')
  useEffect(() => setTexto(inicial), [inicial])
  return (
    <label className="campo">
      <span className="rotulo">{titulo}</span>
      <textarea
        rows={6}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value)
          setEstado('')
        }}
        onBlur={() => {
          if (texto === inicial) return
          setEstado('Salvando…')
          salvar(texto)
            .then(() => setEstado('Salvo.'))
            .catch((e: Error) => setEstado(e.message))
        }}
      />
      <span className="campo__ajuda" aria-live="polite">
        {estado || ajuda}
      </span>
    </label>
  )
}

function Notas({ c }: { c: MinhaCampanha }) {
  const doMestre = useCarga(() => (c.souMestre ? lerNotasDoMestre(c.id) : Promise.resolve('')), [c.id, c.souMestre])
  return (
    <section className="bloco">
      <h2>Anotações</h2>
      {c.souMestre ? (
        <>
          <CampoNotas titulo="Da mesa" ajuda="Todos da campanha leem. Salva ao sair do campo." inicial={c.notas} salvar={(t) => salvarNotas(c.id, t)} />
          {doMestre.dados !== null && (
            <CampoNotas titulo="Só do mestre" ajuda="Ninguém mais vê." inicial={doMestre.dados} salvar={(t) => salvarNotasDoMestre(c.id, t)} />
          )}
        </>
      ) : c.notas ? (
        <p className="campanha__notas">{c.notas}</p>
      ) : (
        <p className="suave">O mestre ainda não escreveu nada.</p>
      )}
    </section>
  )
}

function hora(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function Rolagens({ c }: { c: MinhaCampanha }) {
  const { dados, setDados, erro } = useCarga(() => rolagensRecentes(c.id), [c.id])

  useEffect(
    () => ouvirRolagens(c.id, (r) => setDados((atuais) => juntarRolagens(atuais ?? [], [r]))),
    [c.id, setDados],
  )

  return (
    <section className="bloco">
      <div className="bloco__cabeca">
        <h2>Rolagens ao vivo</h2>
        {c.souMestre && (dados?.length ?? 0) > 0 && (
          <button type="button" className="botao botao--fantasma" onClick={() => void limparRolagens(c.id).then(() => setDados([]))}>
            Limpar
          </button>
        )}
      </div>
      <p className="campo__ajuda">
        Rolagens feitas nas fichas vinculadas aparecem aqui na hora. As que você fizer nesta tela (botão Dados) também.
      </p>
      {erro && <p className="aviso">{erro}</p>}
      {dados && dados.length === 0 && <p className="suave">Nenhuma rolagem ainda.</p>}
      <ol className="historico__lista" aria-live="polite">
        {(dados ?? []).map((r) => (
          <LinhaRolagem key={r.id} r={r} />
        ))}
      </ol>
    </section>
  )
}

function LinhaRolagem({ r }: { r: RolagemDaMesa }) {
  const d = r.detalhe
  const extra = [d.modo === 'vantagem' ? 'vantagem' : d.modo === 'desvantagem' ? 'desvantagem' : '', d.critico ? 'crítico' : '']
    .filter(Boolean)
    .join(' · ')
  return (
    <li className="historico__item">
      <div className="historico__texto">
        <span className="historico__rotulo">
          <strong>{r.quem}</strong> · {r.rotulo || 'Rolagem'}
        </span>
        <span className="suave">
          {r.expressao}
          {extra && ` · ${extra}`} · {hora(r.criado_em)}
        </span>
        <DetalheDados r={{ ...d, expressao: r.expressao, rotulo: r.rotulo, total: r.total }} />
      </div>
      <span className={`historico__total numeros ${d.d20 === 20 ? 'e-max' : d.d20 === 1 ? 'e-min' : ''}`}>{r.total}</span>
    </li>
  )
}

function ZonaDePerigo({ c }: { c: MinhaCampanha }) {
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState('')
  const acao = c.souMestre ? 'Apagar campanha' : 'Sair da campanha'
  return (
    <section className="bloco campanha__perigo">
      <div>
        <button type="button" className="botao botao--perigo" onClick={() => setConfirmando(true)}>
          {c.souMestre && <Icone nome="lixo" />}
          {acao}
        </button>
      </div>
      <Dialogo
        aberto={confirmando}
        titulo={acao}
        aoFechar={() => setConfirmando(false)}
        rodape={
          <>
            <button type="button" className="botao" onClick={() => setConfirmando(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="botao botao--perigo"
              onClick={() => {
                ;(c.souMestre ? apagarCampanha(c.id) : sairDaCampanha(c.id))
                  .then(() => irPara(caminho.campanhas()))
                  .catch((e: Error) => setErro(e.message))
              }}
            >
              {acao}
            </button>
          </>
        }
      >
        <p>
          {c.souMestre
            ? 'A campanha, as anotações e as rolagens somem para todos. As fichas dos jogadores continuam com eles.'
            : 'Você deixa a mesa e o mestre para de ver sua ficha. Dá para voltar com o código.'}
        </p>
        {erro && <p className="aviso">{erro}</p>}
      </Dialogo>
    </section>
  )
}
