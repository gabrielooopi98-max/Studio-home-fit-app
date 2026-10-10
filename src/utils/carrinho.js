// Carrinho = lista de { produtoId, quantidade }. Preço e estoque vêm sempre do produto
// carregado do servidor; o banco confere tudo de novo ao criar o pedido.

export const MAXIMO_POR_ITEM = 10

export function quantidadeNoCarrinho(itens, produtoId) {
  return itens.find((item) => item.produtoId === produtoId)?.quantidade ?? 0
}

export function definirQuantidade(itens, produtoId, quantidade) {
  const limitada = Math.max(0, Math.min(MAXIMO_POR_ITEM, Math.floor(quantidade)))
  const outros = itens.filter((item) => item.produtoId !== produtoId)
  if (!limitada) return outros
  const existe = itens.some((item) => item.produtoId === produtoId)
  return existe
    ? itens.map((item) => (item.produtoId === produtoId ? { ...item, quantidade: limitada } : item))
    : [...itens, { produtoId, quantidade: limitada }]
}

export function adicionarAoCarrinho(itens, produto, quantidade = 1) {
  const atual = quantidadeNoCarrinho(itens, produto.id)
  const limite = Math.min(MAXIMO_POR_ITEM, produto.estoque)
  return definirQuantidade(itens, produto.id, Math.min(limite, atual + quantidade))
}

// Junta carrinho e catálogo: subtotal de cada linha, total e o que impede a compra.
export function resumoDoCarrinho(itens, produtos) {
  const porId = new Map(produtos.map((produto) => [produto.id, produto]))
  const linhas = itens.map(({ produtoId, quantidade }) => {
    const produto = porId.get(produtoId)
    let problema = ''
    if (!produto || !produto.ativo || produto.estoque === 0) problema = 'indisponivel'
    else if (quantidade > produto.estoque) problema = 'estoque'
    return {
      produtoId,
      produto,
      quantidade,
      subtotal: produto ? produto.preco_centavos * quantidade : 0,
      problema,
    }
  })
  const validas = linhas.filter(({ problema }) => !problema)
  return {
    linhas,
    total: validas.reduce((soma, { subtotal }) => soma + subtotal, 0),
    quantidadeTotal: linhas.reduce((soma, { quantidade }) => soma + quantidade, 0),
    temProblema: linhas.some(({ problema }) => problema),
  }
}

export function validarCarrinhoSalvo(valor) {
  if (!Array.isArray(valor)) return []
  return valor.filter((item) =>
    item && typeof item.produtoId === 'string' &&
    Number.isInteger(item.quantidade) && item.quantidade >= 1 && item.quantidade <= MAXIMO_POR_ITEM)
}
