// Leituras e gravações do painel da academia (dono e personal).
// O banco só libera esses dados para a equipe (regras do 0004_painel_adm.sql).
import { linhasParaTreinos } from '../dados/mapeamento.js'
import { chaveDoDia } from '../utils/checkins.js'
import { inicioDaJanela } from '../utils/painelAdmin.js'
import { somarDias } from '../utils/ficha.js'
import { conferirArquivo } from '../utils/midia.js'

export class ErroDoPainel extends Error {}

function conferir({ data, error, count }) {
  if (!error) return count ?? data
  const semRede = !error.code && /fetch|network|Failed/i.test(error.message ?? '')
  if (semRede) throw new ErroDoPainel('Sem conexão com a internet. Verifique e tente de novo.')
  if (['PGRST205', '42P01'].includes(error.code)) {
    throw new ErroDoPainel('O banco ainda não tem as tabelas do painel. Rode o arquivo 0004_painel_adm.sql no Supabase.')
  }
  if (error.code === '42501') throw new ErroDoPainel('Sua conta não tem permissão para isso.')
  throw new ErroDoPainel('Não foi possível concluir. Tente novamente em instantes.')
}

// O Supabase devolve no máximo 1.000 linhas por vez: busca em páginas até acabar.
async function lerTudo(montarConsulta, tamanho = 1000) {
  const todas = []
  for (let inicio = 0; ; inicio += tamanho) {
    const pagina = conferir(await montarConsulta().range(inicio, inicio + tamanho - 1))
    todas.push(...pagina)
    if (pagina.length < tamanho) return todas
  }
}

const CAMPOS_FICHA = 'id, aluno_id, titulo, objetivo, observacoes, inicio, fim, treinos, atualizado_em'
const CAMPOS_PEDIDO = 'id, numero, status, total_centavos, observacao, criado_em, itens_pedido(id, nome, preco_centavos, quantidade)'
const CAMPOS_MODELO = 'id, nome, objetivo, observacoes, duracao_dias, treinos, atualizado_em'

export async function carregarPainel(cliente, { dono }) {
  const hoje = chaveDoDia(new Date())
  const inicioMes = `${hoje.slice(0, 7)}-01`
  const inicioMesAnterior = `${somarDias(inicioMes, -1).slice(0, 7)}-01`
  const [perfis, checkins, sessoes, fichas, pedidosNovos, pedidos] = await Promise.all([
    lerTudo(() => cliente.from('perfis').select('id, nome, email, telefone, meta_semanal, papel, criado_em').order('nome')),
    lerTudo(() => cliente.from('checkins').select('usuario_id, dia').gte('dia', inicioDaJanela(hoje)).order('dia')),
    lerTudo(() => cliente.from('sessoes_treino').select('usuario_id, dia, fim').gte('dia', inicioMes).order('dia')),
    lerTudo(() => cliente.from('fichas_treino').select(CAMPOS_FICHA).gte('fim', somarDias(hoje, -120)).order('inicio')),
    dono
      ? cliente.from('pedidos').select('id', { count: 'exact', head: true }).eq('status', 'recebido').then(conferir)
      : Promise.resolve(0),
    // Faturamento: pedidos deste mês e do anterior (só o dono vê).
    dono
      ? lerTudo(() => cliente.from('pedidos').select('status, total_centavos, criado_em').gte('criado_em', inicioMesAnterior).order('criado_em'))
      : Promise.resolve([]),
  ])
  return { hoje, perfis, checkins, sessoes, fichas, pedidosNovos, pedidos }
}

