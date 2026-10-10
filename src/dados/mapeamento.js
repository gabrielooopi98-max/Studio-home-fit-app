// Conversão entre as linhas do Supabase e os formatos que o app já usa.
import { validarTreinos } from '../componentes/area-treinos/treinoLocal.js'

function paraMs(valor) {
  if (!valor) return null
  const ms = Date.parse(valor)
  return Number.isFinite(ms) ? ms : null
}

function paraIso(ms) {
  return ms === null || ms === undefined ? null : new Date(ms).toISOString()
}

export function linhasParaPerfil(linhaPerfil, linhasPesos) {
  return {
    versao: 1,
    nome: linhaPerfil?.nome ?? '',
    telefone: linhaPerfil?.telefone ?? '',
    papel: ['dono', 'personal'].includes(linhaPerfil?.papel) ? linhaPerfil.papel : 'aluno',
    metaSemanal: Math.min(5, Math.max(1, linhaPerfil?.meta_semanal ?? 3)),
    pesos: (linhasPesos ?? [])
      .map(({ dia, kg }) => ({ dia, kg: Number(kg) }))
      .filter(({ kg }) => Number.isFinite(kg) && kg > 0)
      .sort((a, b) => a.dia.localeCompare(b.dia)),
  }
}

export function linhasParaCheckins(linhas) {
  return [...new Set((linhas ?? []).map(({ dia }) => dia))].sort()
}

// Sessões inválidas são ignoradas uma a uma, para um registro ruim não derrubar o histórico.
export function linhasParaTreinos(linhas) {
  const sessoes = {}
  for (const linha of linhas ?? []) {
    const sessao = { inicio: paraMs(linha.inicio), fim: paraMs(linha.fim), exercicios: linha.exercicios ?? {} }
    try {
      validarTreinos({ versao: 1, sessoes: { [linha.dia]: sessao } })
      sessoes[linha.dia] = sessao
    } catch {
      // registro corrompido: fica de fora
    }
  }
  return { versao: 1, sessoes }
}

// Fichas do personal: só entram as que têm o formato esperado.
export function linhasParaFichas(linhas) {
  const data = /^\d{4}-\d{2}-\d{2}$/
  return (linhas ?? []).filter((ficha) =>
    ficha && data.test(ficha.inicio) && data.test(ficha.fim) && Array.isArray(ficha.treinos) &&
    ficha.treinos.every((treino) =>
      treino && typeof treino.letra === 'string' && Array.isArray(treino.dias) && Array.isArray(treino.exercicios) &&
      treino.exercicios.every((item) => item && typeof item.id === 'string' && Number.isInteger(item.series) && item.series > 0)))
}

export function sessaoParaLinha(dia, sessao) {
  return {
    dia,
    inicio: paraIso(sessao.inicio),
    fim: paraIso(sessao.fim),
    exercicios: sessao.exercicios,
  }
}
