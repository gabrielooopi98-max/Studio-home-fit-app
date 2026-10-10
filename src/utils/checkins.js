export const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const PREFIXO_CHECKINS = 'home-fit:checkins:'

export function chaveDoDia(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function chaveDoMes(data) {
  return chaveDoDia(data).slice(0, 7)
}

export function inicioDaSemana(data) {
  const segunda = new Date(data.getFullYear(), data.getMonth(), data.getDate(), 12)
  segunda.setDate(segunda.getDate() - ((segunda.getDay() + 6) % 7))
  return segunda
}

export function diasDaSemana() {
  const segunda = inicioDaSemana(new Date())

  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(segunda)
    dia.setDate(segunda.getDate() + i)
    return dia
  })
}

// Junta os check-ins de todos os meses salvos (cada mês fica em uma chave própria).
export function carregarCheckins(armazenamento) {
  const todos = []
  for (let i = 0; i < armazenamento.length; i++) {
    const chave = armazenamento.key(i)
    if (!chave?.startsWith(PREFIXO_CHECKINS)) continue
    const lista = JSON.parse(armazenamento.getItem(chave))
    if (!Array.isArray(lista) || !lista.every((data) => typeof data === 'string')) {
      throw new Error('Formato de check-ins inválido')
    }
    todos.push(...lista)
  }
  return [...new Set(todos)].sort()
}

export function salvarCheckin(armazenamento, checkins, data) {
  const mes = data.slice(0, 7)
  const doMes = checkins.filter((dia) => dia.startsWith(`${mes}-`))
  armazenamento.setItem(`${PREFIXO_CHECKINS}${mes}`, JSON.stringify([...doMes, data]))
}

export function checkinsPorSemana(checkins) {
  const contagem = new Map()
  for (const dia of checkins) {
    const semana = chaveDoDia(inicioDaSemana(new Date(`${dia}T12:00:00`)))
    contagem.set(semana, (contagem.get(semana) || 0) + 1)
  }
  return contagem
}

// Semanas seguidas batendo a meta. A semana atual só soma quando a meta é batida,
// mas não quebra a sequência enquanto ainda está em andamento.
export function sequenciaDeSemanas(checkins, meta, hoje = new Date()) {
  if (!checkins.length) return { atual: 0, melhor: 0 }
  const contagem = checkinsPorSemana(checkins)
  const semanaAtual = chaveDoDia(inicioDaSemana(hoje))
  const semana = inicioDaSemana(new Date(`${checkins[0]}T12:00:00`))
  let atual = 0
  let melhor = 0

  while (chaveDoDia(semana) <= semanaAtual) {
    const chave = chaveDoDia(semana)
    if ((contagem.get(chave) || 0) >= meta) atual++
    else if (chave !== semanaAtual) atual = 0
    melhor = Math.max(melhor, atual)
    semana.setDate(semana.getDate() + 7)
  }

  return { atual, melhor }
}

export function ultimasSemanas(checkins, quantidade, hoje = new Date()) {
  const contagem = checkinsPorSemana(checkins)
  const semana = inicioDaSemana(hoje)
  semana.setDate(semana.getDate() - 7 * (quantidade - 1))
  return Array.from({ length: quantidade }, () => {
    const inicio = new Date(semana)
    semana.setDate(semana.getDate() + 7)
    return { inicio, total: contagem.get(chaveDoDia(inicio)) || 0 }
  })
}