// Tudo de um aluno para a tela de detalhe.
export async function carregarAluno(cliente, alunoId, { dono = false } = {}) {
  const [pesos, sessoes, fichas, pedidos] = await Promise.all([
    lerTudo(() => cliente.from('pesos').select('dia, kg').eq('usuario_id', alunoId).order('dia')),
    lerTudo(() => cliente.from('sessoes_treino').select('dia, inicio, fim, exercicios').eq('usuario_id', alunoId).order('dia')),
    lerTudo(() => cliente.from('fichas_treino').select(CAMPOS_FICHA).eq('aluno_id', alunoId).order('inicio', { ascending: false })),
    dono
      ? lerTudo(() => cliente.from('pedidos').select(CAMPOS_PEDIDO).eq('usuario_id', alunoId).order('criado_em', { ascending: false }))
      : Promise.resolve([]),
  ])
  return {
    pesos: pesos.map(({ dia, kg }) => ({ dia, kg: Number(kg) })),
    treinos: linhasParaTreinos(sessoes),
    fichas,
    pedidos,
  }
}

export async function salvarFicha(cliente, ficha) {
  const { id, ...campos } = ficha
  const consulta = id
    ? cliente.from('fichas_treino').update(campos).eq('id', id)
    : cliente.from('fichas_treino').insert(campos)
  return conferir(await consulta.select(CAMPOS_FICHA).single())
}

export async function excluirFicha(cliente, fichaId) {
  return conferir(await cliente.from('fichas_treino').delete().eq('id', fichaId))
}

// ---------------------------------------------------------------- modelos de treino

// Sem a tabela (0005 ainda não rodado) devolve `disponivel: false` em vez de quebrar a tela.
export async function listarModelos(cliente) {
  const resposta = await cliente.from('modelos_treino').select(CAMPOS_MODELO).order('nome')
  if (['PGRST205', '42P01'].includes(resposta.error?.code)) return { disponivel: false, modelos: [] }
  return { disponivel: true, modelos: conferir(resposta) }
}

export async function salvarModelo(cliente, modelo) {
  const { id, ...campos } = modelo
  const consulta = id
    ? cliente.from('modelos_treino').update(campos).eq('id', id)
    : cliente.from('modelos_treino').insert(campos)
  return conferir(await consulta.select(CAMPOS_MODELO).single())
}

export async function excluirModelo(cliente, modeloId) {
  return conferir(await cliente.from('modelos_treino').delete().eq('id', modeloId))
}

// ---------------------------------------------------------------- equipe

export async function definirPapel(cliente, usuarioId, papel) {
  const resposta = await cliente.rpc('definir_papel', { p_usuario: usuarioId, p_papel: papel })
  if (resposta.error?.code === 'PGRST202') {
    throw new ErroDoPainel('Rode o arquivo 0005_modelos_equipe.sql no Supabase para liberar a gestão da equipe.')
  }
  if (['P0001', 'P0002', '22023'].includes(resposta.error?.code)) throw new ErroDoPainel(resposta.error.message)
  return conferir(resposta)
}

// Foto ou vídeo de um exercício. Devolve o link público para guardar na ficha.
export async function enviarMidiaTreino(cliente, arquivo, tipo) {
  let extensao
  try {
    extensao = conferirArquivo(arquivo, tipo)
  } catch (erro) {
    throw new ErroDoPainel(erro.message)
  }
  const caminho = `${crypto.randomUUID()}.${extensao}`
  const { error } = await cliente.storage.from('treinos').upload(caminho, arquivo, { contentType: arquivo.type, cacheControl: '31536000' })
  if (error) {
    if (/bucket not found/i.test(error.message ?? '')) {
      throw new ErroDoPainel('Falta um passo no Supabase: rode o arquivo 0006_midias_treino.sql para liberar fotos e vídeos.')
    }
    if (/exceeded|too large|payload/i.test(error.message ?? '')) throw new ErroDoPainel('Arquivo grande demais para enviar.')
    if (/fetch|network|Failed/i.test(error.message ?? '')) throw new ErroDoPainel('Sem conexão com a internet. Verifique e tente de novo.')
    throw new ErroDoPainel('Não deu para enviar o arquivo. Tente de novo.')
  }
  return cliente.storage.from('treinos').getPublicUrl(caminho).data.publicUrl
}
