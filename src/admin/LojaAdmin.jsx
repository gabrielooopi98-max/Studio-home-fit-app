import { useEffect, useState } from 'react'
import { listarProdutos } from '../dados/loja.js'
import { supabase } from '../dados/supabase.js'
import GerenciarLoja from '../componentes/loja/admin/GerenciarLoja.jsx'
import CabecalhoPagina from './CabecalhoPagina.jsx'
import '../componentes/loja/Loja.css'

// Loja no painel: pedidos (separar / retirar) e produtos com estoque.
function LojaAdmin({ onPedidosMudaram }) {
  const [estado, setEstado] = useState({ carregando: true, produtos: [], erro: '' })
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      try {
        const produtos = await listarProdutos(supabase)
        if (ativo) setEstado({ carregando: false, produtos, erro: '' })
      } catch (erro) {
        if (ativo) setEstado((anterior) => ({ ...anterior, carregando: false, erro: erro.message }))
      }
    }
    carregar()
    return () => { ativo = false }
  }, [versao])

  const semEstoque = estado.produtos.filter(({ ativo, estoque }) => ativo && estoque === 0).length
  const acabando = estado.produtos.filter(({ ativo, estoque }) => ativo && estoque > 0 && estoque <= 3).length

  return (
    <section className="adm-loja" aria-label="Loja">
      <CabecalhoPagina
        migalhas={[{ nome: 'Loja' }]}
        titulo="Loja"
        descricao={estado.carregando ? 'Pedidos, produtos e estoque.' : [
          `${estado.produtos.filter(({ ativo }) => ativo).length} produtos à venda`,
          acabando ? `${acabando} acabando` : '',
          semEstoque ? `${semEstoque} sem estoque` : '',
        ].filter(Boolean).join(' · ')}
      />
      {estado.erro && <p className="adm-erro adm-erro--bloco" role="alert">{estado.erro}</p>}
      <GerenciarLoja
        produtos={estado.produtos}
        carregandoProdutos={estado.carregando}
        onProdutosMudaram={() => {
          setVersao((valor) => valor + 1)
          onPedidosMudaram()
        }}
      />
    </section>
  )
}

export default LojaAdmin
