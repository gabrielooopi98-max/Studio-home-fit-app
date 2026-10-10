// Números do painel da academia, calculados a partir dos dados dos alunos.
import { dataCurta, diasEntre, estadoDaFicha, fichaDoDia, fichaDoMes, somarDias } from './ficha.js'
import { inicioDaSemana, chaveDoDia } from './checkins.js'

export const DIAS_PARA_SUMIDO = 7

// Junta perfis, check-ins, sessões e fichas num resumo por aluno.
export function resumoDosAlunos({ perfis, checkins, sessoes, fichas }, hoje) {
  const inicioMes = `${hoje.slice(0, 7)}-01`
  const inicioSemana = chaveDoDia(inicioDaSemana(new Date(`${hoje}T12:00:00`)))
  const porAluno = (lista, campo = 'usuario_id') => {
    const mapa = new Map()
    for (const item of lista ?? []) {
      const chave = item[campo]
      if (!mapa.has(chave)) mapa.set(chave, [])
      mapa.get(chave).push(item)
    }
    return mapa
  }
  const checkinsPorAluno = porAluno(checkins)
  const sessoesPorAluno = porAluno(sessoes)
  const fichasPorAluno = porAluno(fichas, 'aluno_id')

  return (perfis ?? [])
    .filter((perfil) => perfil.papel === 'aluno')
    .map((perfil) => {
      const dias = (checkinsPorAluno.get(perfil.id) ?? []).map(({ dia }) => dia).sort()
      const ultimoCheckin = dias.at(-1) ?? null
      const fichasDoAluno = (fichasPorAluno.get(perfil.id) ?? []).sort((a, b) => b.inicio.localeCompare(a.inicio))
      // A ficha que vale hoje; se não houver, a mais recente (para mostrar que venceu ou que vai começar).
      const fichaAtual = fichaDoDia(fichasDoAluno, hoje) ?? fichasDoAluno[0] ?? null
      const situacaoFicha = estadoDaFicha(fichaAtual, hoje)
      return {
        id: perfil.id,
        nome: perfil.nome || 'Sem nome',
        email: perfil.email ?? '',
        telefone: perfil.telefone ?? '',
        metaSemanal: perfil.meta_semanal ?? 3,
        criadoEm: perfil.criado_em ?? null,
        checkins: dias,
        ultimoCheckin,
        diasSemVir: ultimoCheckin ? diasEntre(ultimoCheckin, hoje) : null,
        checkinsMes: dias.filter((dia) => dia >= inicioMes && dia <= hoje).length,
        checkinsSemana: dias.filter((dia) => dia >= inicioSemana && dia <= hoje).length,
        treinosMes: (sessoesPorAluno.get(perfil.id) ?? []).filter(({ dia, fim }) => fim && dia >= inicioMes).length,
        fichaAtual,
        fichas: fichasDoAluno,
        situacaoFicha,
      }
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export function alunoSumido(aluno) {
  return aluno.diasSemVir === null || aluno.diasSemVir >= DIAS_PARA_SUMIDO
}

export function filtrarAlunos(alunos, { busca = '', filtro = 'todos', mes = null }) {
  const termo = busca.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  return alunos.filter((aluno) => {
    const texto = `${aluno.nome} ${aluno.email} ${aluno.telefone}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    if (termo && !texto.includes(termo)) return false
    if (filtro === 'sumidos') return alunoSumido(aluno)
    if (filtro === 'ativos') return aluno.checkinsSemana > 0
    if (filtro === 'sem-treino') return !fichaDoMes(aluno.fichas, mes)
    if (filtro === 'sem-ficha') return ['sem', 'vencida'].includes(aluno.situacaoFicha.estado)
    if (filtro === 'vencendo') return aluno.situacaoFicha.estado === 'vencendo'
    return true
  })
}

export function indicadoresDoPainel(alunos, checkinsHoje, hoje) {
  const inicioSemana = chaveDoDia(inicioDaSemana(new Date(`${hoje}T12:00:00`)))
  return {
    total: alunos.length,
    checkinsHoje,
    ativosSemana: alunos.filter((aluno) => aluno.ultimoCheckin && aluno.ultimoCheckin >= inicioSemana).length,
    sumidos: alunos.filter(alunoSumido).length,
    semFicha: alunos.filter((aluno) => ['sem', 'vencida'].includes(aluno.situacaoFicha.estado)).length,
    vencendo: alunos.filter((aluno) => aluno.situacaoFicha.estado === 'vencendo').length,
  }
}

export function primeiroNome(nome) {
  return (nome || 'Aluno').trim().split(/\s+/)[0]
}

export function linkWhatsApp(telefone, texto) {
  return telefone ? `https://wa.me/55${telefone}?text=${encodeURIComponent(texto)}` : ''
}

// Mensagens prontas para o personal mandar com um toque.
export function mensagemPara(tipo, aluno, extra = {}) {
  const nome = primeiroNome(aluno.nome)
  switch (tipo) {
    case 'sumido':
      return `Oi, ${nome}! Sentimos sua falta aqui na Home Fit 💪 Bora voltar essa semana? Se precisar ajustar o treino, me chama.`
    case 'ficha-nova':
      return `Oi, ${nome}! Seu treino novo já está no app da Home Fit${extra.titulo ? ` (${extra.titulo})` : ''}. Abre a aba Treino pra ver. Qualquer dúvida, me chama! 💪`
    case 'ficha-vencendo':
      return `Oi, ${nome}! Sua ficha de treino vence em breve. Vamos montar a próxima? Me fala como estão os treinos.`
    default:
      return `Oi, ${nome}!`
  }
}

// Data inicial padrão para buscar check-ins no painel (dois meses).
export function inicioDaJanela(hoje) {
  return somarDias(`${hoje.slice(0, 7)}-01`, -31)
}

// ---------------------------------------------------------------- tendências e séries da visão geral

// Variação percentual de um número em relação ao período anterior.
export function tendencia(atual, anterior) {
  if (!anterior) return atual ? { direcao: 'sobe', texto: 'novo' } : { direcao: 'igual', texto: 'sem dados' }
  const variacao = Math.round(((atual - anterior) / anterior) * 100)
  return {
    direcao: variacao > 0 ? 'sobe' : variacao < 0 ? 'desce' : 'igual',
    texto: `${variacao > 0 ? '+' : ''}${variacao}%`,
  }
}

function ehDiaUtil(dia) {
  const semana = new Date(`${dia}T12:00:00`).getDay()
  return semana !== 0 && semana !== 6
}

// Últimos N dias úteis (segunda a sexta) até hoje, com o total de check-ins de cada um.
export function checkinsPorDiaUtil(checkins, hoje, quantidade = 30) {
  const contagem = new Map()
  for (const { dia } of checkins ?? []) contagem.set(dia, (contagem.get(dia) ?? 0) + 1)
  const dias = []
  for (let passo = 0; dias.length < quantidade && passo < quantidade * 2; passo++) {
    const dia = somarDias(hoje, -passo)
    if (ehDiaUtil(dia)) dias.unshift({ dia, total: contagem.get(dia) ?? 0 })
  }
  return dias
}

// Esta semana (segunda até hoje) contra o mesmo trecho da semana passada: comparação justa.
export function comparativoSemanal(checkins, hoje) {
  const segunda = chaveDoDia(inicioDaSemana(new Date(`${hoje}T12:00:00`)))
  const segundaPassada = somarDias(segunda, -7)
  const hojePassado = somarDias(hoje, -7)
  const desta = (checkins ?? []).filter(({ dia }) => dia >= segunda && dia <= hoje)
  const daPassada = (checkins ?? []).filter(({ dia }) => dia >= segundaPassada && dia <= hojePassado)
  return {
    checkins: desta.length,
    checkinsAntes: daPassada.length,
    ativos: new Set(desta.map(({ usuario_id: id }) => id)).size,
    ativosAntes: new Set(daPassada.map(({ usuario_id: id }) => id)).size,
  }
}

function mesAnterior(hoje) {
  const [ano, mes] = hoje.split('-').map(Number)
  return mes === 1 ? `${ano - 1}-12` : `${ano}-${String(mes - 1).padStart(2, '0')}`
}

export function novosAlunos(perfis, hoje) {
  const alunos = (perfis ?? []).filter(({ papel }) => papel === 'aluno')
  const doMes = (mes) => alunos.filter(({ criado_em: criado }) => criado?.slice(0, 7) === mes).length
  return { mes: doMes(hoje.slice(0, 7)), mesAnterior: doMes(mesAnterior(hoje)) }
}

// Só pedido retirado conta como dinheiro recebido; os outros estão "a receber".
export function faturamento(pedidos, hoje) {
  const doMes = (mes, status) => (pedidos ?? [])
    .filter((pedido) => pedido.criado_em?.slice(0, 7) === mes && status.includes(pedido.status))
  const recebidos = doMes(hoje.slice(0, 7), ['retirado'])
  return {
    mes: recebidos.reduce((soma, { total_centavos: total }) => soma + total, 0),
    mesAnterior: doMes(mesAnterior(hoje), ['retirado']).reduce((soma, { total_centavos: total }) => soma + total, 0),
    pedidosMes: recebidos.length,
    aReceber: doMes(hoje.slice(0, 7), ['recebido', 'separado']).reduce((soma, { total_centavos: total }) => soma + total, 0),
  }
}

// ---------------------------------------------------------------- tabela de alunos

export function ordenarAlunos(alunos, { coluna = 'nome', direcao = 'asc', mes = null }) {
  const fator = direcao === 'asc' ? 1 : -1
  const valor = {
    nome: (aluno) => aluno.nome.toLocaleLowerCase('pt-BR'),
    // Quem nunca veio conta como "há muito tempo".
    presenca: (aluno) => aluno.diasSemVir ?? 99999,
    mes: (aluno) => aluno.checkinsMes,
    semana: (aluno) => aluno.checkinsSemana * 1000 + aluno.checkinsMes,
    // Sem o treino do mês primeiro; depois quem tem o treino que acaba antes.
    treino: (aluno) => fichaDoMes(aluno.fichas, mes)?.fim ?? '',
    // Sem ficha primeiro; depois quem vence antes.
    ficha: (aluno) => (aluno.situacaoFicha.estado === 'sem' || aluno.situacaoFicha.estado === 'vencida' ? '' : aluno.fichaAtual?.fim ?? ''),
  }[coluna] ?? ((aluno) => aluno.nome)
  return [...alunos].sort((a, b) => {
    const va = valor(a)
    const vb = valor(b)
    if (va < vb) return -1 * fator
    if (va > vb) return 1 * fator
    return a.nome.localeCompare(b.nome, 'pt-BR')
  })
}

// Como está a frequência: em dia, pedindo atenção ou sumido.
export function nivelDePresenca(aluno) {
  if (aluno.diasSemVir === null || aluno.diasSemVir >= DIAS_PARA_SUMIDO) return 'sumido'
  if (aluno.diasSemVir >= 4) return 'atencao'
  return 'ok'
}

// Planilha dos alunos (abre no Excel/Google Planilhas). Ponto e vírgula e BOM para o Excel em português.
export function planilhaDosAlunos(alunos, mes) {
  const celula = (valor) => {
    const texto = String(valor ?? '')
    return /[;"\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }
  const linhas = alunos.map((aluno) => {
    const treino = fichaDoMes(aluno.fichas, mes)
    return [
      aluno.nome,
      aluno.email,
      aluno.telefone,
      `${aluno.checkinsSemana}/${aluno.metaSemanal}`,
      aluno.checkinsMes,
      aluno.ultimoCheckin ? dataCurta(aluno.ultimoCheckin) : 'nunca',
      treino ? `Enviado (até ${dataCurta(treino.fim)})` : 'Falta enviar',
    ]
  })
  const cabecalho = ['Nome', 'E-mail', 'WhatsApp', 'Semana (feitos/meta)', 'Check-ins no mês', 'Última presença', 'Treino do mês']
  return '﻿' + [cabecalho, ...linhas].map((linha) => linha.map(celula).join(';')).join('\r\n')
}
