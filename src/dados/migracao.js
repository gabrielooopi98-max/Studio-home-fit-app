// Leva para a conta os dados que o aluno já tinha salvos neste aparelho (versão sem login).
// Só acontece uma vez por aparelho, para a primeira conta que entrar nele. Os dados
// locais não são apagados.
import { carregarTreinos, lerTreinosSalvos } from '../componentes/area-treinos/treinoLocal.js'
import { carregarCheckins, diasDaSemana } from '../utils/checkins.js'
import { carregarPerfil } from '../utils/perfil.js'

export const CHAVE_MIGRACAO = 'home-fit:migrado-para'

export function lerDadosLocais(armazenamento) {
  let perfil = null
  let checkins = []
  let treinos = { versao: 1, sessoes: {} }
  try { perfil = carregarPerfil(armazenamento) } catch { /* perfil local inválido */ }
  try { checkins = carregarCheckins(armazenamento) } catch { /* check-ins locais inválidos */ }
  try {
    treinos = carregarTreinos(armazenamento, diasDaSemana())
  } catch {
    try { treinos = lerTreinosSalvos() } catch { /* histórico local inválido */ }
  }
  return { perfil, checkins, treinos }
}

export function operacoesDeMigracao(local, servidor) {
  const operacoes = []

  if (local.perfil?.nome && !servidor.perfil.nome) {
    operacoes.push({ tipo: 'perfil', nome: local.perfil.nome, metaSemanal: local.perfil.metaSemanal })
  }
  const pesosNoServidor = new Set(servidor.perfil.pesos.map(({ dia }) => dia))
  for (const { dia, kg } of local.perfil?.pesos ?? []) {
    if (!pesosNoServidor.has(dia)) operacoes.push({ tipo: 'peso', dia, kg })
  }
  for (const dia of local.checkins) {
    if (!servidor.checkins.includes(dia)) operacoes.push({ tipo: 'checkin', dia })
  }
  for (const [dia, sessao] of Object.entries(local.treinos.sessoes)) {
    if (!servidor.treinos.sessoes[dia]) operacoes.push({ tipo: 'sessao', dia, sessao })
  }
  return operacoes
}
