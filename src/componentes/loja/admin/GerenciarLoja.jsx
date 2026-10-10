import { useEffect, useState } from 'react'
import { CATEGORIAS, atualizarStatusPedido, cancelarPedido, listarPedidosDaLoja } from '../../../dados/loja.js'
import { supabase } from '../../../dados/supabase.js'
import { formatarPreco } from '../../../utils/dinheiro.js'
import { formatarTelefone } from '../../../utils/telefone.js'
import CartaoPedido from '../CartaoPedido.jsx'
import FotoProduto from '../FotoProduto.jsx'
import FormProduto from './FormProduto.jsx'
import { EsqueletoListaProdutos, EsqueletoPedidos } from '../../Esqueletos.jsx'

function linkWhatsApp(telefone, texto) {
  return `https://wa.me/55${telefone}?text=${encodeURIComponent(texto)}`
}

function PedidosDaLoja({ onProdutosMudaram }) {
  const [abertos, setAbertos] = useState(true)
  const [estado, setEstado] = useState({ carregando: true, erro: '', pedidos: [] })
  const [tentativa, setTentativa] = useState(0)
  const [ocupado, setOcupado] = useState(null)
  const [confirmando, setConfirmando] = useState(null)
  const [erroAcao, setErroAcao] = useState('')

  useEffect(() => {
    let ativo = true
    async function carregar() {
      try {
        const pedidos = await listarPedidosDaLoja(supabase, { abertos })
        if (ativo) setEstado({ carregando: false, erro: '', pedidos })
      } catch (erro) {
        if (ativo) setEstado((anterior) => ({ ...anterior, carregando: false, erro: erro.message }))
      }
    }
    carregar()
    return () => { ativo = false }
  }, [abertos, tentativa])

  async function executar(pedido, acao) {
    setOcupado(pedido.id)
    setErroAcao('')
    try {
      await acao()
    } catch (erro) {
      setErroAcao(`Pedido #${pedido.numero}: ${erro.message}`)
    } finally {
      setOcupado(null)
      setConfirmando(null)
      setTentativa((valor) => valor + 1)
      // cancelar devolve itens ao estoque
      onProdutosMudaram()
    }
  }

  function cancelar(pedido) {
    if (confirmando !== pedido.id) return setConfirmando(pedido.id)
    return executar(pedido, () => cancelarPedido(supabase, pedido.id))
  }

  const recebidos = estado.pedidos.filter(({ status }) => status === 'recebido').length

  return (
    <section aria-label="Pedidos da loja">
      <div className="loja__secao-topo">
        <div className="filtro-duplo" role="group" aria-label="Filtrar pedidos">
          <button type="button" aria-pressed={abertos} onClick={() => setAbertos(true)}>Em aberto</button>
          <button type="button" aria-pressed={!abertos} onClick={() => setAbertos(false)}>Finalizados</button>
        </div>
        <button type="button" className="botao-texto" onClick={() => setTentativa((valor) => valor + 1)} disabled={estado.carregando}>
          Atualizar
        </button>
      </div>

      {abertos && recebidos > 0 && (
        <p className="gerenciar__alerta">{recebidos} {recebidos === 1 ? 'pedido novo para separar' : 'pedidos novos para separar'}</p>
      )}
      {erroAcao && <p className="loja__erro" role="alert">{erroAcao}</p>}
      {estado.carregando && estado.pedidos.length === 0 && <EsqueletoPedidos comCliente />}
      {!estado.carregando && estado.erro && <p className="loja__erro" role="alert">{estado.erro}</p>}
      {!estado.carregando && !estado.erro && estado.pedidos.length === 0 && (
        <div className="loja__aviso"><p>{abertos ? 'Nenhum pedido em aberto. 🎉' : 'Nenhum pedido finalizado ainda.'}</p></div>
      )}

      <div className="loja__pedidos">
        {estado.pedidos.map((pedido) => {
          const { nome, telefone } = pedido.perfis ?? {}
          const primeiroNome = (nome || 'Aluno').split(' ')[0]
          return (
            <CartaoPedido
              key={pedido.id}
              pedido={pedido}
              cliente={(
                <div className="cartao-pedido__cliente">
                  <span>{nome || 'Aluno sem nome'}</span>
                  {telefone && (
                    <a
                      href={linkWhatsApp(telefone, pedido.status === 'separado'
                        ? `Oi, ${primeiroNome}! Seu pedido #${pedido.numero} da Home Fit está pronto para retirar na recepção. 💪`
                        : `Oi, ${primeiroNome}! Sobre seu pedido #${pedido.numero} na loja da Home Fit:`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp {formatarTelefone(telefone)}
                    </a>
                  )}
                </div>
              )}
            >
              {(pedido.status === 'recebido' || pedido.status === 'separado') && (
                <div className="cartao-pedido__acoes">
                  <button
                    type="button"
                    className={`botao-perigo${confirmando === pedido.id ? ' confirmando' : ''}`}
                    disabled={ocupado === pedido.id}
                    onClick={() => cancelar(pedido)}
                  >
                    {confirmando === pedido.id ? 'Confirmar' : 'Cancelar'}
                  </button>
                  {pedido.status === 'separado' && (
                    <button type="button" className="botao-secundario" disabled={ocupado === pedido.id}
                      onClick={() => executar(pedido, () => atualizarStatusPedido(supabase, pedido.id, 'recebido'))}>
                      Voltar
                    </button>
                  )}
                  <button
                    type="button"
                    className="botao-primario"
                    disabled={ocupado === pedido.id}
                    onClick={() => executar(pedido, () =>
                      atualizarStatusPedido(supabase, pedido.id, pedido.status === 'recebido' ? 'separado' : 'retirado'))}
                  >
                    {pedido.status === 'recebido' ? 'Marcar separado' : 'Marcar retirado'}
                  </button>
                </div>
              )}
            </CartaoPedido>
          )
        })}
      </div>
    </section>
  )
}

function ProdutosDaLoja({ produtos, carregando, onProdutosMudaram }) {
  const [editando, setEditando] = useState(null)
  const nomeCategoria = (id) => CATEGORIAS.find((categoria) => categoria.id === id)?.nome ?? 'Outros'

  return (
    <section aria-label="Produtos cadastrados">
      <div className="loja__secao-topo">
        <p>
          {carregando && !produtos.length
            ? 'Carregando produtos…'
            : `${produtos.length} ${produtos.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}`}
        </p>
        <button type="button" className="botao-primario" onClick={() => setEditando('novo')}>+ Novo produto</button>
      </div>

      {carregando && produtos.length === 0 && <EsqueletoListaProdutos />}
      <ul className="gerenciar__produtos">
        {produtos.map((produto) => (
          <li key={produto.id}>
            <button type="button" onClick={() => setEditando(produto)} className={produto.ativo ? '' : 'inativo'}>
              <FotoProduto produto={produto} className="gerenciar__foto" />
              <span className="gerenciar__info">
                <strong>{produto.nome}</strong>
                <small>{nomeCategoria(produto.categoria)}{produto.marca && ` · ${produto.marca}`}</small>
              </span>
              <span className="gerenciar__numeros">
                <b>{formatarPreco(produto.preco_centavos)}</b>
                <small className={produto.estoque === 0 ? 'zerado' : produto.estoque <= 3 ? 'baixo' : ''}>
                  {produto.ativo ? `${produto.estoque} em estoque` : 'Fora da vitrine'}
                </small>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <FormProduto
        key={editando === 'novo' ? 'novo' : editando?.id ?? 'fechado'}
        produto={editando === 'novo' ? null : editando}
        aberto={Boolean(editando)}
        onFechar={() => setEditando(null)}
        onSalvo={() => {
          setEditando(null)
          onProdutosMudaram()
        }}
      />
    </section>
  )
}

function GerenciarLoja({ produtos, carregandoProdutos, onProdutosMudaram }) {
  const [secao, setSecao] = useState('pedidos')
  return (
    <div className="gerenciar">
      <div className="filtro-duplo filtro-duplo--largo" role="group" aria-label="Gerenciar">
        <button type="button" aria-pressed={secao === 'pedidos'} onClick={() => setSecao('pedidos')}>Pedidos</button>
        <button type="button" aria-pressed={secao === 'produtos'} onClick={() => setSecao('produtos')}>Produtos e estoque</button>
      </div>
      {secao === 'pedidos'
        ? <PedidosDaLoja onProdutosMudaram={onProdutosMudaram} />
        : <ProdutosDaLoja produtos={produtos} carregando={carregandoProdutos} onProdutosMudaram={onProdutosMudaram} />}
    </div>
  )
}

export default GerenciarLoja
