import { useCallback } from 'react'
import { compartilharRolagemDaFicha, compartilharRolagemNaCampanha } from '../nuvem/campanhas'
import type { Rolagem } from '../rolagem/rolagem'
import { RoladorProvider } from './componentes/Rolador'
import { Topo } from './componentes/Topo'
import { listarPersonagens } from '../armazenamento/personagens'
import { Campanha } from './paginas/campanhas/Campanha'
import { Campanhas } from './paginas/campanhas/Campanhas'
import { Dados } from './paginas/Dados'
import { Contas } from './paginas/Contas'
import { Compendio } from './paginas/Compendio'
import { FichaMesa } from './paginas/campanhas/FichaMesa'
import { Criacao } from './paginas/criacao/Criacao'
import { Ficha } from './paginas/ficha/Ficha'
import { Lista } from './paginas/Lista'
import { caminho, useRota } from './rotas'

export function App() {
  const rota = useRota()
  const rotaId = rota.nome === 'ficha' || rota.nome === 'campanha' ? rota.id : null
  // Rolagens na ficha vinculada vão para a mesa; na tela da campanha, o mestre rola para todos.
  const aoRolar = useCallback(
    (r: Rolagem) => {
      if (!rotaId) return
      const lista = listarPersonagens()
      if (rota.nome === 'campanha') compartilharRolagemNaCampanha(rotaId, r, (id) => lista.find((p) => p.id === id)?.nome)
      else {
        const p = lista.find((x) => x.id === rotaId)
        if (p) compartilharRolagemDaFicha(p, r)
      }
    },
    [rota.nome, rotaId],
  )
  return (
    <RoladorProvider mostrarBarra={rota.nome === 'ficha' || rota.nome === 'campanha' || rota.nome === 'ficha-mesa'} aoRolar={aoRolar}>
      <a className="pular" href="#conteudo" onClick={(e) => {
        e.preventDefault()
        document.getElementById('conteudo')?.focus()
      }}>
        Pular para o conteúdo
      </a>
      {rota.nome === 'lista' && <Lista />}
      {rota.nome === 'criacao' && <Criacao />}
      {rota.nome === 'ficha' && <Ficha id={rota.id} />}
      {rota.nome === 'campanhas' && <Campanhas />}
      {rota.nome === 'dados' && <Dados />}
      {rota.nome === 'contas' && <Contas />}
      {rota.nome === 'compendio' && <Compendio />}
      {rota.nome === 'campanha' && <Campanha id={rota.id} />}
      {rota.nome === 'ficha-mesa' && <FichaMesa campanhaId={rota.campanhaId} personagemId={rota.personagemId} />}
      {rota.nome === 'nao-encontrada' && (
        <>
          <Topo />
          <main id="conteudo" tabIndex={-1} className="pagina vazio">
            <h1>Página não encontrada</h1>
            <a className="botao" href={caminho.lista()}>
              Ver personagens
            </a>
          </main>
        </>
      )}
    </RoladorProvider>
  )
}
