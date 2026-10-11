import { useEffect, useState } from 'react'
import Header from '../Header.jsx'
import Gaveta from '../Gaveta.jsx'
import { CATEGORIAS, listarProdutos } from '../../dados/loja.js'
import { supabase } from '../../dados/supabase.js'
import { adicionarAoCarrinho, definirQuantidade, quantidadeNoCarrinho } from '../../utils/carrinho.js'
import { FILTROS_PADRAO, ORDENS, descontoPercentual, filtrarProdutos, filtrosAtivos } from '../../utils/vitrine.js'
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
  const [painelFiltros, setPainelFiltros] = useState(false)
  const [aberto, setAberto] = useState(null)
  const [carrinho, setCarrinho] = useCarrinho(usuario.id)

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
  const quantosFiltros = filtrosAtivos(filtros)
  const emPromocao = aVenda.filter((produto) => descontoPercentual(produto) > 0).length
  const categoriasComProduto = CATEGORIAS
    .map((categoria) => ({ ...categoria, total: aVenda.filter((produto) => produto.categoria === categoria.id).length }))
    .filter(({ total }) => total > 0)
  const produtoAberto = aberto && estado.produtos.find(({ id }) => id === aberto)
  const nomeOrdem = ORDENS.find(({ id }) => id === filtros.ordem)?.nome

  // Etiquetas removíveis com o que está filtrando a vitrine agora.
  const etiquetas = [
    filtros.busca.trim() && { chave: 'busca', texto: `“${filtros.busca.trim()}”`, limpar: { busca: '' } },
    filtros.ordem !== 'relevancia' && { chave: 'ordem', texto: nomeOrdem, limpar: { ordem: 'relevancia' } },
    filtros.soPromocao && { chave: 'promo', texto: 'Com desconto', limpar: { soPromocao: false } },
    filtros.esconderEsgotados && { chave: 'esgotados', texto: 'Sem esgotados', limpar: { esconderEsgotados: false } },
  ].filter(Boolean)

  function mudarFiltro(mudanca) {
    setFiltros((atuais) => ({ ...atuais, ...mudanca }))
  }

  function limparFiltros() {
    setFiltros(FILTROS_PADRAO)
  }

  const abas = [
    { id: 'produtos', nome: 'Produtos' },
    { id: 'pedidos', nome: 'Meus pedidos' },
  ]

  function adicionar(produto) {
    setCarrinho((itens) => adicionarAoCarrinho(itens, produto))
  }

  function mudarQuantidade(produto, quantidade) {
    setCarrinho((itens) => definirQuantidade(itens, produto.id, Math.min(quantidade, produto.estoque)))
  }

  return (
    <>
      <Header
        titulo="Suplementos"
        saudacao=""
        contexto="Loja Home Fit"
        descricao="Reserve pelo app, retire na recepção e pague no balcão."
      />

      <div className="loja">
        <div className="loja__abas" role="tablist" aria-label="Seções da loja">
          {abas.map(({ id, nome }) => (
            <button key={id} type="button" role="tab" aria-selected={aba === id} onClick={() => setAba(id)}>
              {nome}
            </button>
          ))}
        </div>

        {aba === 'produtos' && (
          <section aria-label="Produtos">
            <div className="loja__filtros">
              <div className="loja__barra-busca">
                <label className="loja__busca">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="visualmente-oculto">Buscar produto</span>
                  <input
                    type="search"
                    placeholder="Buscar produto"
                    value={filtros.busca}
                    onChange={(event) => mudarFiltro({ busca: event.target.value })}
                  />
                </label>
                <button
                  type="button"
                  className={`loja__botao-filtro${quantosFiltros ? ' ativo' : ''}`}
                  aria-haspopup="dialog"
                  onClick={() => setPainelFiltros(true)}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="16" cy="6" r="2" stroke="currentColor" strokeWidth="2" />
                    <circle cx="10" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
                    <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <span>Filtrar</span>
                  {quantosFiltros > 0 && <b aria-label={`${quantosFiltros} ativos`}>{quantosFiltros}</b>}
                </button>
              </div>

              {categoriasComProduto.length > 0 && (
                <div className="loja__categorias" role="group" aria-label="Categorias">
                  <button type="button" aria-pressed={filtros.categoria === 'todas' && !filtros.soPromocao}
                    onClick={() => mudarFiltro({ categoria: 'todas', soPromocao: false })}>
                    Tudo <small>{aVenda.length}</small>
                  </button>
                  {emPromocao > 0 && (
                    <button type="button" aria-pressed={filtros.soPromocao}
                      onClick={() => mudarFiltro({ soPromocao: !filtros.soPromocao })}>
                      Ofertas <small>{emPromocao}</small>
                    </button>
                  )}
                  {categoriasComProduto.map(({ id, nome, total }) => (
                    <button key={id} type="button" aria-pressed={filtros.categoria === id}
                      onClick={() => mudarFiltro({ categoria: filtros.categoria === id ? 'todas' : id })}>
                      {nome} <small>{total}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!estado.carregando && aVenda.length > 0 && (
              <div className="loja__resultado">
                <span aria-live="polite"><b>{visiveis.length}</b> {visiveis.length === 1 ? 'produto' : 'produtos'}</span>
                <label className="loja__ordem">
                  <span>Ordenar por</span>
                  <select value={filtros.ordem} onChange={(event) => mudarFiltro({ ordem: event.target.value })}>
                    {ORDENS.map(({ id, nome }) => <option key={id} value={id}>{nome}</option>)}
                  </select>
                </label>
              </div>
            )}

            {etiquetas.length > 0 && (
              <div className="loja__etiquetas" aria-label="Filtros aplicados">
                {etiquetas.map(({ chave, texto, limpar }) => (
                  <button key={chave} type="button" onClick={() => mudarFiltro(limpar)} aria-label={`Remover filtro ${texto}`}>
                    {texto} <span aria-hidden="true">✕</span>
                  </button>
                ))}
                <button type="button" className="loja__limpar" onClick={limparFiltros}>Limpar tudo</button>
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

        {aba === 'pedidos' && <MeusPedidos usuarioId={usuario.id} onVerProdutos={() => setAba('produtos')} />}
      </div>

      {aba === 'produtos' && (
        <Carrinho
          itens={carrinho}
          produtos={estado.produtos}
          onItens={setCarrinho}
          onPedidoFeito={recarregar}
          onVerPedidos={() => setAba('pedidos')}
        />
      )}

      <Gaveta
        aberta={painelFiltros}
        titulo="Filtrar e ordenar"
        onFechar={() => setPainelFiltros(false)}
        rodape={(
          <div className="carrinho__botoes">
            <button type="button" className="botao-secundario" onClick={limparFiltros} disabled={!quantosFiltros && filtros.categoria === 'todas'}>
              Limpar
            </button>
            <button type="button" className="botao-primario" onClick={() => setPainelFiltros(false)}>
              Ver {visiveis.length} {visiveis.length === 1 ? 'produto' : 'produtos'}
            </button>
          </div>
        )}
      >
        <div className="painel-filtros">
          <fieldset>
            <legend>Ordenar por</legend>
            <div className="painel-filtros__ordens">
              {ORDENS.map(({ id, nome }) => (
                <label key={id} className={filtros.ordem === id ? 'marcado' : ''}>
                  <input type="radio" name="ordem" value={id} checked={filtros.ordem === id}
                    onChange={() => mudarFiltro({ ordem: id })} />
                  <span>{nome}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Mostrar</legend>
            <label className="interruptor">
              <span>
                <b>Só produtos com desconto</b>
                <small>{emPromocao} {emPromocao === 1 ? 'oferta disponível' : 'ofertas disponíveis'}</small>
              </span>
              <input type="checkbox" role="switch" checked={filtros.soPromocao}
                onChange={(event) => mudarFiltro({ soPromocao: event.target.checked })} />
            </label>
            <label className="interruptor">
              <span>
                <b>Esconder esgotados</b>
                <small>Mostra só o que dá para reservar agora</small>
              </span>
              <input type="checkbox" role="switch" checked={filtros.esconderEsgotados}
                onChange={(event) => mudarFiltro({ esconderEsgotados: event.target.checked })} />
            </label>
          </fieldset>

          {categoriasComProduto.length > 0 && (
            <fieldset>
              <legend>Categoria</legend>
              <div className="loja__categorias loja__categorias--quebra">
                <button type="button" aria-pressed={filtros.categoria === 'todas'} onClick={() => mudarFiltro({ categoria: 'todas' })}>
                  Todas
                </button>
                {categoriasComProduto.map(({ id, nome, total }) => (
                  <button key={id} type="button" aria-pressed={filtros.categoria === id} onClick={() => mudarFiltro({ categoria: id })}>
                    {nome} <small>{total}</small>
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      </Gaveta>

      <Gaveta aberta={Boolean(produtoAberto)} titulo={produtoAberto?.nome ?? ''} onFechar={() => setAberto(null)}
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
