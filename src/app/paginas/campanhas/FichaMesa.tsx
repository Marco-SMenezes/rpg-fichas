import { lerFichaDaMesa } from '../../../nuvem/campanhas'
import { Topo } from '../../componentes/Topo'
import { Icone } from '../../componentes/Icone'
import { useNuvem } from '../../estado'
import { caminho } from '../../rotas'
import { FichaPersonagem } from '../ficha/Ficha'
import { useCarga } from './usarCarga'

/** Ficha de um jogador vista pelo mestre: a mesma ficha, só para leitura. */
export function FichaMesa({ campanhaId, personagemId }: { campanhaId: string; personagemId: string }) {
  const nuvem = useNuvem()
  const { dados: p, erro, carregando, recarregar } = useCarga(
    () => (nuvem.status === 'logado' ? lerFichaDaMesa(personagemId) : Promise.resolve(null)),
    [personagemId, nuvem.status],
  )
  const voltar = caminho.campanha(campanhaId)

  if (p)
    return (
      <FichaPersonagem
        key={p.id + p.atualizadoEm}
        p={p}
        somenteLeitura
        voltarPara={voltar}
        acoesExtras={
          <button type="button" className="botao botao--fantasma" onClick={() => void recarregar()} disabled={carregando}>
            <Icone nome="historico" />
            {carregando ? 'Atualizando…' : 'Atualizar'}
          </button>
        }
      />
    )

  return (
    <>
      <Topo voltarPara={voltar} titulo="Ficha" />
      <main id="conteudo" tabIndex={-1} className="pagina vazio">
        {carregando || nuvem.status === 'iniciando' ? (
          <p className="suave">Carregando…</p>
        ) : (
          <>
            <h1>Ficha indisponível</h1>
            <p className="suave">{erro || 'O jogador pode ter trocado de ficha ou saído da campanha.'}</p>
            <a className="botao" href={voltar}>
              Voltar à campanha
            </a>
          </>
        )}
      </main>
    </>
  )
}
