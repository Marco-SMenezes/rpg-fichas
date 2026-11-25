import { useState, type FormEvent } from 'react'
import { criarCampanha, entrarNaCampanha, listarCampanhas, type MinhaCampanha } from '../../../nuvem/campanhas'
import { codigoValido } from '../../../nuvem/mesa'
import { ConteudoConta } from '../../componentes/Conta'
import { Icone } from '../../componentes/Icone'
import { Topo } from '../../componentes/Topo'
import { useNuvem, usePersonagens } from '../../estado'
import { caminho, irPara } from '../../rotas'
import { useCarga } from './usarCarga'

export function Campanhas() {
  const nuvem = useNuvem()
  return (
    <>
      <Topo voltarPara={caminho.lista()} titulo="Campanhas" />
      <main id="conteudo" tabIndex={-1} className="pagina campanhas">
        <div className="lista__cabeca">
          <div>
            <h1>Campanhas</h1>
            <p className="suave">O mestre cria a campanha e passa o código; cada jogador entra e escolhe a ficha.</p>
          </div>
        </div>
        {nuvem.status === 'logado' ? (
          <ListaCampanhas />
        ) : (
          <section className="bloco campanhas__entrar">
            <h2>Entre na sua conta</h2>
            <p className="suave">Campanhas ficam na nuvem, então precisam de uma conta.</p>
            <ConteudoConta />
          </section>
        )}
      </main>
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
      <div className="campanhas__formularios">
        <FormEntrar />
        <FormCriar />
      </div>
    </>
  )
}

function LinhaCampanha({ c }: { c: MinhaCampanha }) {
  const lista = usePersonagens()
  const pj = lista.find((p) => p.id === c.meuPersonagem)
  return (
    <li className="pj">
      <a className="pj__link" href={caminho.campanha(c.id)}>
        <span className="pj__nivel" aria-hidden="true">
          <Icone nome={c.souMestre ? 'estrela' : 'd20'} />
        </span>
        <span className="pj__texto">
          <span className="pj__nome">{c.nome}</span>
          <span className="pj__resumo">
            {c.souMestre ? 'Você é o mestre' : pj ? `Jogando com ${pj.nome}` : 'Escolha a sua ficha'}
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
    <form className="bloco" onSubmit={enviar}>
      <h2>Entrar com código</h2>
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
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setOcupado(true)
    setErro('')
    try {
      irPara(caminho.campanha(await criarCampanha(nome)))
    } catch (x) {
      setErro(x instanceof Error ? x.message : 'Não foi possível criar.')
      setOcupado(false)
    }
  }

  return (
    <form className="bloco" onSubmit={enviar}>
      <h2>Criar campanha</h2>
      <label className="campo">
        <span className="rotulo">Nome</span>
        <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} required placeholder="A Mina Perdida…" />
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
