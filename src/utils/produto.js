import { centavosParaTexto, paraCentavos } from './dinheiro.js'

export const ATALHOS_DESCONTO = [5, 10, 15, 20, 30]

// "10", "12,5", "15%" → 10 / 12.5 / 15. Vazio → 0. Inválido → null.
export function lerDesconto(texto) {
  const limpo = String(texto ?? '').replace('%', '').replace(',', '.').trim()
  if (!limpo) return 0
  const valor = Number(limpo)
  return Number.isFinite(valor) && valor >= 0 && valor < 100 ? valor : null
}

export function precoComDesconto(centavos, desconto) {
  return Math.round((centavos * (100 - desconto)) / 100)
}

// Produto já salvo (preço atual + preço antigo) → campos do formulário (preço cheio + desconto %).
export function precoParaFormulario(produto) {
  const antigo = produto?.preco_antigo_centavos
  if (!antigo) return { preco: centavosParaTexto(produto?.preco_centavos), desconto: '' }
  const percentual = Math.round((1 - produto.preco_centavos / antigo) * 10000) / 100
  return { preco: centavosParaTexto(antigo), desconto: String(percentual).replace('.', ',') }
}

// Confere o formulário e devolve o produto no formato do banco, ou uma mensagem de erro.
// `original`: preço como veio do banco, para não mudar nenhum centavo se o dono não mexer no preço.
export function validarFormulario(campos, original = null) {
  const nome = campos.nome.trim()
  if (nome.length < 2) return { erro: 'Dê um nome ao produto.' }
  const cheio = paraCentavos(campos.preco)
  if (!cheio) return { erro: 'Informe o preço, por exemplo 89,90.' }
  const desconto = lerDesconto(campos.desconto)
  if (desconto === null) return { erro: 'O desconto precisa ser um número entre 0 e 99, por exemplo 10.' }
  const estoque = Number(campos.estoque)
  if (campos.estoque.trim() === '' || !Number.isInteger(estoque) || estoque < 0) {
    return { erro: 'Informe o estoque em unidades (0 ou mais).' }
  }

  const precoIntocado = original && campos.preco === original.preco && campos.desconto === original.desconto
  let preco = desconto ? precoComDesconto(cheio, desconto) : cheio
  let precoAntigo = desconto ? cheio : null
  if (precoIntocado) {
    preco = original.preco_centavos
    precoAntigo = original.preco_antigo_centavos ?? null
  }
  if (precoAntigo !== null && precoAntigo <= preco) precoAntigo = null
  if (preco < 1) return { erro: 'Com esse desconto o preço fica zerado. Use um desconto menor.' }

  return {
    produto: {
      nome,
      marca: campos.marca.trim(),
      categoria: campos.categoria,
      preco_centavos: preco,
      preco_antigo_centavos: precoAntigo,
      estoque,
      descricao: campos.descricao.trim(),
      imagem_url: campos.imagem_url,
      ativo: campos.ativo,
      destaque: campos.destaque,
    },
  }
}
