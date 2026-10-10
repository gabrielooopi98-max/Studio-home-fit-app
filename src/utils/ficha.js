// Fichas de treino montadas pelo personal: criação, cópia, renovação e validação.
import { EXERCICIOS_DE_EXEMPLO, PLANO_SEMANAL, exercicioPorId } from '../componentes/area-treinos/treinoLocal.js'
import { chaveDoDia } from './checkins.js'
import { linkValido } from './midia.js'

export const DIAS_UTEIS = [
  { indice: 0, curto: 'Seg', nome: 'Segunda' },
  { indice: 1, curto: 'Ter', nome: 'Terça' },
  { indice: 2, curto: 'Qua', nome: 'Quarta' },
  { indice: 3, curto: 'Qui', nome: 'Quinta' },
  { indice: 4, curto: 'Sex', nome: 'Sexta' },
]

export const OBJETIVOS = ['Hipertrofia', 'Emagrecimento', 'Força', 'Condicionamento', 'Saúde e bem-estar', 'Reabilitação']
export const DESCANSOS = [0, 30, 45, 60, 75, 90, 120, 150, 180]
export const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F']
export const MAXIMO_TREINOS = LETRAS.length
export const DURACAO_PADRAO = 30

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export function somarDias(dia, dias) {
  const data = new Date(`${dia}T12:00:00`)
  data.setDate(data.getDate() + dias)
  return chaveDoDia(data)
}

export function diasEntre(de, ate) {
  return Math.round((new Date(`${ate}T12:00:00`) - new Date(`${de}T12:00:00`)) / 86400000)
}

export function dataCurta(dia) {
  const [, mes, d] = dia.split('-')
  return `${d}/${mes}`
}

export function tituloPadrao(objetivo, inicio) {
  const mes = MESES[Number(inicio.slice(5, 7)) - 1]
  return `${objetivo || 'Treino'} · ${mes}`
}

export function novoTreino(indice) {
  return { letra: LETRAS[indice] ?? 'A', nome: '', dias: [], exercicios: [] }
}

export function novaFicha(alunoId, hoje) {
  return {
    aluno_id: alunoId,
    titulo: '',
    objetivo: 'Hipertrofia',
    inicio: hoje,
    fim: somarDias(hoje, DURACAO_PADRAO - 1),
    observacoes: '',
    treinos: [novoTreino(0)],
  }
}

export function itemDoCatalogo(exercicio) {
  return {
    id: exercicio.id,
    nome: exercicio.nome,
    grupo: exercicio.grupo,
    series: exercicio.series,
    repeticoes: String(exercicio.repeticoes),
    descanso: exercicio.descanso,
    carga: '',
    observacao: '',
  }
}

// Exercício que não está no catálogo: o personal digita o nome.
export function itemPersonalizado(nome, sufixo = Math.random().toString(36).slice(2, 7)) {
  const base = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
  return {
    id: `livre-${base || 'exercicio'}-${sufixo}`,
    nome: nome.trim(),
    grupo: '',
    series: 3,
    repeticoes: '12',
    descanso: 60,
    carga: '',
    observacao: '',
  }
}

// Ponto de partida: o plano padrão A–E da academia, um treino por dia útil.
export function fichaDoPlanoPadrao(alunoId, hoje) {
  return {
    ...novaFicha(alunoId, hoje),
    treinos: PLANO_SEMANAL.map((treino, indice) => ({
      letra: treino.letra,
      nome: treino.foco,
      dias: [indice],
      exercicios: treino.exercicios.map((id) => itemDoCatalogo(EXERCICIOS_DE_EXEMPLO.find((e) => e.id === id) ?? exercicioPorId(id))),
    })),
  }
}

// Copia os treinos de uma ficha (de outro aluno ou de um mês anterior) para um aluno, com datas novas.
export function copiarFicha(ficha, alunoId, inicio) {
  const duracao = Math.max(1, diasEntre(ficha.inicio, ficha.fim) + 1)
  return {
    aluno_id: alunoId,
    titulo: '',
    objetivo: ficha.objetivo,
    inicio,
    fim: somarDias(inicio, duracao - 1),
    observacoes: ficha.observacoes,
    treinos: structuredClone(ficha.treinos),
  }
}

// Renovar: mesma ficha, começando no dia seguinte ao fim (ou hoje, se já venceu).
export function renovarFicha(ficha, hoje) {
  const inicio = ficha.fim >= hoje ? somarDias(ficha.fim, 1) : hoje
  return { ...copiarFicha(ficha, ficha.aluno_id, inicio), titulo: '' }
}

