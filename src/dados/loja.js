// Chamadas da loja. Diferente do treino, comprar exige internet: tudo aqui é direto no servidor.

export const CATEGORIAS = [
  { id: 'proteinas', nome: 'Whey Protein' },
  { id: 'creatina', nome: 'Creatina' },
  { id: 'pre-treino', nome: 'Pré-treino' },
  { id: 'aminoacidos', nome: 'Aminoácidos' },
  { id: 'vitaminas', nome: 'Vitaminas' },
  { id: 'acessorios', nome: 'Acessórios' },
  { id: 'outros', nome: 'Outros' },
]

export const STATUS_PEDIDO = {
  recebido: { nome: 'Recebido', texto: 'A academia vai separar seu pedido.' },
  separado: { nome: 'Pronto para retirar', texto: 'Retire na recepção e pague no balcão.' },
  retirado: { nome: 'Retirado', texto: 'Pedido entregue. Bom treino!' },
  cancelado: { nome: 'Cancelado', texto: 'Este pedido foi cancelado.' },
}

const CAMPOS_PRODUTO = 'id, nome, marca, descricao, categoria, preco_centavos, preco_antigo_centavos, estoque, imagem_url, ativo, destaque'
const CAMPOS_PEDIDO = 'id, numero, status, total_centavos, observacao, criado_em, itens_pedido(id, produto_id, nome, preco_centavos, quantidade)'

export class ErroDaLoja extends Error {}

function conferir({ data, error }) {
  if (!error) return data
  const semRede = !error.code && /fetch|network|Failed/i.test(error.message ?? '')
  // As funções do banco já devolvem mensagens prontas em português (códigos P0001/P0002/22023).
  const doBanco = ['P0001', 'P0002', '22023', '28000', '42501'].includes(error.code)
  throw new ErroDaLoja(semRede
    ? 'Sem conexão com a internet. Verifique e tente de novo.'
    : doBanco ? error.message : 'Não foi possível concluir. Tente novamente em instantes.')
}

export async function listarProdutos(cliente) {
  return conferir(await cliente.from('produtos').select(CAMPOS_PRODUTO)
    .order('destaque', { ascending: false }).order('nome'))
}

export async function criarPedido(cliente, itens, observacao) {
  return conferir(await cliente.rpc('criar_pedido', {
    p_itens: itens.map(({ produtoId, quantidade }) => ({ produto_id: produtoId, quantidade })),
    p_observacao: observacao,
  }))
}

export async function listarMeusPedidos(cliente, usuarioId) {
  return conferir(await cliente.from('pedidos').select(CAMPOS_PEDIDO)
    .eq('usuario_id', usuarioId).neq('status', 'cancelado')
    .order('criado_em', { ascending: false }).limit(30))
}

export async function cancelarPedido(cliente, pedidoId) {
  return conferir(await cliente.rpc('cancelar_pedido', { p_pedido: pedidoId }))
}

// ---------- só para o dono da academia (o banco recusa para os outros)

export async function listarPedidosDaLoja(cliente, { abertos }) {
  let consulta = cliente.from('pedidos').select(`${CAMPOS_PEDIDO}, perfis(nome, telefone)`)
    .order('criado_em', { ascending: !abertos }).limit(60)
  consulta = abertos ? consulta.in('status', ['recebido', 'separado']) : consulta.in('status', ['retirado', 'cancelado'])
  const pedidos = conferir(await consulta)
  return abertos ? pedidos : pedidos.reverse()
}

export async function atualizarStatusPedido(cliente, pedidoId, status) {
  return conferir(await cliente.rpc('atualizar_status_pedido', { p_pedido: pedidoId, p_status: status }))
}

export async function salvarProduto(cliente, produto) {
  const { id, ...campos } = produto
  const consulta = id
    ? cliente.from('produtos').update(campos).eq('id', id)
    : cliente.from('produtos').insert(campos)
  return conferir(await consulta.select(CAMPOS_PRODUTO).single())
}

export async function excluirProduto(cliente, produtoId) {
  return conferir(await cliente.from('produtos').delete().eq('id', produtoId))
}

export async function enviarFotoProduto(cliente, arquivo) {
  const extensao = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[arquivo.type]
  if (!extensao) throw new ErroDaLoja('Use uma imagem JPG, PNG ou WEBP.')
  if (arquivo.size > 5 * 1024 * 1024) throw new ErroDaLoja('A imagem precisa ter até 5 MB.')
  const caminho = `${crypto.randomUUID()}.${extensao}`
  conferir(await cliente.storage.from('produtos').upload(caminho, arquivo, { contentType: arquivo.type, cacheControl: '31536000' }))
  return cliente.storage.from('produtos').getPublicUrl(caminho).data.publicUrl
}
