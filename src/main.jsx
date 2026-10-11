import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErroInesperado from './componentes/ErroInesperado.jsx'
// Por último, para os efeitos de hover valerem sobre o estilo base de cada componente.
import './interacoes.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErroInesperado>
      <App />
    </ErroInesperado>
  </StrictMode>,
)
