import { exercicioDoCatalogo } from '../../utils/catalogoExercicios.js'
import { chaveDoDia } from '../../utils/checkins.js'

export const CHAVE_TREINOS = 'home-fit:treinos:v1'

export const EXERCICIOS_DE_EXEMPLO = [
  { id: 'Dumbbell_Bench_Press', nome: 'Supino com halteres', grupo: 'Peito', series: 4, repeticoes: 10, descanso: 90 },
  { id: 'Bent_Over_Barbell_Row', nome: 'Remada curvada com barra', grupo: 'Costas', series: 4, repeticoes: 10, descanso: 90 },
  { id: 'Barbell_Full_Squat', nome: 'Agachamento livre com barra', grupo: 'Pernas', series: 4, repeticoes: 12, descanso: 120 },
  { id: 'Dumbbell_Shoulder_Press', nome: 'Desenvolvimento com halteres', grupo: 'Ombros', series: 3, repeticoes: 12, descanso: 60 },
  { id: 'Incline_Dumbbell_Press', nome: 'Supino inclinado com halteres', grupo: 'Peito', series: 3, repeticoes: 10, descanso: 90 },
  { id: 'Cable_Crossover', nome: 'Crucifixo no cross over', grupo: 'Peito', series: 3, repeticoes: 12, descanso: 60 },
  { id: 'Triceps_Pushdown', nome: 'Tríceps na polia', grupo: 'Tríceps', series: 3, repeticoes: 12, descanso: 60 },
  { id: 'Dips_-_Triceps_Version', nome: 'Mergulho nas paralelas', grupo: 'Tríceps', series: 3, repeticoes: 10, descanso: 75 },
  { id: 'Wide-Grip_Lat_Pulldown', nome: 'Puxada frontal aberta', grupo: 'Costas', series: 4, repeticoes: 10, descanso: 90 },
  { id: 'Seated_Cable_Rows', nome: 'Remada baixa na polia', grupo: 'Costas', series: 3, repeticoes: 12, descanso: 75 },
  { id: 'Barbell_Curl', nome: 'Rosca direta com barra', grupo: 'Bíceps', series: 3, repeticoes: 10, descanso: 60 },
  { id: 'Hammer_Curls', nome: 'Rosca martelo', grupo: 'Bíceps', series: 3, repeticoes: 12, descanso: 60 },
  { id: 'Leg_Press', nome: 'Leg press 45°', grupo: 'Pernas', series: 4, repeticoes: 12, descanso: 90 },
  { id: 'Leg_Extensions', nome: 'Cadeira extensora', grupo: 'Pernas', series: 3, repeticoes: 12, descanso: 60 },
  { id: 'Lying_Leg_Curls', nome: 'Mesa flexora', grupo: 'Posterior', series: 3, repeticoes: 12, descanso: 60 },
  { id: 'Standing_Calf_Raises', nome: 'Panturrilha em pé', grupo: 'Panturrilha', series: 4, repeticoes: 15, descanso: 45 },
  { id: 'Side_Lateral_Raise', nome: 'Elevação lateral', grupo: 'Ombros', series: 3, repeticoes: 12, descanso: 60 },
  { id: 'Reverse_Flyes', nome: 'Crucifixo invertido', grupo: 'Ombros', series: 3, repeticoes: 12, descanso: 60 },
  { id: 'Barbell_Shrug', nome: 'Encolhimento com barra', grupo: 'Trapézio', series: 3, repeticoes: 12, descanso: 60 },
  { id: 'Crunches', nome: 'Abdominal supra', grupo: 'Abdômen', series: 3, repeticoes: 20, descanso: 45 },
  { id: 'Barbell_Hip_Thrust', nome: 'Elevação pélvica com barra', grupo: 'Glúteos', series: 4, repeticoes: 10, descanso: 90 },
  { id: 'Romanian_Deadlift', nome: 'Stiff com barra', grupo: 'Posterior', series: 3, repeticoes: 10, descanso: 90 },
  { id: 'Dumbbell_Lunges', nome: 'Afundo com halteres', grupo: 'Pernas', series: 3, repeticoes: 10, descanso: 75 },
  { id: 'Seated_Calf_Raise', nome: 'Panturrilha sentado', grupo: 'Panturrilha', series: 3, repeticoes: 15, descanso: 45 },
  { id: 'Plank', nome: 'Prancha', grupo: 'Abdômen', series: 3, repeticoes: 30, unidade: 'seg', descanso: 45 },
]

