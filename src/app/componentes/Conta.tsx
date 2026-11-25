import { useState, type FormEvent } from 'react'
import { nuvemConfigurada } from '../../nuvem/config'
import { confirmarCodigo, enviarCodigo, resolverOutraConta, sair, sincronizar } from '../../nuvem/nuvem'
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
  const tipo = n.erro || n.fichasDeOutraConta ? 'atencao' : n.sincronizando ? 'ocupado' : 'ok'
  return <span className={`conta__ponto conta__ponto--${tipo}`} aria-hidden="true" />
}

export function ConteudoConta() {
  const n = useNuvem()
  if (n.status === 'iniciando') return <p className="campo__ajuda">Carregando…</p>
  if (n.status === 'logado') return <Logado />
  return <Entrar erroInicial={n.erro} />
}

function Entrar({ erroInicial }: { erroInicial?: string }) {
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
      <form className="conta" onSubmit={pedirCodigo}>
        <p>Entre com seu e-mail para guardar as fichas na nuvem e abrir em qualquer aparelho. Não precisa de senha.</p>
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
        {erro && <p className="aviso" role="alert">{erro}</p>}
        <button type="submit" className="botao botao--primario" disabled={ocupado}>
          {ocupado ? 'Enviando…' : 'Enviar código'}
        </button>
        <p className="campo__ajuda">Sem conta, o Tomo continua funcionando só neste aparelho.</p>
      </form>
    )

  return (
    <form className="conta" onSubmit={entrar}>
      <p>
        Enviamos um código para <strong>{email}</strong>. Digite aqui ou toque no link do e-mail neste mesmo navegador.
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
      {erro && <p className="aviso" role="alert">{erro}</p>}
      <div className="acoes">
        <button type="submit" className="botao botao--primario" disabled={ocupado}>
          {ocupado ? 'Entrando…' : 'Entrar'}
        </button>
        <button type="button" className="botao botao--fantasma" onClick={() => { setEtapa('email'); setCodigo(''); setErro('') }}>
          Trocar e-mail
        </button>
      </div>
      <p className="campo__ajuda">Não chegou? Veja o spam ou peça de novo em um minuto.</p>
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