export function estadoDaFicha(ficha, hoje) {
  if (!ficha) return { estado: 'sem', texto: 'Sem ficha' }
  if (ficha.inicio > hoje) return { estado: 'futura', texto: `Começa ${dataCurta(ficha.inicio)}` }
  if (ficha.fim < hoje) return { estado: 'vencida', texto: `Venceu ${dataCurta(ficha.fim)}` }
  const restantes = diasEntre(hoje, ficha.fim)
  if (restantes <= 7) return { estado: 'vencendo', texto: restantes === 0 ? 'Vence hoje' : `Vence em ${restantes} ${restantes === 1 ? 'dia' : 'dias'}`, restantes }
  return { estado: 'vigente', texto: `Até ${dataCurta(ficha.fim)}`, restantes }
}

// Ficha que vale no dia (a de início mais recente, se houver mais de uma).
export function fichaDoDia(fichas, dia) {
  return (fichas ?? [])
    .filter((ficha) => ficha.inicio <= dia && dia <= ficha.fim)
    .sort((a, b) => b.inicio.localeCompare(a.inicio))[0] ?? null
}

export function diasDoTreinoTexto(dias) {
  if (!dias.length) return 'Sem dia definido'
  return [...dias].sort().map((indice) => DIAS_UTEIS[indice]?.curto).join(', ')
}

const limpar = (texto, maximo) => String(texto ?? '').trim().slice(0, maximo)

// Confere tudo antes de salvar. Devolve a ficha normalizada ou a lista de problemas.
export function validarFicha(ficha) {
  const erros = []
  const inicio = ficha.inicio
  const fim = ficha.fim
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(fim ?? '')) {
    erros.push('Defina a data de início e de fim da ficha.')
  } else if (fim < inicio) {
    erros.push('A data de fim precisa ser depois do início.')
  } else if (diasEntre(inicio, fim) > 366) {
    erros.push('A ficha pode durar no máximo 1 ano.')
  }

  if (!ficha.treinos?.length) erros.push('Adicione pelo menos um treino.')
  if (ficha.treinos?.length > MAXIMO_TREINOS) erros.push(`Use no máximo ${MAXIMO_TREINOS} treinos.`)

  const donoDoDia = new Map()
  const treinos = (ficha.treinos ?? []).map((treino, indice) => {
    const letra = LETRAS[indice]
    if (!treino.exercicios.length) erros.push(`Treino ${letra}: adicione pelo menos um exercício.`)
    if (!treino.dias.length) erros.push(`Treino ${letra}: escolha em quais dias ele é feito.`)
    for (const dia of treino.dias) {
      if (donoDoDia.has(dia)) {
        erros.push(`${DIAS_UTEIS[dia].nome} está no treino ${donoDoDia.get(dia)} e no ${letra}. Cada dia só pode ter um treino.`)
      } else {
        donoDoDia.set(dia, letra)
      }
    }
    const vistos = new Set()
    const exercicios = treino.exercicios.map((item, posicao) => {
      const nome = limpar(item.nome, 60)
      const series = Number(item.series)
      const descanso = Number(item.descanso)
      const repeticoes = limpar(item.repeticoes, 20)
      const rotulo = `Treino ${letra}, exercício ${posicao + 1}${nome ? ` (${nome})` : ''}`
      if (!nome) erros.push(`${rotulo}: falta o nome.`)
      if (!Number.isInteger(series) || series < 1 || series > 10) erros.push(`${rotulo}: séries entre 1 e 10.`)
      if (!repeticoes) erros.push(`${rotulo}: informe as repetições (ex.: 12 ou 8-10).`)
      if (!Number.isInteger(descanso) || descanso < 0 || descanso > 600) erros.push(`${rotulo}: descanso inválido.`)
      if (vistos.has(item.id)) erros.push(`Treino ${letra}: ${nome} aparece duas vezes.`)
      const imagem = limpar(item.imagem, 500)
      const video = limpar(item.video, 500)
      if (imagem && !linkValido(imagem)) erros.push(`${rotulo}: a foto não carregou direito. Envie de novo.`)
      if (video && !linkValido(video)) erros.push(`${rotulo}: o link do vídeo precisa começar com https://`)
      vistos.add(item.id)
      return {
        id: item.id,
        nome,
        grupo: limpar(item.grupo, 30),
        series,
        repeticoes,
        descanso,
        carga: limpar(item.carga, 30),
        observacao: limpar(item.observacao, 300),
        // Foto e vídeo só entram quando existem, para a ficha não carregar campos vazios.
        ...(imagem ? { imagem } : {}),
        ...(video ? { video } : {}),
      }
    })
    return {
      letra,
      nome: limpar(treino.nome, 40),
      dias: [...new Set(treino.dias)].filter((dia) => dia >= 0 && dia <= 4).sort(),
      exercicios,
    }
  })

  if (erros.length) return { erros }
  const objetivo = limpar(ficha.objetivo, 40)
  return {
    erros: [],
    ficha: {
      ...(ficha.id ? { id: ficha.id } : {}),
      aluno_id: ficha.aluno_id,
      titulo: limpar(ficha.titulo, 60) || tituloPadrao(objetivo, inicio),
      objetivo,
      inicio,
      fim,
      observacoes: limpar(ficha.observacoes, 1000),
      treinos,
    },
  }
}

