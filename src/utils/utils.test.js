import test from 'node:test'
import assert from 'node:assert/strict'
import { carregarCheckins, salvarCheckin, sequenciaDeSemanas, ultimasSemanas } from './checkins.js'
import { PERFIL_PADRAO, registrarPeso, validarPerfil, variacaoDePeso } from './perfil.js'

function armazenamentoFalso(inicial = {}) {
  const dados = new Map(Object.entries(inicial))
  return {
    get length() { return dados.size },
    key: (i) => [...dados.keys()][i] ?? null,
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, String(valor)),
  }
}

test('carrega check-ins de todos os meses e salva no mês da data', () => {
  const armazenamento = armazenamentoFalso({
    'home-fit:checkins:2026-09': '["2026-09-29"]',
    'home-fit:checkins:2026-10': '["2026-10-01"]',
    'home-fit:treinos:v1': '{}',
  })
  const checkins = carregarCheckins(armazenamento)
  assert.deepEqual(checkins, ['2026-09-29', '2026-10-01'])
  salvarCheckin(armazenamento, checkins, '2026-10-02')
  assert.equal(armazenamento.getItem('home-fit:checkins:2026-10'), '["2026-10-01","2026-10-02"]')
  assert.equal(armazenamento.getItem('home-fit:checkins:2026-09'), '["2026-09-29"]')
  assert.throws(() => carregarCheckins(armazenamentoFalso({ 'home-fit:checkins:2026-10': '{}' })))
})

test('sequência conta semanas seguidas na meta sem quebrar na semana em andamento', () => {
  const hoje = new Date(2026, 9, 7) // quarta
  const semanaPassada = ['2026-09-28', '2026-09-30', '2026-10-02']
  const retrasada = ['2026-09-21', '2026-09-23', '2026-09-25']
  assert.deepEqual(sequenciaDeSemanas([...retrasada, ...semanaPassada], 3, hoje), { atual: 2, melhor: 2 })
  assert.deepEqual(sequenciaDeSemanas([...retrasada, ...semanaPassada, '2026-10-05', '2026-10-06', '2026-10-07'], 3, hoje), { atual: 3, melhor: 3 })
  assert.deepEqual(sequenciaDeSemanas(['2026-09-14', '2026-09-15', ...semanaPassada], 2, hoje), { atual: 1, melhor: 1 })
  assert.deepEqual(sequenciaDeSemanas([], 3, hoje), { atual: 0, melhor: 0 })
  const semanas = ultimasSemanas(semanaPassada, 2, hoje)
  assert.deepEqual(semanas.map(({ total }) => total), [3, 0])
})

test('perfil registra um peso por dia e calcula a variação', () => {
  let perfil = { ...PERFIL_PADRAO, pesos: [] }
  perfil = registrarPeso(perfil, '2026-10-01', 80)
  perfil = registrarPeso(perfil, '2026-10-08', 79.4)
  perfil = registrarPeso(perfil, '2026-10-08', 79.2)
  assert.equal(perfil.pesos.length, 2)
  assert.deepEqual(variacaoDePeso(perfil.pesos), { desde: '2026-10-01', diferenca: -0.8 })
  assert.throws(() => registrarPeso(perfil, '2026-10-09', 0))
  assert.throws(() => validarPerfil({ ...perfil, metaSemanal: 9 }))
})