// Divisão de exemplo de segunda (índice 0) a sexta (índice 4).
export const PLANO_SEMANAL = [
  { letra: 'A', foco: 'Peito e tríceps', exercicios: ['Dumbbell_Bench_Press', 'Incline_Dumbbell_Press', 'Cable_Crossover', 'Triceps_Pushdown', 'Dips_-_Triceps_Version'] },
  { letra: 'B', foco: 'Costas e bíceps', exercicios: ['Wide-Grip_Lat_Pulldown', 'Bent_Over_Barbell_Row', 'Seated_Cable_Rows', 'Barbell_Curl', 'Hammer_Curls'] },
  { letra: 'C', foco: 'Pernas completo', exercicios: ['Barbell_Full_Squat', 'Leg_Press', 'Leg_Extensions', 'Lying_Leg_Curls', 'Standing_Calf_Raises'] },
  { letra: 'D', foco: 'Ombros e abdômen', exercicios: ['Dumbbell_Shoulder_Press', 'Side_Lateral_Raise', 'Reverse_Flyes', 'Barbell_Shrug', 'Crunches'] },
  { letra: 'E', foco: 'Glúteos e posterior', exercicios: ['Barbell_Hip_Thrust', 'Romanian_Deadlift', 'Dumbbell_Lunges', 'Seated_Calf_Raise', 'Plank'] },
]

const vazio = () => ({ versao: 1, sessoes: {} })

export const MAXIMO_SERIES = 20

export function exercicioPorId(id) {
  return EXERCICIOS_DE_EXEMPLO.find((exercicio) => exercicio.id === id) ?? exercicioDoCatalogo(id) ?? undefined
}

// Exercício de um registro salvo: do catálogo ou, se for personalizado, pelo nome guardado no registro.
export function exercicioDoRegistro(id, registro) {
  const doCatalogo = exercicioPorId(id)
  if (doCatalogo) return doCatalogo
  if (!registro?.nome) return undefined
  return { id, nome: registro.nome, grupo: registro.grupo ?? '', repeticoes: registro.reps ?? null, unidade: registro.unidade }
}

// "12" → 12, "8-12" → 10, "30" → 30, "até a falha" → null. Usado para calcular volume.
export function repeticoesNumericas(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) && valor > 0 ? valor : null
  const numeros = String(valor ?? '').match(/\d+/g)?.map(Number) ?? []
  if (!numeros.length || /min/i.test(String(valor))) return null
  const media = numeros.length > 1 ? (numeros[0] + numeros[1]) / 2 : numeros[0]
  return media > 0 ? Math.round(media) : null
}

// Entre as fichas do aluno, a que vale no dia (a de início mais recente).
function fichaQueVale(fichas, dia) {
  const lista = Array.isArray(fichas) ? fichas : fichas ? [fichas] : []
  let escolhida = null
  for (const ficha of lista) {
    if (ficha.inicio <= dia && dia <= ficha.fim && (!escolhida || ficha.inicio > escolhida.inicio)) escolhida = ficha
  }
  return escolhida
}

// Com ficha do personal valendo na data, o treino vem dela; senão, do plano padrão A–E.
export function treinoDoDia(data, fichas = null) {
  const indice = (data.getDay() + 6) % 7
  const ficha = fichaQueVale(fichas, chaveDoDia(data))
  if (ficha) {
    const doDia = ficha.treinos.find((treino) => treino.dias.includes(indice))
    if (!doDia || indice > 4) return null
    return {
      letra: doDia.letra,
      foco: doDia.nome || `Treino ${doDia.letra}`,
      indice,
      exercicios: doDia.exercicios,
      personalizado: true,
    }
  }
  return indice < PLANO_SEMANAL.length ? { ...PLANO_SEMANAL[indice], indice } : null
}

