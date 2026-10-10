import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MAXIMO_POR_ITEM, adicionarAoCarrinho, definirQuantidade, quantidadeNoCarrinho, resumoDoCarrinho, validarCarrinhoSalvo,
} from './carrinho.js'
import { centavosParaTexto, formatarPreco, paraCentavos } from './dinheiro.js'

const whey = { id: 'w', nome: 'Whey', preco_centavos: 13990, estoque: 3, ativo: true }
const creatina = { id: 'c', nome: 'Creatina', preco_centavos: 8990, estoque: 20, ativo: true }

test('formata e lê preços em reais', () => {
  assert.equal(formatarPreco(13990), 'R$ 139,90')
  assert.equal(formatarPreco(129990), 'R$ 1.299,90')
  assert.equal(paraCentavos('89,90'), 8990)
  assert.equal(paraCentavos('89.9'), 8990)
  assert.equal(paraCentavos('90'), 9000)
  assert.equal(paraCentavos('R$ 1.299,90'), 129990)
  assert.equal(paraCentavos('1.299'), 129900, 'ponto de milhar sem centavos')
  assert.equal(paraCentavos(''), null)
  assert.equal(paraCentavos('abc'), null)
  assert.equal(centavosParaTexto(8990), '89,90')
  assert.equal(centavosParaTexto(null), '')
})

test('carrinho respeita estoque e o limite por item', () => {
  let itens = adicionarAoCarrinho([], whey)
  itens = adicionarAoCarrinho(itens, whey, 5)
  assert.equal(quantidadeNoCarrinho(itens, 'w'), 3, 'não passa do estoque')
  itens = adicionarAoCarrinho(itens, creatina, 50)
  assert.equal(quantidadeNoCarrinho(itens, 'c'), MAXIMO_POR_ITEM)
  itens = definirQuantidade(itens, 'w', 0)
  assert.deepEqual(itens, [{ produtoId: 'c', quantidade: MAXIMO_POR_ITEM }])
  assert.deepEqual(adicionarAoCarrinho([], { ...whey, estoque: 0 }), [], 'esgotado não entra')
})

test('resumo calcula total e aponta itens com problema', () => {
  const itens = [
    { produtoId: 'w', quantidade: 2 },
    { produtoId: 'c', quantidade: 1 },
    { produtoId: 'sumiu', quantidade: 1 },
  ]
  const resumo = resumoDoCarrinho(itens, [whey, creatina])
  assert.equal(resumo.total, 13990 * 2 + 8990)
  assert.equal(resumo.quantidadeTotal, 4)
  assert.equal(resumo.temProblema, true)
  assert.equal(resumo.linhas[2].problema, 'indisponivel')

  const semEstoque = resumoDoCarrinho([{ produtoId: 'w', quantidade: 5 }], [whey])
  assert.equal(semEstoque.linhas[0].problema, 'estoque')
  assert.equal(semEstoque.total, 0, 'linha com problema não entra no total')
  assert.equal(resumoDoCarrinho([], []).temProblema, false)
})

test('carrinho salvo inválido é limpo', () => {
  assert.deepEqual(validarCarrinhoSalvo(null), [])
  assert.deepEqual(validarCarrinhoSalvo([{ produtoId: 'w', quantidade: 2 }, { produtoId: 1 }, { produtoId: 'c', quantidade: 99 }]),
    [{ produtoId: 'w', quantidade: 2 }])
})

