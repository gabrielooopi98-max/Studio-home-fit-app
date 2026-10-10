import { useEffect, useState } from 'react'
import { STATUS_PEDIDO, cancelarPedido, listarMeusPedidos } from '../../dados/loja.js'
import { supabase } from '../../dados/supabase.js'
import CartaoPedido from './CartaoPedido.jsx'
import { EsqueletoPedidos } from '../Esqueletos.jsx'

function MeusPedidos({ usuarioId }) {
  const [estado, setEstado] = useState({ carregando: true, erro: '', pedidos: [] })
  const [tentativa, setTentativa] = useState(0)
  const [confirmando, setConfirmando] = useState(null)
  const [ocupado, setOcupado] = useState(null)
  const [erroAcao, setErroAcao] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    let ativo = true
    async function carregar() {
      try {
        const pedidos = await listarMeusPedidos(supabase, usuarioId)
        if (ativo) setEstado({ carregando: false, erro: '', pedidos })
      } catch (erro) {
        if (ativo) setEstado((anterior) => ({ ...anterior, carregando: false, erro: erro.message }))
      }
    }
    carregar()
    return () => { ativo = false }
  }, [usuarioId, tentativa])

  async function cancelar(pedido) {
    if (confirmando !== pedido.id) {
      setConfirmando(pedido.id)
      return
    }
    setOcupado(pedido.id)
    setErroAcao('')
    setAviso('')
    try {
      await cancelarPedido(supabase, pedido.id)
      // Cancelado some da lista na hora, sem esperar recarregar.
      setEstado((anterior) => ({ ...anterior, pedidos: anterior.pedidos.filter(({ id }) => id !== pedido.id) }))
      setAviso(`Pedido #${pedido.numero} cancelado. Os produtos voltaram para o estoque.`)
    } catch (erro) {
      setErroAcao(erro.message)
    } finally {
      setOcupado(null)
      setConfirmando(null)
      setTentativa((valor) => valor + 1)
    }
  }

  // Pedidos cancelados não aparecem para o aluno.
  const pedidos = estado.pedidos.filter(({ status }) => status !== 'cancelado')
  const abertos = pedidos.filter(({ status }) => status === 'recebido' || status === 'separado')

  return (
    <section className="meus-pedidos" aria-label="Meus pedidos">
      <div className="loja__secao-topo">
        <p>
          {abertos.length
            ? `${abertos.length} ${abertos.length === 1 ? 'pedido em andamento' : 'pedidos em andamento'}`
            : 'Acompanhe aqui suas reservas.'}
        </p>
        <button type="button" className="botao-texto" onClick={() => setTentativa((valor) => valor + 1)} disabled={estado.carregando}>
          Atualizar
        </button>
      </div>

      {erroAcao && <p className="loja__erro" role="alert">{erroAcao}</p>}
      {aviso && (
        <p className="loja__sucesso" role="status">
          {aviso}
          <button type="button" aria-label="Fechar aviso" onClick={() => setAviso('')}>✕</button>
        </p>
      )}

      {estado.carregando && pedidos.length === 0 && <EsqueletoPedidos />}

      {!estado.carregando && estado.erro && (
        <div className="loja__aviso" role="alert">
          <p>{estado.erro}</p>
          <button type="button" onClick={() => setTentativa((valor) => valor + 1)}>Tentar novamente</button>
        </div>
      )}

      {!estado.carregando && !estado.erro && pedidos.length === 0 && (
        <div className="loja__aviso">
          <strong>Nenhum pedido ainda</strong>
          <p>Escolha seus suplementos na aba Produtos e reserve para retirar na academia.</p>
        </div>
      )}

      <div className="loja__pedidos">
        {pedidos.map((pedido) => (
          <CartaoPedido key={pedido.id} pedido={pedido}>
            {pedido.status === 'recebido' ? (
              <button
                type="button"
                className={`botao-perigo${confirmando === pedido.id ? ' confirmando' : ''}`}
                disabled={ocupado === pedido.id}
                onClick={() => cancelar(pedido)}
                onBlur={() => setConfirmando((atual) => (atual === pedido.id ? null : atual))}
              >
                {confirmando === pedido.id ? 'Confirmar cancelamento' : 'Cancelar pedido'}
              </button>
            ) : (
              <small className="cartao-pedido__dica">{STATUS_PEDIDO[pedido.status].texto}</small>
            )}
          </CartaoPedido>
        ))}
      </div>
    </section>
  )
}

export default MeusPedidos
