// Cabeçalho padrão de toda página do painel: caminho, título, descrição e ações.
function CabecalhoPagina({ migalhas = [], titulo, descricao, children }) {
  return (
    <header className="adm-pagina-topo">
      <div className="adm-pagina-topo__texto">
        {migalhas.length > 0 && (
          <nav className="adm-migalhas" aria-label="Você está em">
            <ol>
              {migalhas.map(({ nome, aoClicar }, indice) => (
                <li key={nome}>
                  {aoClicar && indice < migalhas.length - 1
                    ? <button type="button" onClick={aoClicar}>{nome}</button>
                    : <span aria-current={indice === migalhas.length - 1 ? 'page' : undefined}>{nome}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1>{titulo}</h1>
        {descricao && <p>{descricao}</p>}
      </div>
      {children && <div className="adm-pagina-topo__acoes">{children}</div>}
    </header>
  )
}

export default CabecalhoPagina
