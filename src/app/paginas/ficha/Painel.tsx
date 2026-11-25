import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, type CSSProperties } from 'react'
import { alternarOculto, LARGURAS, moverPara, moverUmPasso, mudarLargura, type ItemLayout, type Layout, type Tela } from '../../../layout/layout'
import { Dialogo } from '../../componentes/Dialogo'
import { Icone } from '../../componentes/Icone'
import type { Bloco } from './blocos'
import type { PropsBloco } from './contexto'

const NOME_LARGURA: Record<number, string> = { 2: '⅙', 3: '¼', 4: '⅓', 6: '½', 8: '⅔', 12: 'Inteira' }
const NOME_LARGURA_ESTREITA: Record<number, string> = { 2: '⅓', 3: '½', 6: 'Inteira' }

interface Props extends PropsBloco {
  blocos: Bloco[]
  layout: Layout
  tela: Tela
  editando: boolean
  aoMudarLayout: (l: Layout) => void
}

export function Painel({ blocos, layout, tela, editando, aoMudarLayout, ...propsBloco }: Props) {
  const [ajustando, setAjustando] = useState<string | null>(null)
  const porId = new Map(blocos.map((b) => [b.id, b]))
  const visiveis = layout.filter((x) => !x.oculto)
  const ocultos = layout.filter((x) => x.oculto)
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const aoSoltar = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) aoMudarLayout(moverPara(layout, String(active.id), String(over.id)))
  }

  const blocoAjustado = ajustando ? porId.get(ajustando) : undefined
  const itemAjustado = layout.find((x) => x.id === ajustando)
  const nomes = tela === 'larga' ? NOME_LARGURA : NOME_LARGURA_ESTREITA

  return (
    <>
      <DndContext
        sensors={sensores}
        collisionDetection={closestCenter}
        onDragEnd={aoSoltar}
        accessibility={{
          screenReaderInstructions: {
            draggable: 'Para mover um bloco, aperte espaço, use as setas e aperte espaço de novo para soltar.',
          },
        }}
      >
        <SortableContext items={visiveis.map((x) => x.id)} strategy={rectSortingStrategy}>
          <div className={`painel painel--${tela} ${editando ? 'painel--editando' : ''}`}>
            {visiveis.map((item) => {
              const bloco = porId.get(item.id)
              return bloco ? (
                <BlocoNoPainel key={item.id} bloco={bloco} item={item} editando={editando} aoAjustar={() => setAjustando(item.id)} props={propsBloco} />
              ) : null
            })}
          </div>
        </SortableContext>
      </DndContext>

      {editando && ocultos.length > 0 && (
        <section className="ocultos" aria-labelledby="t-ocultos">
          <h2 id="t-ocultos" className="rotulo">
            Blocos escondidos
          </h2>
          <ul className="ocultos__lista">
            {ocultos.map((x) => (
              <li key={x.id}>
                <button type="button" className="botao" onClick={() => aoMudarLayout(alternarOculto(layout, x.id))}>
                  <Icone nome="olho" />
                  {porId.get(x.id)?.titulo}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Dialogo aberto={!!blocoAjustado} titulo={blocoAjustado?.titulo ?? ''} aoFechar={() => setAjustando(null)}>
        {blocoAjustado && itemAjustado && (
          <>
            <div className="campo">
              <span className="rotulo">Largura</span>
              <div className="segmentos" role="group" aria-label="Largura do bloco">
                {LARGURAS[tela].map((l) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={itemAjustado.largura === l}
                    onClick={() => aoMudarLayout(mudarLargura(layout, itemAjustado.id, l, tela))}
                  >
                    {nomes[l]}
                  </button>
                ))}
              </div>
              <span className="campo__ajuda">
                Fração da largura da tela{tela === 'estreita' ? ' no celular' : ''}. A altura acompanha o conteúdo.
              </span>
            </div>
            <div className="campo">
              <span className="rotulo">Posição</span>
              <div className="acoes acoes--duas">
                <button type="button" className="botao" onClick={() => aoMudarLayout(moverUmPasso(layout, itemAjustado.id, -1))}>
                  <Icone nome="voltar" />
                  Antes
                </button>
                <button type="button" className="botao" onClick={() => aoMudarLayout(moverUmPasso(layout, itemAjustado.id, 1))}>
                  Depois
                  <Icone nome="avancar" />
                </button>
              </div>
            </div>
            <button
              type="button"
              className="botao botao--bloco"
              onClick={() => {
                aoMudarLayout(alternarOculto(layout, itemAjustado.id))
                setAjustando(null)
              }}
            >
              <Icone nome="olho_fechado" />
              Esconder este bloco
            </button>
          </>
        )}
      </Dialogo>
    </>
  )
}

function BlocoNoPainel({
  bloco,
  item,
  editando,
  aoAjustar,
  props,
}: {
  bloco: Bloco
  item: ItemLayout
  editando: boolean
  aoAjustar: () => void
  props: PropsBloco
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !editando,
  })
  const estilo: CSSProperties = {
    gridColumn: `span ${item.largura}`,
    transform: CSS.Translate.toString(transform),
    transition,
  }
  const Conteudo = bloco.componente
  const tituloId = `bloco-${bloco.id}`
  return (
    <section
      ref={setNodeRef}
      style={estilo}
      className={`bloco-ficha ${bloco.compacto ? 'bloco-ficha--compacto' : ''} ${isDragging ? 'bloco-ficha--arrastando' : ''}`}
      aria-labelledby={tituloId}
    >
      <header className="bloco-ficha__cabeca">
        {editando && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            className="bloco-ficha__alca"
            aria-label={`Arrastar ${bloco.titulo}`}
            {...attributes}
            {...listeners}
          >
            <Icone nome="alca" />
          </button>
        )}
        <h2 id={tituloId} className="bloco-ficha__titulo">
          {bloco.titulo}
        </h2>
        {editando && (
          <button type="button" className="bloco-ficha__ajustar" onClick={aoAjustar} aria-label={`Ajustar ${bloco.titulo}`}>
            <Icone nome="ajustes" />
          </button>
        )}
      </header>
      <div className="bloco-ficha__corpo" inert={editando}>
        <Conteudo {...props} />
      </div>
    </section>
  )
}
