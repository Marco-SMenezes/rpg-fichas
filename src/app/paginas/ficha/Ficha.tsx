import { useEffect, useState } from 'react'
import { calcularFicha } from '../../../regras/dnd5e/motor/ficha'
import type { Personagem } from '../../../regras/dnd5e/tipos'
import { expressaoTeste, sinal } from '../../../rolagem/rolagem'
import { Icone } from '../../componentes/Icone'
import { useRolador } from '../../componentes/Rolador'
import { Topo } from '../../componentes/Topo'
import { personagens, usePersonagens } from '../../estado'
import { caminho } from '../../rotas'
import { formatarNumero, resumoPersonagem } from '../../util'
import { AbaCombate } from './AbaCombate'
import { AbaHabilidades } from './AbaHabilidades'
import { AbaInventario } from './AbaInventario'
import { AbaNotas } from './AbaNotas'
import { AbaPericias } from './AbaPericias'
import { DialogoDescanso, DialogoNivel, DialogoVida } from './Dialogos'

const ABAS = [
  { id: 'combate', nome: 'Combate', componente: AbaCombate },
  { id: 'pericias', nome: 'Perícias', componente: AbaPericias },
  { id: 'habilidades', nome: 'Habilidades', componente: AbaHabilidades },
  { id: 'inventario', nome: 'Inventário', componente: AbaInventario },
  { id: 'notas', nome: 'Notas', componente: AbaNotas },
] as const

export function Ficha({ id, aba }: { id: string; aba: string | null }) {
  const lista = usePersonagens()
  const p = lista.find((x) => x.id === id)

  useEffect(() => {
    document.title = p ? `${p.nome} · Tomo` : 'Tomo'
    return () => {
      document.title = 'Tomo'
    }
  }, [p])

  if (!p) {
    return (
      <>
        <Topo voltarPara={caminho.lista()} titulo="Ficha" />
        <main id="conteudo" tabIndex={-1} className="pagina vazio">
          <h1>Ficha não encontrada</h1>
          <p className="suave">Ela pode ter sido excluída ou estar salva em outro aparelho.</p>
          <a className="botao" href={caminho.lista()}>
            Ver personagens
          </a>
        </main>
      </>
    )
  }
  return <FichaPersonagem key={p.id} p={p} aba={aba} />
}

type DialogoAberto = 'vida' | 'descanso' | 'nivel' | null

