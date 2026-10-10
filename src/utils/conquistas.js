import { sequenciaDeSemanas } from './checkins.js'
import {
  recordesDaSessao, sessoesFinalizadas, volumeDaSessao,
} from '../componentes/area-treinos/treinoLocal.js'

export function calcularConquistas({ checkins, treinos, metaSemanal, hoje = new Date() }) {
  const finalizadas = sessoesFinalizadas(treinos)
  const totalTreinos = finalizadas.length
  const { melhor } = sequenciaDeSemanas(checkins, metaSemanal, hoje)
  const recordes = finalizadas.reduce((total, [dia]) => total + recordesDaSessao(treinos, dia).length, 0)
  const toneladas = finalizadas.reduce((total, [, sessao]) => total + volumeDaSessao(sessao), 0) / 1000
  const madrugador = finalizadas.some(([, sessao]) => sessao.inicio && new Date(sessao.inicio).getHours() < 7)
  const porMes = new Map()
  for (const dia of checkins) porMes.set(dia.slice(0, 7), (porMes.get(dia.slice(0, 7)) || 0) + 1)
  const melhorMes = Math.max(0, ...porMes.values())

  return [
    { id: 'primeiro-checkin', icone: '📍', titulo: 'Primeiro passo', descricao: 'Faça seu primeiro check-in', atual: checkins.length, alvo: 1 },
    { id: 'primeiro-treino', icone: '💪', titulo: 'Começou!', descricao: 'Conclua seu primeiro treino', atual: totalTreinos, alvo: 1 },
    { id: 'semana-meta', icone: '🎯', titulo: 'Na meta', descricao: 'Bata sua meta semanal', atual: melhor, alvo: 1 },
    { id: 'recorde', icone: '🏆', titulo: 'Recordista', descricao: 'Supere sua maior carga em um exercício', atual: recordes, alvo: 1 },
    { id: 'treinos-10', icone: '⚡', titulo: 'Constância', descricao: 'Conclua 10 treinos', atual: totalTreinos, alvo: 10 },
    { id: 'sequencia-4', icone: '🔥', titulo: 'Em chamas', descricao: '4 semanas seguidas na meta', atual: melhor, alvo: 4 },
    { id: 'mes-12', icone: '📅', titulo: 'Mês de ferro', descricao: '12 check-ins no mesmo mês', atual: melhorMes, alvo: 12 },
    { id: 'madrugador', icone: '🌅', titulo: 'Madrugador', descricao: 'Comece um treino antes das 7h', atual: madrugador ? 1 : 0, alvo: 1 },
    { id: 'toneladas-10', icone: '🦍', titulo: 'Força bruta', descricao: 'Some 10 toneladas de volume', atual: Math.floor(toneladas * 10) / 10, alvo: 10 },
    { id: 'treinos-50', icone: '🏅', titulo: 'Rato de academia', descricao: 'Conclua 50 treinos', atual: totalTreinos, alvo: 50 },
  ].map((conquista) => ({ ...conquista, conquistada: conquista.atual >= conquista.alvo }))
}
