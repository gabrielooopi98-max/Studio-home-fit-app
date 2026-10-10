import assert from 'node:assert/strict'
import test from 'node:test'
import { fichaDoModelo, modeloDaFicha, validarFicha } from './ficha.js'
import {
  checkinsPorDiaUtil, comparativoSemanal, faturamento, novosAlunos, ordenarAlunos, tendencia,
} from './painelAdmin.js'

test('tendência compara com o período anterior', () => {
  assert.deepEqual(tendencia(12, 10), { direcao: 'sobe', texto: '+20%' })
  assert.deepEqual(tendencia(5, 10), { direcao: 'desce', texto: '-50%' })
  assert.deepEqual(tendencia(10, 10), { direcao: 'igual', texto: '0%' })
  assert.deepEqual(tendencia(3, 0), { direcao: 'sobe', texto: 'novo' })
  assert.deepEqual(tendencia(0, 0), { direcao: 'igual', texto: 'sem dados' })
})

test('check-ins por dia útil: pula fim de semana e conta repetidos', () => {
  // 2026-10-09 é sexta.
  const serie = checkinsPorDiaUtil([
    { dia: '2026-10-09' }, { dia: '2026-10-09' }, { dia: '2026-10-05' }, { dia: '2026-10-04' },
  ], '2026-10-09', 6)
  assert.deepEqual(serie.map(({ dia }) => dia), ['2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'])
  assert.deepEqual(serie.map(({ total }) => total), [0, 1, 0, 0, 0, 2], 'domingo 04 não entra')
  // Num sábado, a série termina na sexta.
  assert.equal(checkinsPorDiaUtil([], '2026-10-10', 3).at(-1).dia, '2026-10-09')
})

test('comparativo semanal usa o mesmo trecho da semana passada', () => {
  // Hoje: quarta 2026-10-07. Esta semana: seg 05 a qua 07. Passada: seg 28/09 a qua 30/09.
  const resultado = comparativoSemanal([
    { usuario_id: 'a', dia: '2026-10-05' }, { usuario_id: 'a', dia: '2026-10-07' }, { usuario_id: 'b', dia: '2026-10-06' },
    { usuario_id: 'a', dia: '2026-09-28' },
    { usuario_id: 'c', dia: '2026-10-01' }, // quinta passada: fora do trecho comparável
  ], '2026-10-07')
  assert.deepEqual(resultado, { checkins: 3, checkinsAntes: 1, ativos: 2, ativosAntes: 1 })
})

test('novos alunos e faturamento do mês', () => {
  assert.deepEqual(novosAlunos([
    { papel: 'aluno', criado_em: '2026-10-02T10:00:00Z' },
    { papel: 'aluno', criado_em: '2026-09-15T10:00:00Z' },
    { papel: 'personal', criado_em: '2026-10-03T10:00:00Z' },
  ], '2026-10-09'), { mes: 1, mesAnterior: 1 })
  assert.deepEqual(novosAlunos([{ papel: 'aluno', criado_em: '2025-12-20T00:00:00Z' }], '2026-01-05'), { mes: 0, mesAnterior: 1 })

  assert.deepEqual(faturamento([
    { status: 'retirado', total_centavos: 10000, criado_em: '2026-10-02T10:00:00Z' },
    { status: 'retirado', total_centavos: 5000, criado_em: '2026-10-05T10:00:00Z' },
    { status: 'separado', total_centavos: 3000, criado_em: '2026-10-06T10:00:00Z' },
    { status: 'cancelado', total_centavos: 9999, criado_em: '2026-10-06T10:00:00Z' },
    { status: 'retirado', total_centavos: 7000, criado_em: '2026-09-20T10:00:00Z' },
  ], '2026-10-09'), { mes: 15000, mesAnterior: 7000, pedidosMes: 2, aReceber: 3000 })
})

test('tabela de alunos ordena por cada coluna', () => {
  const aluno = (nome, diasSemVir, checkinsMes, estado, fim) =>
    ({ nome, diasSemVir, checkinsMes, situacaoFicha: { estado }, fichaAtual: fim ? { fim } : null })
  const alunos = [
    aluno('Bruno', 12, 0, 'vencendo', '2026-10-12'),
    aluno('ana', 0, 5, 'vigente', '2026-10-30'),
    aluno('Carla', null, 0, 'sem', null),
  ]
  const nomes = (lista) => lista.map(({ nome }) => nome)
  assert.deepEqual(nomes(ordenarAlunos(alunos, { coluna: 'nome' })), ['ana', 'Bruno', 'Carla'])
  assert.deepEqual(nomes(ordenarAlunos(alunos, { coluna: 'presenca', direcao: 'desc' })), ['Carla', 'Bruno', 'ana'], 'quem nunca veio primeiro')
  assert.deepEqual(nomes(ordenarAlunos(alunos, { coluna: 'mes', direcao: 'desc' })), ['ana', 'Bruno', 'Carla'])
  assert.deepEqual(nomes(ordenarAlunos(alunos, { coluna: 'ficha' })), ['Carla', 'Bruno', 'ana'], 'sem ficha, depois quem vence antes')
})

