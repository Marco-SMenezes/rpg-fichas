import { useState } from 'react'
import { ARMADURAS, ARMAS, ITENS } from '../../../regras/dnd5e/dados/equipamento'
import { itensDoCatalogo, novoId } from '../../../regras/dnd5e/motor/criacao'
import type { ItemInventario, Personagem } from '../../../regras/dnd5e/tipos'
import { Contador } from '../../componentes/Contador'
import { Dialogo } from '../../componentes/Dialogo'
import { Icone } from '../../componentes/Icone'
import { formatarNumero } from '../../util'
import type { PropsAba } from './contexto'

const MOEDAS = [
  ['pc', 'PC', 'cobre'],
  ['pp', 'PP', 'prata'],
  ['pe', 'PE', 'electro'],
  ['po', 'PO', 'ouro'],
  ['pl', 'PL', 'platina'],
] as const

export function AbaInventario({ p, f, atualizar }: PropsAba) {
  const [adicionando, setAdicionando] = useState(false)
  const mudarItem = (uid: string, parcial: Partial<ItemInventario>) =>
    atualizar({ ...p, inventario: p.inventario.map((i) => (i.uid === uid ? { ...i, ...parcial } : i)) })
  const remover = (uid: string) => atualizar({ ...p, inventario: p.inventario.filter((i) => i.uid !== uid) })
  const percentual = Math.min(100, (f.carga.peso / f.carga.capacidade) * 100)

  return (
    <div className="aba-inventario">
      <section className="bloco" aria-labelledby="t-carga">
        <div className="bloco__cabeca">
          <h2 id="t-carga">Carga</h2>
          <span className="numeros">
            {formatarNumero(f.carga.peso)} / {formatarNumero(f.carga.capacidade)} kg
          </span>
        </div>
        <div className="medidor" aria-hidden="true">
          <span style={{ inlineSize: `${percentual}%` }} className={percentual >= 100 ? 'medidor--cheio' : ''} />
        </div>
        <p className="campo__ajuda numeros">
          Capacidade = Força × 7,5 kg. Empurrar, arrastar ou levantar: até {formatarNumero(f.carga.arrastar)} kg (LdJ p.
          178).
        </p>
      </section>

      <section className="bloco" aria-labelledby="t-moedas">
        <h2 id="t-moedas">Moedas</h2>
        <div className="moedas">
          {MOEDAS.map(([id, abrev, nome]) => (
            <label key={id} className="campo">
              <span className="rotulo" title={nome}>
                {abrev}
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={p.moedas[id]}
                onChange={(e) => atualizar({ ...p, moedas: { ...p.moedas, [id]: Math.max(0, Number(e.target.value) || 0) } })}
                className="numeros"
                aria-label={`Peças de ${nome}`}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="bloco" aria-labelledby="t-itens">
        <div className="bloco__cabeca">
          <h2 id="t-itens">Itens</h2>
          <button type="button" className="botao" onClick={() => setAdicionando(true)}>
            <Icone nome="mais" />
            Adicionar
          </button>
        </div>
        <ul className="itens">
          {p.inventario.map((i) => {
            const equipavel = !!i.itemId && ARMADURAS.some((a) => a.id === i.itemId)
            return (
              <li key={i.uid} className="item">
                <div className="item__principal">
                  <span className="item__nome">{i.nome}</span>
                  <span className="suave numeros">{i.peso ? `${formatarNumero(i.peso * i.quantidade)} kg` : '—'}</span>
                </div>
                <div className="item__controles">
                  <Contador
                    rotulo={`quantidade de ${i.nome}`}
                    valor={i.quantidade}
                    min={0}
                    aoMudar={(v) => mudarItem(i.uid, { quantidade: v })}
                  />
                  {equipavel && (
                    <label className="alternar">
                      <input type="checkbox" checked={i.equipado} onChange={(e) => mudarItem(i.uid, { equipado: e.target.checked })} />
                      Vestindo
                    </label>
                  )}
                  <button
                    type="button"
                    className="botao botao--fantasma botao--icone"
                    onClick={() => remover(i.uid)}
                    aria-label={`Remover ${i.nome}`}
                  >
                    <Icone nome="lixo" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <DialogoAdicionar aberto={adicionando} aoFechar={() => setAdicionando(false)} p={p} atualizar={atualizar} />
    </div>
  )
}

function DialogoAdicionar({
  aberto,
  aoFechar,
  p,
  atualizar,
}: {
  aberto: boolean
  aoFechar: () => void
  p: Personagem
  atualizar: (p: Personagem) => void
}) {
  const [itemId, setItemId] = useState('')
  const [nome, setNome] = useState('')
  const [peso, setPeso] = useState('')
  const [erro, setErro] = useState('')

  const adicionar = () => {
    let novo: ItemInventario
    if (itemId) {
      novo = itensDoCatalogo([{ itemId, quantidade: 1 }])[0]!
      novo.equipado = false
    } else if (nome.trim()) {
      novo = {
        uid: novoId('item'),
        itemId: null,
        nome: nome.trim(),
        quantidade: 1,
        peso: Math.max(0, Number(peso.replace(',', '.')) || 0),
        equipado: false,
        notas: '',
      }
    } else {
      setErro('Escolha um item do livro ou escreva um nome.')
      return
    }
    atualizar({ ...p, inventario: [...p.inventario, novo] })
    setItemId('')
    setNome('')
    setPeso('')
    setErro('')
    aoFechar()
  }

  return (
    <Dialogo
      aberto={aberto}
      titulo="Adicionar item"
      aoFechar={aoFechar}
      rodape={
        <button type="button" className="botao botao--primario" onClick={adicionar}>
          Adicionar
        </button>
      }
    >
      <label className="campo">
        <span className="rotulo">Do livro</span>
        <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
          <option value="">Item próprio…</option>
          <optgroup label="Armas">
            {ARMAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </optgroup>
          <optgroup label="Armaduras">
            {ARMADURAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </optgroup>
          <optgroup label="Equipamento">
            {ITENS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      {!itemId && (
        <>
          <label className="campo">
            <span className="rotulo">Nome</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Mapa da cripta…" autoComplete="off" />
          </label>
          <label className="campo">
            <span className="rotulo">Peso (kg)</span>
            <input value={peso} onChange={(e) => setPeso(e.target.value)} inputMode="decimal" placeholder="0,5…" autoComplete="off" />
          </label>
        </>
      )}
      <p className="aviso-campo" role="alert">
        {erro}
      </p>
    </Dialogo>
  )
}
