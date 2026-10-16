import { useEffect, useRef } from 'react'
import './Gaveta.css'

// Painel que sobe de baixo no celular e vira janela central no desktop.
// Usa <dialog> nativo: foco preso dentro, Esc fecha e o resto da página fica inerte.
// className permite variações, como o tema claro do carrinho ("gaveta--clara").
function Gaveta({ aberta, titulo, onFechar, children, rodape, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (aberta && !dialogo.open) dialogo.showModal()
    if (!aberta && dialogo.open) dialogo.close()
  }, [aberta])

  useEffect(() => {
    if (!aberta) return undefined
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = anterior }
  }, [aberta])

  return (
    <dialog
      ref={ref}
      className={`gaveta${className ? ` ${className}` : ''}`}
      aria-label={titulo}
      onCancel={(event) => {
        event.preventDefault()
        onFechar()
      }}
      onClick={(event) => {
        // clique no fundo escuro (fora do conteúdo) fecha
        if (event.target === ref.current) onFechar()
      }}
    >
      {aberta && (
        <div className="gaveta__caixa">
          <header className="gaveta__topo">
            <h2>{titulo}</h2>
            <button type="button" className="gaveta__fechar" aria-label="Fechar" onClick={onFechar}>✕</button>
          </header>
          <div className="gaveta__conteudo">{children}</div>
          {rodape && <footer className="gaveta__rodape">{rodape}</footer>}
        </div>
      )}
    </dialog>
  )
}

export default Gaveta
