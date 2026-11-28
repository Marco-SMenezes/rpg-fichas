import { useState, type FormEvent } from 'react'
import { criarCampanha, entrarNaCampanha, listarCampanhas, type MinhaCampanha } from '../../../nuvem/campanhas'
import { LADO_DA_IMAGEM } from '../../../imagem/retrato'
import { CampoRetrato } from '../../componentes/CampoRetrato'
import { codigoValido, nomeDoSistema, SISTEMAS, type SistemaDaCampanha } from '../../../nuvem/mesa'
import { useFichasLivres } from '../../../universal/armazenamento'
import { nuvemConfigurada } from '../../../nuvem/config'
import { verificarConta } from '../../../nuvem/nuvem'
import { ConteudoConta } from '../../componentes/Conta'
import { Dialogo } from '../../componentes/Dialogo'
import { Icone } from '../../componentes/Icone'
import { Topo } from '../../componentes/Topo'
import { useNuvem, usePersonagens } from '../../estado'
import { caminho, irPara } from '../../rotas'
import { useCarga } from './usarCarga'

export function Campanhas() {
  const nuvem = useNuvem()
  const [entrando, setEntrando] = useState(false)
  const liberado = nuvemConfigurada && nuvem.status === 'logado' && nuvem.aprovado !== false
  return (
    <>
      <Topo />
      <main id="conteudo" tabIndex={-1} className="pagina campanhas">
        <div className="lista__cabeca">
          <div>
            <h1>Campanhas</h1>
            <p className="suave">O mestre cria a campanha e passa o código; cada jogador entra e escolhe a ficha.</p>
          </div>
          {liberado && (
            <div className="acoes">
              <button type="button" className="botao botao--primario" onClick={() => setEntrando(true)}>
                <Icone nome="avancar" />
                Entrar com código
              </button>
            </div>
          )}
        </div>
        {!nuvemConfigurada ? (
          <section className="bloco campanhas__entrar">
            <h2>Falta ligar a nuvem</h2>
            <p>
              Campanhas juntam mestre e jogadores em aparelhos diferentes, então precisam de um servidor. Assim que o Supabase do Tomo for
              configurado, aqui aparecem o login e as campanhas: criar com código de convite, entrar pelo código, mesa com as fichas, rolagens ao vivo
              e anotações.
            </p>
            <p className="suave">Enquanto isso, personagens e dados funcionam normalmente neste aparelho.</p>
          </section>
        ) : nuvem.status === 'logado' && nuvem.aprovado === false ? (
          <section className="bloco campanhas__entrar">
            <h2>Aguardando aprovação</h2>
            <p>Seu pedido de conta foi enviado ao dono do Tomo. Assim que ele aprovar, as campanhas liberam aqui.</p>
            <div>
              <button type="button" className="botao" onClick={() => void verificarConta()}>
                Verificar de novo
              </button>
            </div>
          </section>
        ) : nuvem.status === 'logado' ? (
          <ListaCampanhas />
        ) : (
          <section className="bloco campanhas__entrar">
            <h2>Entre na sua conta</h2>
            <p className="suave">Campanhas ficam na nuvem, então precisam de uma conta.</p>
            <ConteudoConta />
          </section>
        )}
      </main>
      <Dialogo aberto={entrando} titulo="Entrar com código" aoFechar={() => setEntrando(false)}>
        <FormEntrar />
      </Dialogo>
    </>
  )
}

function ListaCampanhas() {
  const { dados, erro, carregando } = useCarga(listarCampanhas, [])
  return (
    <>
      {erro && (
        <p className="aviso" role="alert">
          {erro}
        </p>
      )}
      {carregando && !dados && <p className="suave">Carregando…</p>}
      {dados && dados.length === 0 && <p className="suave">Você ainda não está em nenhuma campanha.</p>}
      {dados && dados.length > 0 && (
        <ul className="lista__itens">
          {dados.map((c) => (
            <LinhaCampanha key={c.id} c={c} />
          ))}
        </ul>
      )}
      <FormCriar />
    </>
  )
}

