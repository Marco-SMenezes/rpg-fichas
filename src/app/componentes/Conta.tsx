import { useState, type FormEvent } from 'react'
import { codigoPorEmail, nuvemConfigurada } from '../../nuvem/config'
import { confirmarCodigo, criarConta, entrarComSenha, enviarCodigo, resolverOutraConta, sair, sincronizar, verificarConta } from '../../nuvem/nuvem'
import { caminho } from '../rotas'
import { useNuvem } from '../estado'
import { Dialogo } from './Dialogo'
import { Icone } from './Icone'

function hora(iso?: string) {
  return iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
}

/** Botão de conta no topo. Só aparece quando o Supabase está configurado. */
export function BotaoConta() {
  const [aberto, setAberto] = useState(false)
  if (!nuvemConfigurada) return null
  return (
    <>
      <button type="button" className="botao botao--fantasma botao--icone" onClick={() => setAberto(true)} aria-label="Conta e nuvem">
        <Icone nome="nuvem" />
        <IndicadorNuvem />
      </button>
      <Dialogo aberto={aberto} titulo="Conta" aoFechar={() => setAberto(false)}>
        <ConteudoConta />
      </Dialogo>
    </>
  )
}

function IndicadorNuvem() {
  const n = useNuvem()
  if (n.status !== 'logado') return null
  const tipo = n.erro || n.fichasDeOutraConta || n.pendentes || n.aprovado === false ? 'atencao' : n.sincronizando ? 'ocupado' : 'ok'
  return <span className={`conta__ponto conta__ponto--${tipo}`} aria-hidden="true" />
}

export function ConteudoConta() {
  const n = useNuvem()
  if (n.status === 'iniciando') return <p className="campo__ajuda">Carregando…</p>
  if (n.status === 'logado') return <Logado />
  return <Entrar erroInicial={n.erro} />
}

function Entrar({ erroInicial }: { erroInicial?: string }) {
  const [modo, setModo] = useState<'entrar' | 'criar' | 'codigo'>('entrar')
  return (
    <div className="conta">
      <p>Entre para guardar as fichas na nuvem, abrir em qualquer aparelho e jogar em campanhas.</p>
      {modo !== 'codigo' && (
        <div className="segmentos" role="group" aria-label="Entrar ou criar conta">
          <button type="button" aria-pressed={modo === 'entrar'} onClick={() => setModo('entrar')}>
            Entrar
          </button>
          <button type="button" aria-pressed={modo === 'criar'} onClick={() => setModo('criar')}>
            Criar conta
          </button>
        </div>
      )}
      {modo === 'codigo' ? <EntrarComCodigo erroInicial={erroInicial} aoVoltar={() => setModo('entrar')} /> : <EntrarComSenha key={modo} criar={modo === "criar"} erroInicial={erroInicial} />}
      {modo !== 'codigo' && codigoPorEmail && (
        <button type="button" className="botao botao--fantasma" onClick={() => setModo('codigo')}>
          Entrar com código por e-mail
        </button>
      )}
      <p className="campo__ajuda">Sem conta, o Tomo continua funcionando só neste aparelho.</p>
    </div>
  )
}

function EntrarComSenha({ criar, erroInicial }: { criar: boolean; erroInicial?: string }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [ver, setVer] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState(erroInicial ?? '')

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setOcupado(true)
    setErro('')
    const falha = criar ? await criarConta(email.trim(), senha, nome.trim()) : await entrarComSenha(email.trim(), senha)
    setOcupado(false)
    if (falha) setErro(falha)
  }

  return (
    <form className="conta conta--form" onSubmit={enviar}>
      {criar && (
        <>
          <p className="nota">
            Criar conta envia um pedido ao dono do Tomo. Você já entra, mas a nuvem e as campanhas só liberam depois que ele
            aprovar.
          </p>
          <label className="campo">
            <span className="rotulo">Seu nome</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={60} autoComplete="name" placeholder="Para o dono saber quem é…" />
          </label>
        </>
      )}
      <label className="campo">
        <span className="rotulo">E-mail</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com…"
        />
      </label>
      <label className="campo">
        <span className="rotulo">Senha</span>
        <span className="conta__senha">
          <input
            type={ver ? 'text' : 'password'}
            name="senha"
            autoComplete={criar ? 'new-password' : 'current-password'}
            required
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <button type="button" className="botao botao--fantasma botao--icone" onClick={() => setVer(!ver)} aria-label={ver ? 'Esconder senha' : 'Mostrar senha'}>
            <Icone nome={ver ? 'olho_fechado' : 'olho'} />
          </button>
        </span>
        {criar && <span className="campo__ajuda">Pelo menos 6 caracteres.</span>}
      </label>
      {erro && (
        <p className="aviso" role="alert">
          {erro}
        </p>
      )}
      <button type="submit" className="botao botao--primario" disabled={ocupado}>
        {ocupado ? 'Aguarde…' : criar ? 'Pedir conta' : 'Entrar'}
      </button>
    </form>
  )
}

