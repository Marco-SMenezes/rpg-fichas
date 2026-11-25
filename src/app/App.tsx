import { RoladorProvider } from './componentes/Rolador'
import { Topo } from './componentes/Topo'
import { Criacao } from './paginas/criacao/Criacao'
import { Ficha } from './paginas/ficha/Ficha'
import { Lista } from './paginas/Lista'
import { caminho, useRota } from './rotas'

export function App() {
  const rota = useRota()
  return (
    <RoladorProvider mostrarBarra={rota.nome !== 'criacao'}>
      <a className="pular" href="#conteudo" onClick={(e) => {
        e.preventDefault()
        document.getElementById('conteudo')?.focus()
      }}>
        Pular para o conteúdo
      </a>
      {rota.nome === 'lista' && <Lista />}
      {rota.nome === 'criacao' && <Criacao />}
      {rota.nome === 'ficha' && <Ficha id={rota.id} aba={rota.aba} />}
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