function LinhaCampanha({ c }: { c: MinhaCampanha }) {
  const lista = usePersonagens()
  const livres = useFichasLivres()
  const pj = lista.find((p) => p.id === c.meuPersonagem) ?? livres.find((f) => f.id === c.meuPersonagem)
  return (
    <li className="pj pj--seta">
      <a className="pj__link" href={caminho.campanha(c.id)}>
        {c.imagem ? (
          <img className="pj__nivel campanha__miniatura" src={c.imagem} alt="" />
        ) : (
          <span className="pj__nivel" aria-hidden="true">
            <Icone nome={c.souMestre ? 'estrela' : 'd20'} />
          </span>
        )}
        <span className="pj__texto">
          <span className="pj__nome">{c.nome}</span>
          <span className="pj__resumo">
            {[nomeDoSistema(c.sistema), c.tema, c.souMestre ? 'Você é o mestre' : pj ? `Jogando com ${pj.nome}` : 'Escolha a sua ficha']
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
      </a>
      <Icone nome="avancar" />
    </li>
  )
}

function FormEntrar() {
  const [codigo, setCodigo] = useState('')
  const [apelido, setApelido] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!codigoValido(codigo)) {
      setErro('O código tem 6 letras e números.')
      return
    }
    setOcupado(true)
    setErro('')
    try {
      irPara(caminho.campanha(await entrarNaCampanha(codigo, apelido)))
    } catch (x) {
      setErro(x instanceof Error ? x.message : 'Não foi possível entrar.')
      setOcupado(false)
    }
  }

  return (
    <form className="campanhas__entrar-codigo" onSubmit={enviar}>
      <p className="suave">Peça o código ao mestre da mesa.</p>
      <label className="campo">
        <span className="rotulo">Código do mestre</span>
        <input
          className="conta__codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          maxLength={8}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="K7M2QX"
          required
        />
      </label>
      <label className="campo">
        <span className="rotulo">Seu nome na mesa</span>
        <input value={apelido} onChange={(e) => setApelido(e.target.value)} maxLength={40} autoComplete="nickname" placeholder="Ana…" />
      </label>
      {erro && (
        <p className="aviso" role="alert">
          {erro}
        </p>
      )}
      <div>
        <button type="submit" className="botao botao--primario" disabled={ocupado}>
          {ocupado ? 'Entrando…' : 'Entrar'}
        </button>
      </div>
    </form>
  )
}

function FormCriar() {
  const [nome, setNome] = useState('')
  const [sistema, setSistema] = useState<SistemaDaCampanha>('dnd5e')
  const [tema, setTema] = useState('')
  const [descricao, setDescricao] = useState('')
  const [imagem, setImagem] = useState<string | undefined>()
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setOcupado(true)
    setErro('')
    try {
      irPara(caminho.campanha(await criarCampanha({ nome, sistema, tema, descricao, imagem: imagem ?? null })))
    } catch (x) {
      setErro(x instanceof Error ? x.message : 'Não foi possível criar.')
      setOcupado(false)
    }
  }

  return (
    <form className="bloco campanhas__criar" onSubmit={enviar}>
      <h2>Criar campanha</h2>
      <CampoRetrato
        valor={imagem}
        aoMudar={setImagem}
        nome={nome}
        rotulo="Imagem da campanha"
        ajuda="Opcional. Um mapa, uma arte, a capa… Aparece para todos da mesa."
        lado={LADO_DA_IMAGEM}
      />
      <label className="campo">
        <span className="rotulo">Nome</span>
        <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} required placeholder="A Mina Perdida…" />
      </label>
      <label className="campo">
        <span className="rotulo">Sistema</span>
        <select value={sistema} onChange={(e) => setSistema(e.target.value as SistemaDaCampanha)}>
          {SISTEMAS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
        <span className="campo__ajuda">{SISTEMAS.find((s) => s.id === sistema)?.ajuda} Não dá para trocar depois.</span>
      </label>
      <label className="campo">
        <span className="rotulo">Tema</span>
        <input value={tema} onChange={(e) => setTema(e.target.value)} maxLength={80} placeholder="Fantasia sombria, cyberpunk, terror…" />
      </label>
      <label className="campo">
        <span className="rotulo">Descrição</span>
        <textarea
          rows={3}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          maxLength={2000}
          placeholder="Do que se trata, onde começa, o que os jogadores precisam saber…"
        />
      </label>
      {erro && (
        <p className="aviso" role="alert">
          {erro}
        </p>
      )}
      <div>
        <button type="submit" className="botao" disabled={ocupado}>
          <Icone nome="mais" />
          {ocupado ? 'Criando…' : 'Criar como mestre'}
        </button>
      </div>
    </form>
  )
}
