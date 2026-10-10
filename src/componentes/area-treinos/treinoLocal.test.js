import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CHAVE_TREINOS, EXERCICIOS_DE_EXEMPLO, atualizarCarga, atualizarSerie,
  carregarTreinos, encerrarSessao, iniciarSessao, proximaSerie, registroDoExercicio, segundosRestantes,
  ultimaCarga, validarTreinos, PLANO_SEMANAL, ehRecorde, exerciciosDoTreino, melhorCarga,
  recordesDaSessao, recordesPessoais, treinoDoDia, volumeDaSessao,
} from './treinoLocal.js'

const vazio = () => ({ versao: 1, sessoes: {} })
const exemplo = EXERCICIOS_DE_EXEMPLO[0]

test('inicia sessão sem marcar séries e retoma sem reiniciar o horário', () => {
  const comCarga = atualizarCarga(vazio(), '2026-10-05', exemplo.id, 12.5)
  const iniciado = iniciarSessao(comCarga, '2026-10-05', 1000)
  assert.equal(iniciado.sessoes['2026-10-05'].inicio, 1000)
  assert.deepEqual(registroDoExercicio(iniciado.sessoes['2026-10-05'], exemplo.id), {
    carga: 12.5, series: [],
  })
  assert.equal(iniciarSessao(iniciado, '2026-10-05', 5000), iniciado)
  assert.equal(iniciado.sessoes['2026-10-06'], undefined)
  assert.deepEqual(validarTreinos(JSON.parse(JSON.stringify(iniciado))), iniciado)
})

test('a próxima série respeita marcações fora de ordem e desfazer', () => {
  let dados = vazio()
  assert.equal(proximaSerie(undefined, exemplo), 1)
  dados = atualizarSerie(dados, '2026-10-05', exemplo, 2, 1000)
  assert.equal(proximaSerie(dados.sessoes['2026-10-05'], exemplo), 1)
  for (const numero of [1, 3, 4]) {
    dados = atualizarSerie(dados, '2026-10-05', exemplo, numero, 1000)
  }
  assert.equal(proximaSerie(dados.sessoes['2026-10-05'], exemplo), null)
  dados = atualizarSerie(dados, '2026-10-05', exemplo, 2, 2000)
  assert.equal(proximaSerie(dados.sessoes['2026-10-05'], exemplo), 2)
})

test('marca séries individualmente, desfaz e separa as datas', () => {
  const dados = atualizarSerie(vazio(), '2026-10-05', exemplo, 1, 1000)
  assert.deepEqual(registroDoExercicio(dados.sessoes['2026-10-05'], exemplo.id).series, [1])
  assert.equal(dados.sessoes['2026-10-06'], undefined)
  const desfeito = atualizarSerie(dados, '2026-10-05', exemplo, 1, 2000)
  assert.deepEqual(registroDoExercicio(desfeito.sessoes['2026-10-05'], exemplo.id).series, [])
  assert.equal(desfeito.sessoes['2026-10-05'].inicio, 1000)
})

test('carga aceita zero, decimais e campo vazio; rejeita valores inválidos', () => {
  for (const carga of [0, 12.5, null]) {
    const dados = atualizarCarga(vazio(), '2026-10-05', exemplo.id, carga)
    assert.equal(registroDoExercicio(dados.sessoes['2026-10-05'], exemplo.id).carga, carga)
  }
  for (const carga of [-1, NaN, Infinity]) {
    assert.throws(() => atualizarCarga(vazio(), '2026-10-05', exemplo.id, carga))
  }
})

test('somente encerra após todas as séries e mantém duração e cargas', () => {
  let dados = atualizarCarga(vazio(), '2026-10-05', exemplo.id, 18)
  assert.throws(() => encerrarSessao(dados, '2026-10-05', EXERCICIOS_DE_EXEMPLO, 2000))
  for (const exercicio of EXERCICIOS_DE_EXEMPLO) {
    for (let numero = 1; numero <= exercicio.series; numero++) {
      dados = atualizarSerie(dados, '2026-10-05', exercicio, numero, 1000)
    }
  }
  dados = encerrarSessao(dados, '2026-10-05', EXERCICIOS_DE_EXEMPLO, 61000)
  assert.equal(dados.sessoes['2026-10-05'].fim - dados.sessoes['2026-10-05'].inicio, 60000)
  assert.equal(ultimaCarga(dados, '2026-10-06', exemplo.id), 18)
  assert.equal(ultimaCarga(dados, '2026-10-05', exemplo.id), null)
  assert.throws(() => atualizarSerie(dados, '2026-10-05', exemplo, 1))
  assert.throws(() => atualizarCarga(dados, '2026-10-05', exemplo.id, 10))
  assert.throws(() => iniciarSessao(dados, '2026-10-05', 70000))
  assert.throws(() => encerrarSessao(dados, '2026-10-05', EXERCICIOS_DE_EXEMPLO))
  assert.deepEqual(validarTreinos(JSON.parse(JSON.stringify(dados))), dados)
})