function FichaPersonagem({ p, aba }: { p: Personagem; aba: string | null }) {
  const f = calcularFicha(p)
  const { rolar } = useRolador()
  const [dialogo, setDialogo] = useState<DialogoAberto>(null)
  const abaAtual = ABAS.find((a) => a.id === aba) ?? ABAS[0]
  const atualizar = (novo: Personagem) => personagens.salvar(novo)
  const fechar = () => setDialogo(null)
  const pvPct = Math.max(0, Math.min(100, (p.estado.pvAtual / f.pvMaximo) * 100))
  const Aba = abaAtual.componente

  return (
    <>
      <Topo
        voltarPara={caminho.lista()}
        titulo={p.nome}
        acoes={
          <>
            <button type="button" className="botao botao--fantasma" onClick={() => setDialogo('descanso')} aria-label="Descansar">
              <Icone nome="fogueira" />
              Descansar
            </button>
            <button
              type="button"
              className="botao"
              onClick={() => setDialogo('nivel')}
              disabled={p.nivel >= 20}
              aria-label="Subir de nível"
            >
              <Icone nome="seta_cima" />
              <span className="so-largo">Subir de nível</span>
              <span className="so-estreito" aria-hidden="true">Nível</span>
            </button>
          </>
        }
      />
      <main id="conteudo" tabIndex={-1} className="pagina ficha">
        <header className="ficha__cabeca">
          <p className="rotulo">{resumoPersonagem(p)}</p>
          <h1>{p.nome}</h1>
          {p.conceito && <p className="suave">{p.conceito}</p>}
        </header>

        {f.avisos.map((a) => (
          <p key={a} className="aviso">
            {a}
          </p>
        ))}

        <section className="vitais" aria-label="Valores principais">
          <button type="button" className="vital vital--pv" onClick={() => setDialogo('vida')}>
            <span className="rotulo">Pontos de vida</span>
            <span className="vital__pv numeros">
              <strong>{p.estado.pvAtual}</strong>
              <span className="suave">/{f.pvMaximo}</span>
              {p.estado.pvTemporario > 0 && <span className="vital__temp">+{p.estado.pvTemporario} temp.</span>}
            </span>
            <span className="medidor" aria-hidden="true">
              <span
                style={{ inlineSize: `${pvPct}%` }}
                className={pvPct <= 25 ? 'medidor--perigo' : pvPct <= 50 ? 'medidor--alerta' : ''}
              />
            </span>
            <span className="vital__acao">Dano, cura ou temporários</span>
          </button>

          <div className="vital">
            <span className="rotulo">CA</span>
            <span className="vital__valor numeros">{f.ca.valor}</span>
            <span className="vital__detalhe">{f.ca.descricao}</span>
          </div>
          <button
            type="button"
            className="vital vital--botao"
            onClick={() => rolar(expressaoTeste(f.iniciativa), { rotulo: 'Iniciativa' })}
          >
            <span className="rotulo">Iniciativa</span>
            <span className="vital__valor numeros">{sinal(f.iniciativa)}</span>
            <span className="vital__detalhe">tocar para rolar</span>
          </button>
          <div className="vital">
            <span className="rotulo">Deslocamento</span>
            <span className="vital__valor numeros">{formatarNumero(f.deslocamento)}</span>
            <span className="vital__detalhe">metros</span>
          </div>
          <div className="vital">
            <span className="rotulo">Proficiência</span>
            <span className="vital__valor numeros">{sinal(f.proficiencia)}</span>
            <span className="vital__detalhe">nível {p.nivel}</span>
          </div>
          <div className="vital">
            <span className="rotulo">Dados de vida</span>
            <span className="vital__valor numeros">
              {f.dadosDeVidaRestantes}
              <span className="suave">/{f.dadosDeVidaTotal}</span>
            </span>
            <span className="vital__detalhe">d{f.dadoDeVida}</span>
          </div>
          <button
            type="button"
            className={`vital vital--botao vital--inspiracao ${p.estado.inspiracao ? 'ativa' : ''}`}
            aria-pressed={p.estado.inspiracao}
            onClick={() => atualizar({ ...p, estado: { ...p.estado, inspiracao: !p.estado.inspiracao } })}
          >
            <span className="rotulo">Inspiração</span>
            <Icone nome="estrela" tamanho={28} preenchido={p.estado.inspiracao} />
            <span className="vital__detalhe">{p.estado.inspiracao ? 'tem' : 'não tem'}</span>
          </button>
        </section>

        <nav className="abas" aria-label="Seções da ficha">
          {ABAS.map((a) => (
            <a
              key={a.id}
              href={caminho.ficha(p.id, a.id)}
              aria-current={a.id === abaAtual.id ? 'page' : undefined}
              className="abas__item"
            >
              {a.nome}
            </a>
          ))}
        </nav>

        <div className="ficha__aba">
          <Aba p={p} f={f} atualizar={atualizar} />
        </div>
      </main>

      <DialogoVida aberto={dialogo === 'vida'} aoFechar={fechar} p={p} f={f} atualizar={atualizar} />
      <DialogoDescanso aberto={dialogo === 'descanso'} aoFechar={fechar} p={p} f={f} atualizar={atualizar} />
      <DialogoNivel aberto={dialogo === 'nivel'} aoFechar={fechar} p={p} f={f} atualizar={atualizar} />
    </>
  )
}
