import { useEffect, useState } from 'react'
import Gaveta from '../Gaveta.jsx'
import { CATEGORIAS, listarProdutos } from '../../dados/loja.js'
import { supabase } from '../../dados/supabase.js'
import { adicionarAoCarrinho, definirQuantidade, quantidadeNoCarrinho, resumoDoCarrinho } from '../../utils/carrinho.js'
import { FILTROS_PADRAO, ORDENS, descontoPercentual, filtrarProdutos } from '../../utils/vitrine.js'
import CabecalhoLoja from './CabecalhoLoja.jsx'
import Carrinho from './Carrinho.jsx'
import CardProduto, { PrecoProduto, SeletorQuantidade } from './CardProduto.jsx'
import FotoProduto from './FotoProduto.jsx'
import MeusPedidos from './MeusPedidos.jsx'
import { EsqueletoProdutos } from '../Esqueletos.jsx'
import { useCarrinho } from './useCarrinho.js'
import './Loja.css'

function PaginaLoja({ usuario, secaoInicial = 'produtos' }) {
  const [aba, setAba] = useState(secaoInicial)
  const [estado, setEstado] = useState({ carregando: true, erro: '', produtos: [] })
  const [tentativa, setTentativa] = useState(0)
  const [filtros, setFiltros] = useState(FILTROS_PADRAO)
  const [aberto, setAberto] = useState(null)
  const [carrinho, setCarrinho] = useCarrinho(usuario.id)
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      try {
        const produtos = await listarProdutos(supabase)
        if (ativo) setEstado({ carregando: false, erro: '', produtos })
      } catch (erro) {
        if (ativo) setEstado((anterior) => ({ ...anterior, carregando: false, erro: erro.message }))
      }
    }
    carregar()
    return () => { ativo = false }
  }, [tentativa])

  const recarregar = () => setTentativa((valor) => valor + 1)
  // O dono vê também os inativos; a vitrine mostra só o que está à venda.
  const aVenda = estado.produtos.filter((produto) => produto.ativo)
  const visiveis = filtrarProdutos(estado.produtos, filtros)
  const emPromocao = aVenda.filter((produto) => descontoPercentual(produto) > 0).length
  const categoriasComProduto = CATEGORIAS
    .map((categoria) => ({ ...categoria, total: aVenda.filter((produto) => produto.categoria === categoria.id).length }))
    .filter(({ total }) => total > 0)
  const produtoAberto = aberto && estado.produtos.find(({ id }) => id === aberto)
  const resumoCarrinho = resumoDoCarrinho(carrinho, estado.produtos)
  // Título da vitrine, como "Mais vendidos" nas lojas: muda com a categoria escolhida.
  const tituloVitrine = filtros.busca.trim()
    ? `Resultados para “${filtros.busca.trim()}”`
    : filtros.soPromocao
      ? 'Ofertas'
      : CATEGORIAS.find(({ id }) => id === filtros.categoria)?.nome ?? 'Todos os produtos'

  function mudarFiltro(mudanca) {
    setFiltros((atuais) => ({ ...atuais, ...mudanca }))
  }

  function limparFiltros() {
    setFiltros(FILTROS_PADRAO)
  }

  function escolherCategoria(id) {
    setAba('produtos')
    if (id === 'ofertas') mudarFiltro({ categoria: 'todas', soPromocao: true })
    else mudarFiltro({ categoria: id, soPromocao: false })
  }

  function buscar(texto) {
    setAba('produtos')
    mudarFiltro({ busca: texto })
  }

  function adicionar(produto) {
    setCarrinho((itens) => adicionarAoCarrinho(itens, produto))
  }

  function mudarQuantidade(produto, quantidade) {
    setCarrinho((itens) => definirQuantidade(itens, produto.id, Math.min(quantidade, produto.estoque)))
  }

  return (
    <>
      <CabecalhoLoja
        aba={aba}
        filtros={filtros}
        categorias={categoriasComProduto}
        emPromocao={emPromocao}
        quantidadeNoCarrinho={resumoCarrinho.quantidadeTotal}
        totalDoCarrinho={resumoCarrinho.total}
        onAba={setAba}
        onBusca={buscar}
        onCategoria={escolherCategoria}
        onAbrirCarrinho={() => setCarrinhoAberto(true)}
      />

      <div className="loja">
        {aba === 'produtos' && (
          <section aria-label="Produtos">
            {!estado.carregando && aVenda.length > 0 && (
              <div className="loja__resultado">
                <div className="loja__titulo">
                  <h1>{tituloVitrine}</h1>
                  <span aria-live="polite">{visiveis.length} {visiveis.length === 1 ? 'produto' : 'produtos'}</span>
                </div>
                <label className="loja__ordem">
                  <span>Ordenar por</span>
                  <select value={filtros.ordem} onChange={(event) => mudarFiltro({ ordem: event.target.value })}>
                    {ORDENS.map(({ id, nome }) => <option key={id} value={id}>{nome}</option>)}
                  </select>
                </label>
              </div>
            )}

            {estado.carregando && (
              <EsqueletoProdutos />
            )}

            {!estado.carregando && estado.erro && (
              <div className="loja__aviso" role="alert">
                <p>{estado.erro}</p>
                <button type="button" onClick={recarregar}>Tentar novamente</button>
              </div>
            )}

            {!estado.carregando && !estado.erro && aVenda.length === 0 && (
              <div className="loja__aviso">
                <strong>A vitrine ainda está vazia</strong>
                <p>Em breve teremos suplementos por aqui.</p>
              </div>
            )}

            {!estado.carregando && aVenda.length > 0 && visiveis.length === 0 && (
              <div className="loja__aviso">
                <strong>Nenhum produto encontrado</strong>
                <p>Tente outra busca ou remova alguns filtros.</p>
                <button type="button" onClick={limparFiltros}>Limpar filtros</button>
              </div>
            )}

            {visiveis.length > 0 && (
              <ul className="loja__grade surgir">
                {visiveis.map((produto) => (
                  <li key={produto.id}>
                    <CardProduto
                      produto={produto}
                      quantidade={quantidadeNoCarrinho(carrinho, produto.id)}
                      onAbrir={() => setAberto(produto.id)}
                      onAdicionar={() => adicionar(produto)}
                      onQuantidade={(quantidade) => mudarQuantidade(produto, quantidade)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {aba === 'pedidos' && (
          <section aria-label="Meus pedidos">
            <div className="loja__titulo">
              <h1>Meus pedidos</h1>
            </div>
            <MeusPedidos usuarioId={usuario.id} onVerProdutos={() => setAba('produtos')} />
          </section>
        )}
      </div>

      <Carrinho
        itens={carrinho}
        produtos={estado.produtos}
        onItens={setCarrinho}
        onPedidoFeito={recarregar}
        onVerPedidos={() => setAba('pedidos')}
        aberto={carrinhoAberto}
        onAberto={setCarrinhoAberto}
        mostrarBarra={aba === 'produtos'}
      />

      <Gaveta aberta={Boolean(produtoAberto)} titulo={produtoAberto?.nome ?? ''} onFechar={() => setAberto(null)} className="gaveta--clara"
        rodape={produtoAberto && (
          <div className="detalhe-produto__acao">
            <PrecoProduto produto={produtoAberto} grande />
            {produtoAberto.estoque === 0 ? (
              <span className="selo-esgotado">Esgotado</span>
            ) : quantidadeNoCarrinho(carrinho, produtoAberto.id) > 0 ? (
              <SeletorQuantidade
                produto={produtoAberto}
                quantidade={quantidadeNoCarrinho(carrinho, produtoAberto.id)}
                onQuantidade={(quantidade) => mudarQuantidade(produtoAberto, quantidade)}
              />
            ) : (
              <button type="button" className="botao-primario" onClick={() => adicionar(produtoAberto)}>
                Adicionar ao carrinho
              </button>
            )}
          </div>
        )}
      >
        {produtoAberto && (
          <div className="detalhe-produto">
            <FotoProduto produto={produtoAberto} className="detalhe-produto__foto" />
            {produtoAberto.marca && <span className="detalhe-produto__marca">{produtoAberto.marca}</span>}
            <p className="detalhe-produto__descricao">
              {produtoAberto.descricao || 'Fale com a recepção para mais detalhes sobre este produto.'}
            </p>
            <p className="detalhe-produto__estoque">
              {produtoAberto.estoque === 0
                ? 'Sem estoque no momento.'
                : produtoAberto.estoque <= 3
                  ? `Últimas ${produtoAberto.estoque} unidades.`
                  : 'Em estoque na academia.'}
            </p>
          </div>
        )}
      </Gaveta>
    </>
  )
}

export default PaginaLoja
