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
import { iniciarNuvem } from '../nuvem/nuvem'

iniciarTema()
void iniciarNuvem()

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