const NOMES_DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

// Próximo dia (a partir de amanhã) que tem treino, olhando até duas semanas à frente.
export function proximoTreino(data, fichas = null) {
  for (let passo = 1; passo <= 14; passo++) {
    const dia = new Date(data.getFullYear(), data.getMonth(), data.getDate() + passo, 12)
    const treino = treinoDoDia(dia, fichas)
    if (treino) return { treino, data: dia, nomeDoDia: passo === 1 ? 'amanhã' : NOMES_DIAS[dia.getDay()] }
  }
  return null
}

// Prescrição final de cada exercício: dados do catálogo + o que o personal definiu na ficha.
export function exerciciosDoTreino(treino) {
  if (!treino) return []
  if (!treino.personalizado) return treino.exercicios.map(exercicioPorId).filter(Boolean)
  return treino.exercicios.map((item) => {
    const base = exercicioPorId(item.id) ?? {}
    return {
      ...base,
      id: item.id,
      nome: item.nome || base.nome || 'Exercício',
      grupo: item.grupo || base.grupo || '',
      series: item.series,
      repeticoes: item.repeticoes,
      descanso: item.descanso,
      carga: item.carga || '',
      observacao: item.observacao || '',
      fotoPersonal: item.imagem || '',
      video: item.video || '',
      unidade: base.unidade,
    }
  })
}

// O que vale guardar junto do registro para o histórico funcionar mesmo se a ficha mudar.
function retratoDoExercicio(exercicio) {
  if (!exercicio) return {}
  const reps = repeticoesNumericas(exercicio.repeticoes)
  return {
    nome: exercicio.nome,
    ...(exercicio.grupo ? { grupo: exercicio.grupo } : {}),
    ...(reps ? { reps } : {}),
    ...(exercicio.unidade === 'seg' ? { unidade: 'seg' } : {}),
  }
}

export function duracaoEstimada(exercicios) {
  const segundos = exercicios.reduce((total, exercicio) =>
    total + exercicio.series * (45 + exercicio.descanso), 0)
  return Math.max(5, Math.round(segundos / 300) * 5)
}

function objeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor)
}

function timestamp(valor) {
  return Number.isFinite(valor) && valor > 0
}

export function validarTreinos(dados) {
  if (!objeto(dados) || dados.versao !== 1 || !objeto(dados.sessoes)) {
    throw new Error('Formato de histórico inválido.')
  }
  for (const [dia, sessao] of Object.entries(dados.sessoes)) {
    const data = new Date(`${dia}T12:00:00`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || !Number.isFinite(data.getTime()) ||
        chaveDoDia(data) !== dia || !objeto(sessao) ||
        !objeto(sessao.exercicios) ||
        (sessao.inicio !== null && !timestamp(sessao.inicio)) ||
        (sessao.fim !== null && (!timestamp(sessao.fim) || (sessao.inicio !== null && sessao.fim < sessao.inicio)))) {
      throw new Error('Sessão salva inválida.')
    }
    for (const [id, registro] of Object.entries(sessao.exercicios)) {
      // Exercício do catálogo ou personalizado da ficha (que guarda o próprio nome).
      const conhecido = exercicioPorId(id) || (objeto(registro) && typeof registro.nome === 'string' && registro.nome.trim())
      if (!conhecido || !objeto(registro) || !Array.isArray(registro.series) ||
          new Set(registro.series).size !== registro.series.length ||
          registro.series.some((serie) => !Number.isInteger(serie) || serie < 1 || serie > MAXIMO_SERIES) ||
          (registro.carga !== null && (!Number.isFinite(registro.carga) || registro.carga < 0)) ||
          (registro.reps !== undefined && (!Number.isFinite(registro.reps) || registro.reps <= 0))) {
        throw new Error('Registro de exercício inválido.')
      }
    }
  }
  return dados
}

