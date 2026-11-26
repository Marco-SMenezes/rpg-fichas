import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/alegreya/latin-600.css'
import '@fontsource/alegreya/latin-700.css'
import '@fontsource/alegreya-sans/latin-400.css'
import '@fontsource/alegreya-sans/latin-400-italic.css'
import '@fontsource/alegreya-sans/latin-700.css'
import './estilos/tokens.css'
import './estilos/base.css'
import './estilos/componentes.css'
import './estilos/rolador.css'
import './estilos/paginas.css'
import { App } from './App'
import { iniciarTema } from './componentes/Tema'
import { depoisDeSincronizar, iniciarNuvem } from '../nuvem/nuvem'
// Registra modelos e fichas personalizadas na sincronização antes do primeiro envio.
import { listarFichasLivres, listarModelos, livres } from '../universal/armazenamento'
import '../bestiario/meus'
import { listarPersonagens } from '../armazenamento/personagens'
import { aplicarAjustesPendentes, configurarPonte } from '../combate/ponte'
import { personagens } from './estado'

// Combate: a ficha conversa com a mesa (vida e ajustes do mestre).
configurarPonte({
  listarPersonagens,
  salvarPersonagem: (p) => personagens.salvar(p),
  listarFichasLivres,
  salvarFichaLivre: (f) => livres.salvarFicha(f),
  listarModelos,
})
depoisDeSincronizar(() => void aplicarAjustesPendentes())

iniciarTema()
void iniciarNuvem()

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