// ---------------------------------------------------------------- modelos de treino

export function modeloDaFicha(ficha, nome) {
  return {
    nome: String(nome ?? '').trim().slice(0, 60) || ficha.titulo,
    objetivo: ficha.objetivo ?? '',
    observacoes: ficha.observacoes ?? '',
    duracao_dias: Math.min(366, Math.max(1, diasEntre(ficha.inicio, ficha.fim) + 1)),
    treinos: structuredClone(ficha.treinos),
  }
}

export function fichaDoModelo(modelo, alunoId, inicio) {
  return {
    aluno_id: alunoId,
    titulo: '',
    objetivo: modelo.objetivo,
    inicio,
    fim: somarDias(inicio, (modelo.duracao_dias ?? DURACAO_PADRAO) - 1),
    observacoes: modelo.observacoes,
    treinos: structuredClone(modelo.treinos),
  }
}

// ---------------------------------------------------------------- treino do mês
// Mês no formato 'AAAA-MM'.

export function mesDe(dia) {
  return dia.slice(0, 7)
}

export function somarMeses(mes, quantidade) {
  const [ano, numero] = mes.split('-').map(Number)
  const data = new Date(ano, numero - 1 + quantidade, 1)
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
}

export function limitesDoMes(mes) {
  const [ano, numero] = mes.split('-').map(Number)
  const ultimo = new Date(ano, numero, 0).getDate()
  return { inicio: `${mes}-01`, fim: `${mes}-${String(ultimo).padStart(2, '0')}` }
}

export function nomeDoMes(mes, { ano = false } = {}) {
  const nome = MESES[Number(mes.slice(5, 7)) - 1]
  return ano ? `${nome} de ${mes.slice(0, 4)}` : nome
}

// Perto do fim do mês, o que o personal está preparando já é o treino do mês seguinte.
export function mesSugerido(hoje) {
  return Number(hoje.slice(8, 10)) >= 25 ? somarMeses(mesDe(hoje), 1) : mesDe(hoje)
}

function diasEmComum(ficha, inicio, fim) {
  const de = ficha.inicio > inicio ? ficha.inicio : inicio
  const ate = ficha.fim < fim ? ficha.fim : fim
  return ate < de ? 0 : diasEntre(de, ate) + 1
}

// O treino "do mês" é o que vale na maior parte dele (ex.: 30/09 a 30/10 conta como o de outubro).
export function fichaDoMes(fichas, mes) {
  const { inicio, fim } = limitesDoMes(mes)
  const metade = (diasEntre(inicio, fim) + 1) / 2
  return (fichas ?? [])
    .filter((ficha) => diasEmComum(ficha, inicio, fim) >= metade)
    .sort((a, b) => b.inicio.localeCompare(a.inicio))[0] ?? null
}

// O último treino que o aluno recebeu antes do do mês (para "repetir o último treino").
export function fichaAnteriorAoMes(fichas, mes) {
  const doMes = fichaDoMes(fichas, mes)
  const { inicio } = limitesDoMes(mes)
  return (fichas ?? [])
    .filter((ficha) => ficha !== doMes && ficha.inicio < (doMes?.inicio ?? inicio))
    .sort((a, b) => b.inicio.localeCompare(a.inicio))[0] ?? null
}

// Coloca uma ficha nova (sem id) exatamente no período do mês.
export function noMes(ficha, mes) {
  return { ...ficha, ...limitesDoMes(mes), titulo: '' }
}

export function textoDescanso(segundos) {
  if (!segundos) return 'Sem descanso'
  if (segundos < 60) return `${segundos} s`
  const minutos = Math.floor(segundos / 60)
  const resto = segundos % 60
  return resto ? `${minutos}:${String(resto).padStart(2, '0')} min` : `${minutos} min`
}