export function lerTreinosSalvos() {
  try {
    const salvo = window.localStorage.getItem(CHAVE_TREINOS)
    return salvo ? validarTreinos(JSON.parse(salvo)) : vazio()
  } catch {
    return vazio()
  }
}

export function carregarTreinos(armazenamento, dias) {
  const salvo = armazenamento.getItem(CHAVE_TREINOS)
  const dados = salvo ? validarTreinos(JSON.parse(salvo)) : vazio()
  for (const data of dias) {
    const dia = chaveDoDia(data)
    if (dados.sessoes[dia]) continue
    const anterior = armazenamento.getItem(`home-fit:exercicios-concluidos:${dia}`)
    if (!anterior) continue
    const ids = JSON.parse(anterior)
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
      throw new Error('Progresso anterior inválido.')
    }
    dados.sessoes[dia] = {
      inicio: null,
      fim: null,
      exercicios: Object.fromEntries(EXERCICIOS_DE_EXEMPLO.filter((exercicio) =>
        ids.includes(exercicio.id),
      ).map((exercicio) => [exercicio.id, {
        series: Array.from({ length: exercicio.series }, (_, indice) => indice + 1),
        carga: null,
      }])),
    }
  }
  return dados
}

export function registroDoExercicio(sessao, id) {
  return sessao?.exercicios[id] ?? { series: [], carga: null }
}

export function proximaSerie(sessao, exercicio) {
  const registro = registroDoExercicio(sessao, exercicio.id)
  for (let numero = 1; numero <= exercicio.series; numero++) {
    if (!registro.series.includes(numero)) return numero
  }
  return null
}

export function iniciarSessao(dados, dia, agora = Date.now()) {
  const sessao = dados.sessoes[dia] ?? { inicio: null, fim: null, exercicios: {} }
  if (sessao.fim) throw new Error('Este treino já foi encerrado.')
  if (sessao.inicio !== null) return dados
  return {
    ...dados,
    sessoes: {
      ...dados.sessoes,
      [dia]: { ...sessao, inicio: agora },
    },
  }
}

export function atualizarSerie(dados, dia, exercicio, numero, agora = Date.now()) {
  const sessao = dados.sessoes[dia] ?? { inicio: null, fim: null, exercicios: {} }
  if (sessao.fim) throw new Error('Este treino já foi encerrado.')
  if (!Number.isInteger(numero) || numero < 1 || numero > exercicio.series) {
    throw new Error('Série inválida.')
  }
  const registro = registroDoExercicio(sessao, exercicio.id)
  const series = registro.series.includes(numero)
    ? registro.series.filter((serie) => serie !== numero)
    : [...registro.series, numero].sort((a, b) => a - b)
  return {
    ...dados,
    sessoes: {
      ...dados.sessoes,
      [dia]: {
        ...sessao,
        inicio: sessao.inicio ?? agora,
        exercicios: { ...sessao.exercicios, [exercicio.id]: { ...registro, ...retratoDoExercicio(exercicio), series } },
      },
    },
  }
}

export function atualizarCarga(dados, dia, id, carga, exercicio = null) {
  if (carga !== null && (!Number.isFinite(carga) || carga < 0)) {
    throw new Error('Informe uma carga válida, igual ou maior que zero.')
  }
  const sessao = dados.sessoes[dia] ?? { inicio: null, fim: null, exercicios: {} }
  if (sessao.fim) throw new Error('Este treino já foi encerrado.')
  return {
    ...dados,
    sessoes: {
      ...dados.sessoes,
      [dia]: {
        ...sessao,
        exercicios: {
          ...sessao.exercicios,
          [id]: { ...registroDoExercicio(sessao, id), ...retratoDoExercicio(exercicio), carga },
        },
      },
    },
  }
}

