// Busca de exercícios (nome, grupo muscular e foto) usada pelo app.
// A mesma lógica serve o servidor local (server/index.js) e a função da Vercel (api/exercises.js).
import { readFileSync } from 'node:fs'

const exercises = JSON.parse(readFileSync(new URL('./data/exercises.json', import.meta.url), 'utf8'))
  .filter((exercise) => typeof exercise.images?.[0] === 'string')
const imageBaseUrl = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

const GRUPOS_MUSCULARES = {
  back: ['lats', 'lower back', 'middle back', 'traps'],
  cardio: [],
  chest: ['chest'],
  'lower arms': ['forearms'],
  'lower legs': ['calves'],
  neck: ['neck'],
  shoulders: ['shoulders'],
  'upper arms': ['biceps', 'triceps'],
  'upper legs': ['adductors', 'abductors', 'glutes', 'hamstrings', 'quadriceps'],
  waist: ['abdominals'],
}

function erro(status, code, message) {
  return { status, corpo: { error: { code, message } } }
}

function gruposDoExercicio(exercicio) {
  if (exercicio.category === 'cardio') return ['cardio']

  const musculos = exercicio.primaryMuscles || []
  return Object.entries(GRUPOS_MUSCULARES)
    .filter(([, nomes]) => nomes.some((nome) => musculos.includes(nome)))
    .map(([grupo]) => grupo)
}

function imagemDoExercicio(exercicio) {
  const caminho = exercicio.images?.[0]
  if (typeof caminho !== 'string' || caminho.split('/').some((parte) => parte === '..')) {
    return ''
  }

  const caminhoSeguro = caminho.split('/').map(encodeURIComponent).join('/')
  return `${imageBaseUrl}/${caminhoSeguro}`
}

// Recebe os parâmetros da URL e devolve { status, corpo }.
export function buscarExercicios(query = {}) {
  const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '')
  const limit = Number.parseInt(query.limit, 10) || 24
  const offset = Number.parseInt(query.offset, 10) || 0
  const bodyPart = texto(query.bodyPart)
  const name = texto(query.name)
  const ids = typeof query.ids === 'string'
    ? query.ids.split(',').map((id) => id.trim()).filter(Boolean)
    : []

  if (limit < 1 || limit > 30 || offset < 0) {
    return erro(400, 'INVALID_PAGINATION', 'A paginação solicitada é inválida.')
  }

  if (bodyPart && !/^[a-z ]+$/i.test(bodyPart)) {
    return erro(400, 'INVALID_BODY_PART', 'O grupo muscular solicitado é inválido.')
  }

  if (bodyPart && !Object.hasOwn(GRUPOS_MUSCULARES, bodyPart.toLowerCase())) {
    return erro(400, 'INVALID_BODY_PART', 'O grupo muscular solicitado é inválido.')
  }

  if (name.length > 80) {
    return erro(400, 'INVALID_SEARCH', 'A busca deve ter até 80 caracteres.')
  }

  if (ids.length > 30 || ids.some((id) => !/^[a-z0-9_-]{1,100}$/i.test(id))) {
    return erro(400, 'INVALID_EXERCISE_IDS', 'A lista de exercícios solicitada é inválida.')
  }

  const termo = name.toLocaleLowerCase()
  const filtrados = exercises.filter((exercicio) => {
    if (ids.length && !ids.includes(exercicio.id)) return false
    const correspondeAoGrupo = !bodyPart || gruposDoExercicio(exercicio).includes(bodyPart.toLowerCase())
    const busca = [
      exercicio.name,
      exercicio.equipment,
      ...(exercicio.primaryMuscles || []),
      ...(exercicio.secondaryMuscles || []),
    ].join(' ').toLocaleLowerCase()

    return correspondeAoGrupo && (!termo || busca.includes(termo))
  })

  const pagina = ids.length
    ? ids.map((id) => filtrados.find((exercicio) => exercicio.id === id)).filter(Boolean)
    : filtrados.slice(offset, offset + limit)
  return {
    status: 200,
    corpo: {
      data: pagina.map((exercicio) => ({
        id: exercicio.id,
        name: exercicio.name,
        bodyPart: gruposDoExercicio(exercicio)[0] || 'strength',
        target: exercicio.primaryMuscles?.[0] || '',
        equipment: exercicio.equipment || 'Não especificado',
        imageUrl: imagemDoExercicio(exercicio),
      })),
      hasMore: offset + pagina.length < filtrados.length,
      total: filtrados.length,
    },
  }
}
