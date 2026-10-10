import { MAXIMO_POR_ITEM } from '../../utils/carrinho.js'
import { formatarPreco } from '../../utils/dinheiro.js'
import { descontoPercentual } from '../../utils/vitrine.js'
import FotoProduto from './FotoProduto.jsx'

export function PrecoProduto({ produto, grande = false }) {
  const antigo = produto.preco_antigo_centavos
  const economia = antigo ? antigo - produto.preco_centavos : 0
  return (
    <span className={`preco-produto${grande ? ' preco-produto--grande' : ''}`}>
      {antigo ? <s aria-label={`De ${formatarPreco(antigo)}`}>{formatarPreco(antigo)}</s> : <span className="preco-produto__espaco" aria-hidden="true" />}
      <strong>{formatarPreco(produto.preco_centavos)}</strong>
      {economia > 0 && <small className="preco-produto__economia">Economize {formatarPreco(economia)}</small>}
    </span>
  )
}

// podeZerar: no card, o "−" vira lixeira em 1; no carrinho há botão próprio de remover.
export function SeletorQuantidade({ produto, quantidade, onQuantidade, podeZerar = true }) {
  const maximo = Math.min(MAXIMO_POR_ITEM, produto.estoque)
  const lixeira = podeZerar && quantidade === 1
  return (
    <span className="seletor-quantidade" role="group" aria-label={`Quantidade de ${produto.nome}`}>
      <button
        type="button"
        aria-label={lixeira ? 'Remover do carrinho' : 'Diminuir'}
        disabled={!podeZerar && quantidade <= 1}
        onClick={() => onQuantidade(quantidade - 1)}
      >
        {lixeira ? (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : '−'}
      </button>
      <output aria-live="polite">{quantidade}</output>
      <button type="button" aria-label="Aumentar" disabled={quantidade >= maximo} onClick={() => onQuantidade(quantidade + 1)}>+</button>
    </span>
  )
}

function CardProduto({ produto, quantidade, onAbrir, onAdicionar, onQuantidade }) {
  const esgotado = produto.estoque === 0
  const desconto = descontoPercentual(produto)

  return (
    <article className={`card-produto${esgotado ? ' card-produto--esgotado' : ''}${quantidade ? ' card-produto--no-carrinho' : ''}`}>
      <button type="button" className="card-produto__abrir" onClick={onAbrir} aria-label={`Ver detalhes de ${produto.nome}`}>
        <span className="card-produto__vitrine">
          <FotoProduto produto={produto} />
          <span className="card-produto__selos">
            {desconto > 0 && <span className="selo selo--promo">-{desconto}%</span>}
            {produto.destaque && <span className="selo">Destaque</span>}
          </span>
          {esgotado && <span className="card-produto__faixa">Esgotado</span>}
          <span className="card-produto__ver" aria-hidden="true">Ver detalhes</span>
        </span>
        <span className="card-produto__info">
          <small>{produto.marca || 'Home Fit'}</small>
          <strong>{produto.nome}</strong>
        </span>
      </button>

      <div className="card-produto__rodape">
        <PrecoProduto produto={produto} />
        <span className={`card-produto__estoque${!esgotado && produto.estoque <= 3 ? ' poucas' : ''}`}>
          {esgotado ? 'Sem estoque no momento' : produto.estoque <= 3 ? `Últimas ${produto.estoque} unidades` : 'Retire hoje na recepção'}
        </span>
        {esgotado ? (
          <span className="selo-esgotado">Indisponível</span>
        ) : quantidade > 0 ? (
          <SeletorQuantidade produto={produto} quantidade={quantidade} onQuantidade={onQuantidade} />
        ) : (
          <button type="button" className="card-produto__adicionar" onClick={onAdicionar}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 10v4M11 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Adicionar
          </button>
        )}
      </div>
    </article>
  )
}

export default CardProduto