function EntrarComCodigo({ erroInicial, aoVoltar }: { erroInicial?: string; aoVoltar: () => void }) {
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState(erroInicial ?? '')

  async function pedirCodigo(e: FormEvent) {
    e.preventDefault()
    setOcupado(true)
    setErro('')
    const falha = await enviarCodigo(email.trim())
    setOcupado(false)
    if (falha) setErro(falha)
    else setEtapa('codigo')
  }

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setOcupado(true)
    setErro('')
    const falha = await confirmarCodigo(email.trim(), codigo.trim())
    setOcupado(false)
    if (falha) setErro(falha)
  }

  if (etapa === 'email')
    return (
      <form className="conta conta--form" onSubmit={pedirCodigo}>
        <label className="campo">
          <span className="rotulo">E-mail</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com…"
          />
        </label>
        {erro && (
          <p className="aviso" role="alert">
            {erro}
          </p>
        )}
        <div className="acoes">
          <button type="submit" className="botao botao--primario" disabled={ocupado}>
            {ocupado ? 'Enviando…' : 'Enviar código'}
          </button>
          <button type="button" className="botao botao--fantasma" onClick={aoVoltar}>
            Voltar para senha
          </button>
        </div>
      </form>
    )

  return (
    <form className="conta conta--form" onSubmit={entrar}>
      <p>
        Enviamos para <strong>{email}</strong>. Digite o código ou toque no link do e-mail neste mesmo navegador.
      </p>
      <label className="campo">
        <span className="rotulo">Código</span>
        <input
          name="codigo"
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="[0-9]{6,10}"
          maxLength={10}
          required
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          className="conta__codigo"
        />
      </label>
      {erro && (
        <p className="aviso" role="alert">
          {erro}
        </p>
      )}
      <div className="acoes">
        <button type="submit" className="botao botao--primario" disabled={ocupado}>
          {ocupado ? 'Entrando…' : 'Entrar'}
        </button>
        <button type="button" className="botao botao--fantasma" onClick={() => { setEtapa('email'); setCodigo(''); setErro('') }}>
          Trocar e-mail
        </button>
      </div>
    </form>
  )
}

function Logado() {
  const n = useNuvem()
  const [confirmarApagar, setConfirmarApagar] = useState(false)

  if (n.fichasDeOutraConta)
    return (
      <div className="conta">
        <p className="nota">
          Este aparelho tem {n.fichasDeOutraConta} {n.fichasDeOutraConta === 1 ? 'ficha' : 'fichas'} de outra conta. O que fazer com{' '}
          {n.fichasDeOutraConta === 1 ? 'ela' : 'elas'}?
        </p>
        <button type="button" className="botao botao--primario" onClick={() => void resolverOutraConta('juntar')}>
          Juntar nesta conta
        </button>
        <button type="button" className="botao" onClick={() => void resolverOutraConta('trocar')}>
          Tirar deste aparelho e baixar as desta conta
        </button>
        <p className="campo__ajuda">Tirar daqui não apaga da outra conta.</p>
      </div>
    )

  if (n.aprovado === false)
    return (
      <div className="conta">
        <p>
          Conectado como <strong>{n.email}</strong>.
        </p>
        <p className="nota">
          <strong>Pedido enviado.</strong> Assim que o dono do Tomo aprovar, suas fichas sobem para a conta e as campanhas
          liberam. Enquanto isso, tudo continua funcionando neste aparelho.
        </p>
        <button type="button" className="botao" onClick={() => void verificarConta()}>
          Verificar de novo
        </button>
        <button type="button" className="botao botao--fantasma" onClick={() => void sair(false)}>
          Sair
        </button>
      </div>
    )

  const situacao = n.sincronizando
    ? 'Sincronizando…'
    : n.erro
      ? n.erro
      : n.ultimaSincronizacao
        ? `Sincronizado às ${hora(n.ultimaSincronizacao)}.`
        : 'Aguardando a primeira sincronização.'

  return (
    <div className="conta">
      <p>
        Conectado como <strong>{n.email}</strong>.
      </p>
      {n.admin && (
        <a className="botao" href={caminho.contas()}>
          Pedidos de conta{n.pendentes ? ` (${n.pendentes})` : ''}
        </a>
      )}
      {n.enviadasNoPrimeiroLogin ? (
        <p className="nota">
          {n.enviadasNoPrimeiroLogin === 1 ? 'A ficha deste aparelho foi guardada' : `As ${n.enviadasNoPrimeiroLogin} fichas deste aparelho foram guardadas`} na sua
          conta.
        </p>
      ) : null}
      <p className={n.erro ? 'aviso' : 'campo__ajuda'} role="status" aria-live="polite">
        {situacao}
      </p>
      <button type="button" className="botao" onClick={() => void sincronizar()} disabled={n.sincronizando}>
        Sincronizar agora
      </button>
      <p className="campo__ajuda">As fichas são salvas neste aparelho na hora e sobem para a nuvem logo depois, mesmo que a internet caia no meio.</p>
      <hr className="conta__divisor" />
      {confirmarApagar ? (
        <>
          <p className="aviso">As fichas continuam na sua conta, mas somem deste aparelho. Alterações que ainda não subiram se perdem.</p>
          <div className="acoes">
            <button type="button" className="botao botao--perigo" onClick={() => void sair(true)}>
              Sair e apagar daqui
            </button>
            <button type="button" className="botao botao--fantasma" onClick={() => setConfirmarApagar(false)}>
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <div className="acoes">
          <button type="button" className="botao" onClick={() => void sair(false)}>
            Sair
          </button>
          <button type="button" className="botao botao--fantasma" onClick={() => setConfirmarApagar(true)}>
            Sair e apagar deste aparelho…
          </button>
        </div>
      )}
    </div>
  )
}
