import { formatarPreco } from '../../utils/dinheiro.js'

function IconeBusca() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconePedidos() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconeSacola() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 8h14l1 12H4L5 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// Cabeçalho da loja, no estilo das lojas de suplemento: logo, busca,
// pedidos e carrinho, e o menu de categorias logo abaixo.
function CabecalhoLoja({
  aba, filtros, categorias, emPromocao, quantidadeNoCarrinho, totalDoCarrinho,
  onAba, onBusca, onCategoria, onAbrirCarrinho,
}) {
  const naVitrine = aba === 'produtos'
  const ativa = (id) => naVitrine && (id === 'ofertas' ? filtros.soPromocao : !filtros.soPromocao && filtros.categoria === id)

  return (
    <header className="cab-loja">
      <div className="cab-loja__barra">
        <button type="button" className="cab-loja__marca" onClick={() => onCategoria('todas')} aria-label="Loja Home Fit: ver todos os produtos">
          <img src="/logo-academia/logo-homefit-branca.svg" alt="" />
          <span>Loja</span>
        </button>

        <label className="cab-loja__busca">
          <span className="visualmente-oculto">Buscar produto</span>
          <input
            type="search"
            placeholder="O que você está buscando?"
            value={filtros.busca}
            onChange={(event) => onBusca(event.target.value)}
          />
          <IconeBusca />
        </label>

        <div className="cab-loja__acoes">
          <button type="button" className="cab-loja__acao" aria-pressed={aba === 'pedidos'} aria-label="Meus pedidos"
            onClick={() => onAba('pedidos')}>
            <IconePedidos />
            <span>Meus pedidos</span>
          </button>
          <button type="button" className="cab-loja__acao cab-loja__acao--carrinho" onClick={onAbrirCarrinho}
            aria-label={`Carrinho: ${quantidadeNoCarrinho} ${quantidadeNoCarrinho === 1 ? 'item' : 'itens'}`}>
            <span className="cab-loja__sacola">
              <IconeSacola />
              {quantidadeNoCarrinho > 0 && <b>{quantidadeNoCarrinho}</b>}
            </span>
            <span>{quantidadeNoCarrinho > 0 ? formatarPreco(totalDoCarrinho) : 'Carrinho'}</span>
          </button>
        </div>
      </div>

      <nav className="cab-loja__categorias" aria-label="Categorias">
        <button type="button" aria-current={ativa('todas') ? 'page' : undefined} onClick={() => onCategoria('todas')}>
          Todos
        </button>
        {emPromocao > 0 && (
          <button type="button" className="cab-loja__ofertas" aria-current={ativa('ofertas') ? 'page' : undefined} onClick={() => onCategoria('ofertas')}>
            Ofertas
          </button>
        )}
        {categorias.map(({ id, nome }) => (
          <button key={id} type="button" aria-current={ativa(id) ? 'page' : undefined} onClick={() => onCategoria(id)}>
            {nome}
          </button>
        ))}
      </nav>
    </header>
  )
}

export default CabecalhoLoja
