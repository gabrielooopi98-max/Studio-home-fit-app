import { useState } from 'react'
import { createPortal } from 'react-dom'
import Gaveta from '../Gaveta.jsx'
import { criarPedido } from '../../dados/loja.js'
import { supabase } from '../../dados/supabase.js'
import { definirQuantidade, resumoDoCarrinho } from '../../utils/carrinho.js'
import { formatarPreco } from '../../utils/dinheiro.js'
import { SeletorQuantidade } from './CardProduto.jsx'
import FotoProduto from './FotoProduto.jsx'

const PROBLEMAS = {
  indisponivel: 'Indisponível no momento. Remova para continuar.',
  estoque: 'Quantidade maior que o estoque.',
}

// "aberto" vem de fora: o carrinho abre pela barra flutuante ou pelo ícone do cabeçalho da loja.
function Carrinho({ itens, produtos, onItens, onPedidoFeito, onVerPedidos, aberto, onAberto, mostrarBarra = true }) {
  const setAberto = onAberto
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [pedidoFeito, setPedidoFeito] = useState(null)
  const [confirmandoEsvaziar, setConfirmandoEsvaziar] = useState(false)
  const resumo = resumoDoCarrinho(itens, produtos)

  function esvaziar() {
    if (!confirmandoEsvaziar) return setConfirmandoEsvaziar(true)
    setConfirmandoEsvaziar(false)
    setErro('')
    onItens([])
  }

  function fechar() {
    setAberto(false)
    setErro('')
    setPedidoFeito(null)
  }

  async function reservar() {
    if (enviando || resumo.temProblema || !itens.length) return
    setEnviando(true)
    setErro('')
    try {
      const pedido = await criarPedido(supabase, itens, observacao)
      setPedidoFeito(pedido)
      onItens([])
      setObservacao('')
      onPedidoFeito()
    } catch (falha) {
      setErro(falha.message)
      // Estoque pode ter mudado enquanto o aluno escolhia: atualiza a vitrine.
      onPedidoFeito()
    } finally {
      setEnviando(false)
    }
  }

  const rodape = pedidoFeito ? (
    <div className="carrinho__botoes">
      <button type="button" className="botao-secundario" onClick={fechar}>Continuar comprando</button>
      <button type="button" className="botao-primario" onClick={() => { fechar(); onVerPedidos() }}>Ver meus pedidos</button>
    </div>
  ) : itens.length > 0 && (
    <>
      <div className="carrinho__total">
        <span>Total</span>
        <strong>{formatarPreco(resumo.total)}</strong>
      </div>
      <button
        type="button"
        className="botao-primario botao-primario--largo"
        disabled={enviando || resumo.temProblema}
        onClick={reservar}
      >
        {enviando ? <span className="spinner" aria-label="Reservando" /> : 'Reservar pedido'}
      </button>
    </>
  )

  return (
    <>
      {/* Portal: a animação de troca de aba cria um contexto que prenderia o position: fixed. */}
      {mostrarBarra && itens.length > 0 && !aberto && createPortal(
        <button type="button" className="carrinho-barra" onClick={() => setAberto(true)}>
          <span className="carrinho-barra__icone" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="20" r="1.4" fill="currentColor" />
              <circle cx="17" cy="20" r="1.4" fill="currentColor" />
            </svg>
            <b>{resumo.quantidadeTotal}</b>
          </span>
          <span className="carrinho-barra__texto">
            <small>{resumo.quantidadeTotal === 1 ? '1 item' : `${resumo.quantidadeTotal} itens`}</small>
            <strong>{formatarPreco(resumo.total)}</strong>
          </span>
          <span className="carrinho-barra__ver">Ver carrinho →</span>
        </button>,
        document.body,
      )}

      <Gaveta aberta={aberto} titulo={pedidoFeito ? 'Pedido reservado' : 'Seu carrinho'} onFechar={fechar} rodape={rodape}
        className="gaveta--clara">
        {pedidoFeito ? (
          <div className="pedido-feito" role="status">
            <span className="pedido-feito__icone" aria-hidden="true">✓</span>
            <h3>Pedido #{pedidoFeito.numero}</h3>
            <p>Recebemos sua reserva de <b>{formatarPreco(pedidoFeito.total_centavos)}</b>.</p>
            <ol className="pedido-feito__passos">
              <li>A academia separa seus produtos.</li>
              <li>Você recebe o status “Pronto para retirar” em Meus pedidos.</li>
              <li>Retire na recepção e pague no balcão (Pix, cartão ou dinheiro).</li>
            </ol>
          </div>
        ) : itens.length === 0 ? (
          <p className="carrinho__vazio">Seu carrinho está vazio.</p>
        ) : (
          <>
            <div className="carrinho__cabecalho">
              <span>{resumo.quantidadeTotal === 1 ? '1 item' : `${resumo.quantidadeTotal} itens`}</span>
              <button
                type="button"
                className={`botao-texto carrinho__esvaziar${confirmandoEsvaziar ? ' confirmando' : ''}`}
                onClick={esvaziar}
                onBlur={() => setConfirmandoEsvaziar(false)}
              >
                {confirmandoEsvaziar ? 'Tocar de novo para esvaziar' : 'Esvaziar carrinho'}
              </button>
            </div>

            <ul className="carrinho__lista">
              {resumo.linhas.map(({ produtoId, produto, quantidade, subtotal, problema }) => (
                <li key={produtoId} className={problema ? 'com-problema' : ''}>
                  {produto ? <FotoProduto produto={produto} className="carrinho__foto" /> : <span className="foto-produto foto-produto--vazia carrinho__foto" />}
                  <div className="carrinho__item">
                    <div className="carrinho__titulo">
                      <strong>{produto?.nome ?? 'Produto removido'}</strong>
                      <button
                        type="button"
                        className="carrinho__tirar"
                        aria-label={`Remover ${produto?.nome ?? 'produto'} do carrinho`}
                        title="Remover do carrinho"
                        onClick={() => onItens(definirQuantidade(itens, produtoId, 0))}
                      >
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                    {problema
                      ? <small className="carrinho__problema">{PROBLEMAS[problema]}</small>
                      : <small>{formatarPreco(produto.preco_centavos)} cada</small>}
                    <div className="carrinho__linha">
                      {produto && produto.estoque > 0 ? (
                        <SeletorQuantidade
                          produto={produto}
                          quantidade={quantidade}
                          podeZerar={false}
                          onQuantidade={(nova) => onItens(definirQuantidade(itens, produtoId, Math.min(nova, produto.estoque)))}
                        />
                      ) : (
                        <span className="carrinho__indisponivel">Indisponível</span>
                      )}
                      {!problema && <b>{formatarPreco(subtotal)}</b>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <label className="carrinho__observacao">
              <span>Observação para a recepção (opcional)</span>
              <textarea
                rows={2}
                maxLength={300}
                placeholder="Ex.: sabor baunilha, se tiver"
                value={observacao}
                onChange={(event) => setObservacao(event.target.value)}
              />
            </label>

            <div className="carrinho__info">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 10l9-6 9 6v10H3zM9 20v-6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
              <p><b>Retirada na academia.</b> Pague no balcão na hora de retirar: Pix, cartão ou dinheiro.</p>
            </div>

            {erro && <p className="loja__erro" role="alert">{erro}</p>}
          </>
        )}
      </Gaveta>
    </>
  )
}

export default Carrinho
