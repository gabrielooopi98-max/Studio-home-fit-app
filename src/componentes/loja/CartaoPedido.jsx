import { STATUS_PEDIDO } from '../../dados/loja.js'
import { formatarPreco } from '../../utils/dinheiro.js'

const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

// Cartão de um pedido, usado pelo aluno (Meus pedidos) e pelo dono (Gerenciar).
function CartaoPedido({ pedido, cliente, children }) {
  const status = STATUS_PEDIDO[pedido.status]
  return (
    <article className={`cartao-pedido cartao-pedido--${pedido.status}`}>
      <header className="cartao-pedido__topo">
        <div>
          <strong>Pedido #{pedido.numero}</strong>
          <small>{formatoData.format(new Date(pedido.criado_em)).replace('.', '')}</small>
        </div>
        <span className={`status-pedido status-pedido--${pedido.status}`}>{status.nome}</span>
      </header>

      {cliente}

      <ul className="cartao-pedido__itens">
        {pedido.itens_pedido.map((item) => (
          <li key={item.id}>
            <span>{item.quantidade}× {item.nome}</span>
            <b>{formatarPreco(item.preco_centavos * item.quantidade)}</b>
          </li>
        ))}
      </ul>

      {pedido.observacao && <p className="cartao-pedido__obs">“{pedido.observacao}”</p>}

      <footer className="cartao-pedido__rodape">
        <span>Total <b>{formatarPreco(pedido.total_centavos)}</b></span>
        {children}
      </footer>
    </article>
  )
}

export default CartaoPedido
