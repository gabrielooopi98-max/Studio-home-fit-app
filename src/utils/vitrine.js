// Busca, filtros e ordenação da vitrine da loja.

export const ORDENS = [
  { id: 'relevancia', nome: 'Mais relevantes' },
  { id: 'menor-preco', nome: 'Menor preço' },
  { id: 'maior-preco', nome: 'Maior preço' },
  { id: 'desconto', nome: 'Maior desconto' },
]

export const FILTROS_PADRAO = { busca: '', categoria: 'todas', ordem: 'relevancia', soPromocao: false, esconderEsgotados: false }

export function normalizar(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function descontoPercentual(produto) {
  const antigo = produto.preco_antigo_centavos
  return antigo && antigo > produto.preco_centavos
    ? Math.round((1 - produto.preco_centavos / antigo) * 100)
    : 0
}

// Quantos filtros (além da busca e da categoria) estão diferentes do padrão.
export function filtrosAtivos(filtros) {
  return Number(filtros.ordem !== 'relevancia') + Number(filtros.soPromocao) + Number(filtros.esconderEsgotados)
}

export function filtrarProdutos(produtos, filtros) {
  const termo = normalizar(filtros.busca)
  const lista = produtos.filter((produto) =>
    produto.ativo &&
    (filtros.categoria === 'todas' || produto.categoria === filtros.categoria) &&
    (!termo || normalizar(`${produto.nome} ${produto.marca}`).includes(termo)) &&
    (!filtros.soPromocao || descontoPercentual(produto) > 0) &&
    (!filtros.esconderEsgotados || produto.estoque > 0))

  const esgotadoPorUltimo = (a, b) => Number(a.estoque === 0) - Number(b.estoque === 0)
  const comparadores = {
    relevancia: (a, b) => esgotadoPorUltimo(a, b) || Number(b.destaque) - Number(a.destaque) ||
      descontoPercentual(b) - descontoPercentual(a) || a.nome.localeCompare(b.nome, 'pt-BR'),
    'menor-preco': (a, b) => esgotadoPorUltimo(a, b) || a.preco_centavos - b.preco_centavos,
    'maior-preco': (a, b) => esgotadoPorUltimo(a, b) || b.preco_centavos - a.preco_centavos,
    desconto: (a, b) => esgotadoPorUltimo(a, b) || descontoPercentual(b) - descontoPercentual(a) ||
      a.preco_centavos - b.preco_centavos,
  }
  return lista.sort(comparadores[filtros.ordem] ?? comparadores.relevancia)
}