test('ficha vira modelo e modelo vira ficha de outro aluno', () => {
  const ficha = {
    aluno_id: 'a', titulo: 'Hipertrofia', objetivo: 'Hipertrofia', observacoes: 'Aqueça', inicio: '2026-10-01', fim: '2026-10-28',
    treinos: [{ letra: 'A', nome: 'Full', dias: [0, 2], exercicios: [{ id: 'Leg_Press', nome: 'Leg press', grupo: 'Pernas', series: 4, repeticoes: '12', descanso: 90, carga: '', observacao: '' }] }],
  }
  const modelo = modeloDaFicha(ficha, '  Iniciante 3x  ')
  assert.equal(modelo.nome, 'Iniciante 3x')
  assert.equal(modelo.duracao_dias, 28)
  modelo.treinos[0].nome = 'mudou'
  assert.equal(ficha.treinos[0].nome, 'Full', 'modelo é uma cópia')
  assert.equal(modeloDaFicha(ficha, '').nome, 'Hipertrofia')

  const nova = fichaDoModelo(modelo, 'b', '2026-11-02')
  assert.equal(nova.aluno_id, 'b')
  assert.equal(nova.fim, '2026-11-29')
  assert.deepEqual(validarFicha(nova).erros, [])
})

test('rotas do painel: ler e montar links', async () => {
  const { lerRota, linkDaRota } = await import('../admin/rotas.js')
  const casos = [
    ['', { pagina: 'visao' }],
    ['#/', { pagina: 'visao' }],
    ['#/qualquer', { pagina: 'visao' }],
    ['#/alunos', { pagina: 'alunos' }],
    ['#/alunos/a1', { pagina: 'aluno', id: 'a1', aba: 'geral' }],
    ['#/alunos/a1/evolucao', { pagina: 'aluno', id: 'a1', aba: 'evolucao' }],
    ['#/alunos/a1/xyz', { pagina: 'aluno', id: 'a1', aba: 'geral' }],
    ['#/alunos/a1/editor', { pagina: 'aluno', id: 'a1', aba: 'geral' }],
    ['#/treinos/enviar', { pagina: 'enviar' }],
    ['#/treinos', { pagina: 'treinos', aba: 'fichas' }],
    ['#/treinos/modelos', { pagina: 'treinos', aba: 'modelos' }],
    ['#/treinos/modelos/novo', { pagina: 'editor-modelo', id: 'novo' }],
    ['#/loja', { pagina: 'loja' }],
    ['#/equipe', { pagina: 'equipe' }],
  ]
  for (const [hash, esperado] of casos) assert.deepEqual(lerRota(hash), esperado, hash)
  // ida e volta
  for (const [, rota] of casos.slice(3)) assert.deepEqual(lerRota(linkDaRota(rota)), rota)
  assert.equal(linkDaRota({ pagina: 'aluno', id: 'a b', aba: 'treino' }), '#/alunos/a%20b/treino')
  assert.deepEqual(lerRota('#/alunos/a%20b/treino'), { pagina: 'aluno', id: 'a b', aba: 'treino' })
})

test('alunos: filtros do mês, nível de presença e planilha', async () => {
  const { filtrarAlunos, nivelDePresenca, ordenarAlunos, planilhaDosAlunos } = await import('./painelAdmin.js')
  const base = { email: '', telefone: '', metaSemanal: 3, checkinsMes: 0, ultimoCheckin: null }
  const alunos = [
    { ...base, id: 'a', nome: 'Ana; "A"', checkinsSemana: 2, checkinsMes: 6, diasSemVir: 1, ultimoCheckin: '2026-10-09',
      fichas: [{ inicio: '2026-10-01', fim: '2026-10-31' }] },
    { ...base, id: 'b', nome: 'Bruno', checkinsSemana: 0, diasSemVir: 5, fichas: [{ inicio: '2026-09-01', fim: '2026-09-30' }] },
    { ...base, id: 'c', nome: 'Carla', checkinsSemana: 0, diasSemVir: null, fichas: [] },
  ]
  const ids = (lista) => lista.map(({ id }) => id)
  assert.deepEqual(ids(filtrarAlunos(alunos, { filtro: 'ativos' })), ['a'])
  assert.deepEqual(ids(filtrarAlunos(alunos, { filtro: 'sem-treino', mes: '2026-10' })), ['b', 'c'])
  assert.deepEqual(alunos.map(nivelDePresenca), ['ok', 'atencao', 'sumido'])
  assert.deepEqual(ids(ordenarAlunos(alunos, { coluna: 'treino', mes: '2026-10' })), ['b', 'c', 'a'])
  assert.deepEqual(ids(ordenarAlunos(alunos, { coluna: 'semana', direcao: 'desc' })), ['a', 'b', 'c'])

  const planilha = planilhaDosAlunos(alunos, '2026-10')
  assert.ok(planilha.startsWith('\uFEFFNome;E-mail'))
  const linhas = planilha.split('\r\n')
  assert.equal(linhas.length, 4)
  assert.equal(linhas[1], '"Ana; ""A""";;;2/3;6;09/10;Enviado (até 31/10)')
  assert.match(linhas[3], /nunca;Falta enviar$/)
})
