import './TelaEstado.css'

// Tela cheia simples: carregando, erro de conexão ou configuração faltando.
function TelaEstado({ carregando = false, titulo, texto, acao, onAcao, children }) {
  return (
    <main className="tela-estado" aria-busy={carregando}>
      <img className="tela-estado__logo" src="/logo-academia/logo-homefit-branca.svg" alt="Home Fit" />
      {carregando ? (
        <span className="tela-estado__barra" role="status" aria-label="Carregando"><i /></span>
      ) : (
        <div className="tela-estado__caixa">
          {titulo && <h1>{titulo}</h1>}
          {texto && <p>{texto}</p>}
          {children}
          {acao && <button type="button" onClick={onAcao}>{acao}</button>}
        </div>
      )}
    </main>
  )
}

export default TelaEstado
