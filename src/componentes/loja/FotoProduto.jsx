import { useState } from 'react'

const ICONES = {
  proteinas: 'M8 3h8l-1 4h-6zM7 7h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2zM7 12h10',
  creatina: 'M9 3h6v3H9zM7 6h10v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2zM10 11h4M10 15h4',
  'pre-treino': 'M13 2 5 14h6l-1 8 8-12h-6z',
  aminoacidos: 'M7 4h10l-1 16H8zM7 9h10',
  vitaminas: 'M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 10l7 7',
  acessorios: 'M8 3h8v4l-1 1v11a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V8L8 7z',
  outros: 'M4 8l8-5 8 5v8l-8 5-8-5zM4 8l8 5 8-5M12 13v8',
}

// Foto do produto ou, sem foto (ou se falhar), um ícone da categoria.
function FotoProduto({ produto, className = '' }) {
  const [estado, setEstado] = useState('carregando')
  if (produto.imagem_url && estado !== 'erro') {
    return (
      <img
        className={`foto-produto ${className}${estado === 'carregando' ? ' imagem-carregando' : ''}`}
        src={produto.imagem_url}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setEstado('ok')}
        onError={() => setEstado('erro')}
      />
    )
  }
  return (
    <span className={`foto-produto foto-produto--vazia ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d={ICONES[produto.categoria] ?? ICONES.outros} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export default FotoProduto