export function encerrarSessao(dados, dia, exercicios, agora = Date.now()) {
  const sessao = dados.sessoes[dia]
  if (!sessao || !exercicios.length || exercicios.some((exercicio) =>
    registroDoExercicio(sessao, exercicio.id).series.length !== exercicio.series,
  )) throw new Error('Conclua todas as séries antes de encerrar o treino.')
  if (sessao.fim) throw new Error('Este treino já foi encerrado.')
  return {
    ...dados,
    sessoes: {
      ...dados.sessoes,
      [dia]: { ...sessao, fim: agora },
    },
  }
}

export function ultimaCarga(dados, dia, id) {
  const anterior = Object.entries(dados.sessoes)
    .filter(([data, sessao]) => data < dia && sessao.fim && registroDoExercicio(sessao, id).carga !== null)
    .sort(([a], [b]) => b.localeCompare(a))[0]
  return anterior ? registroDoExercicio(anterior[1], id).carga : null
}

export function sessoesFinalizadas(dados) {
  return Object.entries(dados.sessoes)
    .filter(([, sessao]) => sessao.fim)
    .sort(([a], [b]) => b.localeCompare(a))
}

// Maior carga registrada em treinos finalizados antes da data informada.
export function melhorCarga(dados, id, antesDe = '9999-12-31') {
  let melhor = null
  for (const [dia, sessao] of sessoesFinalizadas(dados)) {
    const carga = registroDoExercicio(sessao, id).carga
    if (dia < antesDe && carga !== null && (melhor === null || carga > melhor)) melhor = carga
  }
  return melhor
}

export function ehRecorde(dados, dia, id, carga) {
  const anterior = melhorCarga(dados, id, dia)
  return carga !== null && carga > 0 && anterior !== null && carga > anterior
}

export function recordesDaSessao(dados, dia) {
  const sessao = dados.sessoes[dia]
  if (!sessao) return []
  return Object.entries(sessao.exercicios)
    .filter(([id, registro]) => exercicioDoRegistro(id, registro) && ehRecorde(dados, dia, id, registro.carga))
    .map(([id, registro]) => ({
      exercicio: exercicioDoRegistro(id, registro),
      carga: registro.carga,
      anterior: melhorCarga(dados, id, dia),
    }))
}

export function recordesPessoais(dados) {
  const melhores = new Map()
  for (const [dia, sessao] of sessoesFinalizadas(dados)) {
    for (const [id, registro] of Object.entries(sessao.exercicios)) {
      const exercicio = exercicioDoRegistro(id, registro)
      const atual = melhores.get(id)
      if (!exercicio || registro.carga === null || registro.carga <= 0) continue
      if (!atual || registro.carga > atual.carga || (registro.carga === atual.carga && dia < atual.dia)) {
        melhores.set(id, { exercicio, carga: registro.carga, dia })
      }
    }
  }
  return [...melhores.values()].sort((a, b) => b.carga - a.carga)
}

// Volume = carga × repetições × séries feitas (exercícios por tempo não entram).
export function volumeDaSessao(sessao) {
  if (!sessao) return 0
  return Object.entries(sessao.exercicios).reduce((total, [id, registro]) => {
    const exercicio = exercicioDoRegistro(id, registro)
    // Repetições da prescrição usada no dia (ficha do personal) ou do catálogo.
    const reps = registro.reps ?? repeticoesNumericas(exercicio?.repeticoes)
    if (!exercicio || exercicio.unidade === 'seg' || registro.unidade === 'seg' || !registro.carga || !reps) return total
    return total + registro.carga * reps * registro.series.length
  }, 0)
}

export function formatarPeso(kg) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(kg)
}

export function formatarVolume(kg) {
  return kg >= 1000
    ? `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(kg / 1000)} t`
    : `${formatarPeso(kg)} kg`
}

export function segundosRestantes(descanso, agora) {
  return descanso.terminaEm === null
    ? descanso.restante
    : Math.max(0, Math.ceil((descanso.terminaEm - agora) / 1000))
}

export function formatarTempo(segundos) {
  return `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`
}