test('migra conclusão antiga sem inventar carga ou tempo', () => {
  const armazenamento = { getItem: (chave) => chave.endsWith('2026-10-05') ? JSON.stringify([exemplo.id]) : null }
  const dados = carregarTreinos(armazenamento, [new Date(2026, 9, 5)])
  assert.deepEqual(dados.sessoes['2026-10-05'].exercicios[exemplo.id], { series: [1, 2, 3, 4], carga: null })
  assert.equal(dados.sessoes['2026-10-05'].inicio, null)
  assert.equal(dados.sessoes['2026-10-05'].fim, null)
  const finalizado = encerrarSessao(dados, '2026-10-05', [exemplo], 1000)
  assert.equal(finalizado.sessoes['2026-10-05'].inicio, null)
  assert.deepEqual(validarTreinos(finalizado), finalizado)
})

test('histórico existente prevalece sobre progresso antigo e corrupção é explícita', () => {
  const dados = atualizarSerie(vazio(), '2026-10-05', exemplo, 1, 1000)
  const armazenamento = {
    getItem: (chave) => chave === CHAVE_TREINOS ? JSON.stringify(dados) : JSON.stringify([exemplo.id]),
  }
  assert.deepEqual(carregarTreinos(armazenamento, [new Date(2026, 9, 5)]), dados)
  assert.throws(() => carregarTreinos({ getItem: () => '{"invalid":true}' }, []))
  assert.throws(() => carregarTreinos({ getItem: () => { throw new Error('Acesso negado') } }, []))
})

test('descanso calcula pelo horário, mantém pausa e chega a zero sem negativos', () => {
  const descanso = { terminaEm: 91000, restante: 90 }
  assert.equal(segundosRestantes(descanso, 1000), 90)
  assert.equal(segundosRestantes(descanso, 61000), 30)
  assert.equal(segundosRestantes(descanso, 93000), 0)
  assert.equal(segundosRestantes({ terminaEm: null, restante: 30 }, 999999), 30)
  assert.equal(segundosRestantes({ terminaEm: 106000, restante: 30 }, 76000), 30)
})

test('rejeita séries fora do plano e registros com valores inválidos', () => {
  assert.throws(() => atualizarSerie(vazio(), '2026-10-05', exemplo, 0))
  assert.throws(() => atualizarSerie(vazio(), '2026-10-05', exemplo, 5))
  const dados = atualizarSerie(vazio(), '2026-10-05', exemplo, 1, 1000)
  dados.sessoes['2026-10-05'].exercicios[exemplo.id].series = [1, 1]
  assert.throws(() => validarTreinos(dados))
  assert.throws(() => validarTreinos({
    versao: 1,
    sessoes: { '2026-02-30': { inicio: null, fim: null, exercicios: {} } },
  }))
})

function treinoFinalizado(dados, dia, cargas, inicio = 1000) {
  for (const [id, carga] of Object.entries(cargas)) {
    const exercicio = EXERCICIOS_DE_EXEMPLO.find((item) => item.id === id)
    dados = atualizarCarga(dados, dia, id, carga)
    for (let numero = 1; numero <= exercicio.series; numero++) {
      dados = atualizarSerie(dados, dia, exercicio, numero, inicio)
    }
  }
  const exercicios = Object.keys(cargas).map((id) => EXERCICIOS_DE_EXEMPLO.find((item) => item.id === id))
  return encerrarSessao(dados, dia, exercicios, inicio + 60000)
}

test('cada dia útil tem uma divisão própria com exercícios do catálogo', () => {
  assert.equal(treinoDoDia(new Date(2026, 9, 5)).letra, 'A')
  assert.equal(treinoDoDia(new Date(2026, 9, 9)).letra, 'E')
  assert.equal(treinoDoDia(new Date(2026, 9, 10)), null)
  for (const treino of PLANO_SEMANAL) {
    assert.equal(exerciciosDoTreino(treino).length, treino.exercicios.length)
  }
  assert.ok(EXERCICIOS_DE_EXEMPLO.length <= 30, 'a API aceita no máximo 30 ids por consulta')
})

test('recorde só conta quando supera a melhor carga de treinos anteriores finalizados', () => {
  let dados = treinoFinalizado(vazio(), '2026-10-05', { [exemplo.id]: 20 })
  assert.equal(melhorCarga(dados, exemplo.id, '2026-10-12'), 20)
  assert.equal(ehRecorde(dados, '2026-10-12', exemplo.id, 20), false)
  assert.equal(ehRecorde(dados, '2026-10-12', exemplo.id, 22.5), true)
  assert.equal(ehRecorde(dados, '2026-10-05', exemplo.id, 20), false)
  dados = treinoFinalizado(dados, '2026-10-12', { [exemplo.id]: 22.5 })
  assert.deepEqual(recordesDaSessao(dados, '2026-10-12').map(({ carga, anterior }) => [anterior, carga]), [[20, 22.5]])
  assert.deepEqual(recordesPessoais(dados).map(({ carga, dia }) => [carga, dia]), [[22.5, '2026-10-12']])
})

test('volume soma carga × reps × séries e ignora exercícios por tempo', () => {
  const prancha = EXERCICIOS_DE_EXEMPLO.find(({ unidade }) => unidade === 'seg')
  const dados = treinoFinalizado(vazio(), '2026-10-09', { [exemplo.id]: 20, [prancha.id]: 10 })
  assert.equal(volumeDaSessao(dados.sessoes['2026-10-09']), 20 * exemplo.repeticoes * exemplo.series)
  assert.equal(volumeDaSessao(undefined), 0)
})