test('formulário de produto: preço normal + desconto em %', async () => {
  const { lerDesconto, precoParaFormulario, validarFormulario } = await import('./produto.js')
  const base = {
    nome: ' Whey 900g ', marca: ' Growth ', categoria: 'proteinas', preco: '159,90', desconto: '',
    estoque: '12', descricao: '', imagem_url: '', ativo: true, destaque: false,
  }
  assert.deepEqual(validarFormulario(base).produto, {
    nome: 'Whey 900g', marca: 'Growth', categoria: 'proteinas', preco_centavos: 15990, preco_antigo_centavos: null,
    estoque: 12, descricao: '', imagem_url: '', ativo: true, destaque: false,
  })

  const comDesconto = validarFormulario({ ...base, desconto: '20' }).produto
  assert.equal(comDesconto.preco_centavos, 12792, '20% de 159,90 = 127,92')
  assert.equal(comDesconto.preco_antigo_centavos, 15990)
  assert.equal(validarFormulario({ ...base, desconto: '12,5%' }).produto.preco_centavos, 13991)
  assert.equal(validarFormulario({ ...base, desconto: '0' }).produto.preco_antigo_centavos, null)

  assert.equal(lerDesconto(''), 0)
  assert.equal(lerDesconto('15%'), 15)
  assert.equal(lerDesconto('100'), null)
  assert.equal(lerDesconto('abc'), null)
  assert.match(validarFormulario({ ...base, desconto: '150' }).erro, /desconto/)
  assert.match(validarFormulario({ ...base, nome: 'a' }).erro, /nome/)
  assert.match(validarFormulario({ ...base, preco: '' }).erro, /preço/)
  assert.match(validarFormulario({ ...base, estoque: '' }).erro, /estoque/)
  assert.match(validarFormulario({ ...base, estoque: '2,5' }).erro, /estoque/)

  // Produto em promoção salvo como 139,90 (de 159,90): abre com 12,51% e, sem mexer, não muda nenhum centavo.
  const salvo = { preco_centavos: 13990, preco_antigo_centavos: 15990 }
  const campos = precoParaFormulario(salvo)
  assert.deepEqual(campos, { preco: '159,90', desconto: '12,51' })
  const original = { ...campos, ...salvo }
  const intocado = validarFormulario({ ...base, ...campos }, original).produto
  assert.equal(intocado.preco_centavos, 13990)
  assert.equal(intocado.preco_antigo_centavos, 15990)
  // Mudou o desconto: recalcula.
  assert.equal(validarFormulario({ ...base, ...campos, desconto: '10' }, original).produto.preco_centavos, 14391)
  assert.deepEqual(precoParaFormulario({ preco_centavos: 8990, preco_antigo_centavos: null }), { preco: '89,90', desconto: '' })
})

test('vitrine: busca, filtros e ordenações', async () => {
  const { FILTROS_PADRAO, descontoPercentual, filtrarProdutos, filtrosAtivos } = await import('./vitrine.js')
  const produtos = [
    { id: 'a', nome: 'Whey', marca: 'Growth', categoria: 'proteinas', preco_centavos: 13990, preco_antigo_centavos: 15990, estoque: 5, ativo: true, destaque: false },
    { id: 'b', nome: 'Creatina', marca: 'Max', categoria: 'creatina', preco_centavos: 8990, preco_antigo_centavos: null, estoque: 3, ativo: true, destaque: true },
    { id: 'c', nome: 'Pré-treino', marca: 'Demons', categoria: 'pre-treino', preco_centavos: 11990, preco_antigo_centavos: 17990, estoque: 2, ativo: true, destaque: false },
    { id: 'd', nome: 'BCAA', marca: 'Integral', categoria: 'aminoacidos', preco_centavos: 4990, preco_antigo_centavos: null, estoque: 0, ativo: true, destaque: false },
    { id: 'e', nome: 'Oculto', marca: '', categoria: 'outros', preco_centavos: 100, preco_antigo_centavos: null, estoque: 9, ativo: false, destaque: false },
  ]
  const ids = (filtros) => filtrarProdutos(produtos, { ...FILTROS_PADRAO, ...filtros }).map(({ id }) => id)

  assert.equal(descontoPercentual(produtos[0]), 13)
  assert.equal(descontoPercentual(produtos[1]), 0)
  assert.deepEqual(ids({}), ['b', 'c', 'a', 'd'], 'destaque, depois maior desconto; esgotado por último; inativo some')
  assert.deepEqual(ids({ ordem: 'menor-preco' }), ['b', 'c', 'a', 'd'])
  assert.deepEqual(ids({ ordem: 'maior-preco' }), ['a', 'c', 'b', 'd'])
  assert.deepEqual(ids({ ordem: 'desconto' }), ['c', 'a', 'b', 'd'])
  assert.deepEqual(ids({ soPromocao: true }), ['c', 'a'])
  assert.deepEqual(ids({ esconderEsgotados: true, ordem: 'menor-preco' }), ['b', 'c', 'a'])
  assert.deepEqual(ids({ busca: 'pre treino' }), [], 'busca precisa bater o texto')
  assert.deepEqual(ids({ busca: 'PRÉ' }), ['c'], 'ignora acento e maiúsculas')
  assert.deepEqual(ids({ busca: 'growth' }), ['a'], 'busca pela marca')
  assert.deepEqual(ids({ categoria: 'creatina' }), ['b'])
  assert.equal(filtrosAtivos(FILTROS_PADRAO), 0)
  assert.equal(filtrosAtivos({ ...FILTROS_PADRAO, ordem: 'menor-preco', soPromocao: true }), 2)
})
