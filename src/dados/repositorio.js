// Leituras e gravações no Supabase. Toda gravação é idempotente (pode ser repetida
// sem efeito colateral), o que permite reenviar com segurança depois de uma falha de rede.
import { linhasParaCheckins, linhasParaFichas, linhasParaPerfil, linhasParaTreinos, sessaoParaLinha } from './mapeamento.js'

export class ErroDeDados extends Error {
  constructor(mensagem, { status = 0, codigo = '' } = {}) {
    super(mensagem)
    this.name = 'ErroDeDados'
    this.status = status
    this.codigo = codigo
    // Sem resposta, erro de servidor, limite de requisições ou token vencido: vale tentar de novo.
    this.retentavel = !status || status >= 500 || status === 401 || status === 408 || status === 429
  }
}

function verificar({ error, status }) {
  if (error) throw new ErroDeDados(error.message, { status, codigo: error.code })
}

// Coluna inexistente (42703 na leitura, PGRST204 na gravação): o banco ainda não
// recebeu a migração do telefone. O app segue funcionando sem ele.
const faltaColuna = (erro) => erro?.code === '42703' || erro?.code === 'PGRST204'

async function lerPerfil(cliente, usuarioId) {
  const resposta = await cliente.from('perfis').select('nome, meta_semanal, telefone, papel').eq('id', usuarioId).maybeSingle()
  if (!faltaColuna(resposta.error)) return resposta
  return cliente.from('perfis').select('nome, meta_semanal, papel').eq('id', usuarioId).maybeSingle()
}

// Fichas do personal dos últimos dois meses em diante. Sem a tabela (migração 0004
// ainda não rodada), o aluno segue com o plano padrão.
async function lerFichas(cliente, usuarioId) {
  const desde = new Date()
  desde.setDate(desde.getDate() - 62)
  const resposta = await cliente.from('fichas_treino')
    .select('id, titulo, objetivo, observacoes, inicio, fim, treinos')
    .eq('aluno_id', usuarioId).gte('fim', desde.toISOString().slice(0, 10)).order('inicio')
  if (['PGRST205', '42P01'].includes(resposta.error?.code)) return { data: [], error: null }
  return resposta
}

export async function carregarDados(cliente, usuarioId) {
  const [perfil, pesos, checkins, sessoes, fichas] = await Promise.all([
    lerPerfil(cliente, usuarioId),
    cliente.from('pesos').select('dia, kg').eq('usuario_id', usuarioId).order('dia'),
    cliente.from('checkins').select('dia').eq('usuario_id', usuarioId).order('dia'),
    cliente.from('sessoes_treino').select('dia, inicio, fim, exercicios').eq('usuario_id', usuarioId),
    lerFichas(cliente, usuarioId),
  ])
  for (const resposta of [perfil, pesos, checkins, sessoes, fichas]) verificar(resposta)

  return {
    perfil: linhasParaPerfil(perfil.data, pesos.data),
    checkins: linhasParaCheckins(checkins.data),
    treinos: linhasParaTreinos(sessoes.data),
    fichas: linhasParaFichas(fichas.data),
  }
}

// Executa uma operação da fila de sincronização.
export async function executarOperacao(cliente, usuarioId, operacao) {
  switch (operacao.tipo) {
    case 'perfil': {
      const campos = { nome: operacao.nome.trim().slice(0, 40), meta_semanal: operacao.metaSemanal }
      if (operacao.telefone !== undefined) campos.telefone = operacao.telefone
      let resposta = await cliente.from('perfis').update(campos).eq('id', usuarioId)
      if (faltaColuna(resposta.error) && 'telefone' in campos) {
        delete campos.telefone
        resposta = await cliente.from('perfis').update(campos).eq('id', usuarioId)
      }
      return verificar(resposta)
    }

    case 'checkin':
      return verificar(await cliente.from('checkins')
        .upsert({ usuario_id: usuarioId, dia: operacao.dia }, { onConflict: 'usuario_id,dia', ignoreDuplicates: true }))

    case 'peso':
      return verificar(operacao.kg === null
        ? await cliente.from('pesos').delete().eq('usuario_id', usuarioId).eq('dia', operacao.dia)
        : await cliente.from('pesos')
          .upsert({ usuario_id: usuarioId, dia: operacao.dia, kg: operacao.kg }, { onConflict: 'usuario_id,dia' }))

    case 'sessao': {
      const resposta = await cliente.from('sessoes_treino')
        .upsert({ usuario_id: usuarioId, ...sessaoParaLinha(operacao.dia, operacao.sessao) }, { onConflict: 'usuario_id,dia' })
      // Reenvio de um treino que já foi finalizado no servidor: o banco recusa por estar travado,
      // mas o dado já está salvo, então conta como sucesso.
      if (resposta.error?.code === '42501' && operacao.sessao.fim) return undefined
      return verificar(resposta)
    }

    default:
      throw new ErroDeDados(`Operação desconhecida: ${operacao.tipo}`, { status: 400 })
  }
}
