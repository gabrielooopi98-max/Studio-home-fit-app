import './Esqueleto.css'

// Bloco cinza com uma onda de luz passando: ocupa o lugar do conteúdo enquanto ele carrega.
export function Bloco({ largura = '100%', altura = 12, raio = 8, className = '' }) {
  return (
    <span
      className={`esqueleto ${className}`}
      style={{ width: largura, height: altura, borderRadius: raio }}
      aria-hidden="true"
    />
  )
}

// Moldura de card com o mesmo contorno dos cards reais.
export function CardEsqueleto({ children, className = '' }) {
  return <div className={`esqueleto-card ${className}`} aria-hidden="true">{children}</div>
}

// Anuncia "carregando" para leitores de tela uma vez, em vez de cada bloco.
export function Carregando({ rotulo = 'Carregando', children, className = '' }) {
  return (
    <div className={className} role="status" aria-live="polite" aria-busy="true">
      <span className="visualmente-oculto">{rotulo}…</span>
      {children}
    </div>
  )
}
