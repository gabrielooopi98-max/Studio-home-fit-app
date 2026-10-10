import assert from 'node:assert/strict'
import test from 'node:test'
import { linhasParaCheckins, linhasParaPerfil, linhasParaTreinos, sessaoParaLinha } from './mapeamento.js'
import { operacoesDeMigracao } from './migracao.js'
import { ErroDeDados, executarOperacao } from './repositorio.js'
import { aplicarOperacoes, chaveDaOperacao, criarFila } from './sincronizacao.js'

const esperar = (ms = 0) => new Promise((resolver) => setTimeout(resolver, ms))

function armazenamentoFalso(inicial = {}) {
  const dados = new Map(Object.entries(inicial))
  return {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, String(valor)),
    removeItem: (chave) => dados.delete(chave),
    dados,
  }
}

const sessaoValida = {
  inicio: Date.UTC(2026, 9, 5, 10),
  fim: Date.UTC(2026, 9, 5, 11),
  exercicios: { Dumbbell_Bench_Press: { series: [1, 2, 3, 4], carga: 22.5 } },
}

test('converte linhas do Supabase para os formatos do app', () => {
  const perfil = linhasParaPerfil({ nome: 'Ana', meta_semanal: 7 }, [
    { dia: '2026-10-08', kg: '71.40' },
    { dia: '2026-10-01', kg: 72 },
  ])
  assert.deepEqual(perfil, {
    versao: 1,
    nome: 'Ana',
    telefone: '',
    papel: 'aluno',
    metaSemanal: 5,
    pesos: [{ dia: '2026-10-01', kg: 72 }, { dia: '2026-10-08', kg: 71.4 }],
  })
  assert.deepEqual(linhasParaPerfil(null, null), { versao: 1, nome: '', telefone: '', papel: 'aluno', metaSemanal: 3, pesos: [] })
  assert.deepEqual(linhasParaCheckins([{ dia: '2026-10-06' }, { dia: '2026-10-05' }, { dia: '2026-10-06' }]),
    ['2026-10-05', '2026-10-06'])
})

test('sessões vão e voltam do banco sem perder dados, e as inválidas são ignoradas', () => {
  const linha = sessaoParaLinha('2026-10-05', sessaoValida)
  assert.equal(linha.inicio, '2026-10-05T10:00:00.000Z')
  const treinos = linhasParaTreinos([
    { ...linha, inicio: '2026-10-05T10:00:00+00:00' },
    { dia: '2026-10-06', inicio: null, fim: null, exercicios: { Nao_Existe: { series: [1], carga: null } } },
  ])
  assert.deepEqual(treinos, { versao: 1, sessoes: { '2026-10-05': sessaoValida } })
  assert.deepEqual(sessaoParaLinha('2026-10-07', { inicio: null, fim: null, exercicios: {} }),
    { dia: '2026-10-07', inicio: null, fim: null, exercicios: {} })
})

test('aplica alterações pendentes sobre os dados do servidor', () => {
  const servidor = {
    perfil: { versao: 1, nome: 'Ana', metaSemanal: 3, pesos: [{ dia: '2026-10-01', kg: 72 }] },
    checkins: ['2026-10-05'],
    treinos: { versao: 1, sessoes: { '2026-10-05': sessaoValida } },
  }
  const resultado = aplicarOperacoes(servidor, [
    { tipo: 'perfil', nome: 'Ana Paula', metaSemanal: 4 },
    { tipo: 'checkin', dia: '2026-10-02' },
    { tipo: 'checkin', dia: '2026-10-05' },
    { tipo: 'peso', dia: '2026-10-01', kg: null },
    { tipo: 'peso', dia: '2026-10-08', kg: 71 },
    { tipo: 'sessao', dia: '2026-10-06', sessao: { inicio: 1, fim: null, exercicios: {} } },
    { tipo: 'sessao', dia: '2026-10-05', sessao: { inicio: 1, fim: null, exercicios: {} } },
  ])
  assert.equal(resultado.perfil.nome, 'Ana Paula')
  assert.equal(resultado.perfil.metaSemanal, 4)
  assert.deepEqual(resultado.perfil.pesos, [{ dia: '2026-10-08', kg: 71 }])
  assert.deepEqual(resultado.checkins, ['2026-10-02', '2026-10-05'])
  assert.ok(resultado.treinos.sessoes['2026-10-06'])
  // treino já finalizado no servidor não é sobrescrito
  assert.deepEqual(resultado.treinos.sessoes['2026-10-05'], sessaoValida)
  assert.equal(servidor.checkins.length, 1, 'não altera o objeto original')
})

test('migração envia só o que ainda não está na conta', () => {
  const local = {
    perfil: { versao: 1, nome: 'Ana', metaSemanal: 4, pesos: [{ dia: '2026-10-01', kg: 72 }, { dia: '2026-10-02', kg: 71.5 }] },
    checkins: ['2026-10-01', '2026-10-02'],
    treinos: { versao: 1, sessoes: { '2026-10-01': sessaoValida, '2026-10-02': sessaoValida } },
  }
  const servidor = {
    perfil: { versao: 1, nome: '', metaSemanal: 3, pesos: [{ dia: '2026-10-01', kg: 72 }] },
    checkins: ['2026-10-01'],
    treinos: { versao: 1, sessoes: { '2026-10-01': sessaoValida } },
  }
  assert.deepEqual(operacoesDeMigracao(local, servidor), [
    { tipo: 'perfil', nome: 'Ana', metaSemanal: 4 },
    { tipo: 'peso', dia: '2026-10-02', kg: 71.5 },
    { tipo: 'checkin', dia: '2026-10-02' },
    { tipo: 'sessao', dia: '2026-10-02', sessao: sessaoValida },
  ])
  // conta que já tem nome mantém o nome do servidor
  const comNome = { ...servidor, perfil: { ...servidor.perfil, nome: 'Ana S.' } }
  assert.equal(operacoesDeMigracao(local, comNome).some(({ tipo }) => tipo === 'perfil'), false)
  assert.deepEqual(operacoesDeMigracao({ perfil: null, checkins: [], treinos: { versao: 1, sessoes: {} } }, servidor), [])
})

test('fila junta alterações da mesma coisa e envia só o estado mais novo', async () => {
  const enviadas = []
  const armazenamento = armazenamentoFalso()
  const fila = criarFila({ armazenamento, chave: 'fila', atraso: 0, executar: async (op) => { enviadas.push(op) } })
  fila.enfileirar({ tipo: 'sessao', dia: '2026-10-05', sessao: { inicio: 1, fim: null, exercicios: {} } })
  fila.enfileirar({ tipo: 'sessao', dia: '2026-10-05', sessao: { inicio: 2, fim: null, exercicios: {} } })
  fila.enfileirar({ tipo: 'checkin', dia: '2026-10-05' })
  assert.equal(JSON.parse(armazenamento.getItem('fila')).length, 2, 'guarda no aparelho antes de enviar')
  await esperar(10)
  assert.deepEqual(enviadas.map((op) => op.sessao?.inicio ?? op.tipo), [2, 'checkin'])
  assert.equal(fila.pendentes().length, 0)
  assert.equal(armazenamento.getItem('fila'), null)
  fila.destruir()
})

test('fila sem internet guarda as alterações e reenvia quando a conexão volta', async () => {
  let online = false
  const estados = []
  const enviadas = []
  const armazenamento = armazenamentoFalso()
  const fila = criarFila({
    armazenamento,
    chave: 'fila',
    atraso: 0,
    aoMudar: ({ estado }) => estados.push(estado),
    executar: async (op) => {
      if (!online) throw new ErroDeDados('Failed to fetch')
      enviadas.push(op)
    },
  })
  fila.enfileirar({ tipo: 'checkin', dia: '2026-10-05' })
  await esperar(10)
  assert.equal(estados.at(-1), 'offline')
  assert.equal(fila.pendentes().length, 1)

  // o app foi fechado e aberto de novo: a fila volta do armazenamento
  fila.destruir()
  online = true
  const reaberta = criarFila({
    armazenamento, chave: 'fila', atraso: 0,
    executar: async (op) => { enviadas.push(op) },
  })
  assert.equal(reaberta.pendentes().length, 1)
  reaberta.tentarAgora()
  await esperar(10)
  assert.deepEqual(enviadas, [{ tipo: 'checkin', dia: '2026-10-05' }])
  assert.equal(reaberta.pendentes().length, 0)
  reaberta.destruir()
})

test('fila descarta alteração recusada pelo servidor sem travar as outras', async () => {
  const erros = []
  const enviadas = []
  const fila = criarFila({
    armazenamento: armazenamentoFalso(),
    chave: 'fila',
    atraso: 0,
    aoErro: (erro) => erros.push(erro.message),
    executar: async (op) => {
      if (op.tipo === 'peso') throw new ErroDeDados('violates check constraint', { status: 400, codigo: '23514' })
      enviadas.push(op.tipo)
    },
  })
  fila.enfileirar({ tipo: 'peso', dia: '2026-10-05', kg: 9999 })
  fila.enfileirar({ tipo: 'checkin', dia: '2026-10-05' })
  await esperar(10)
  assert.deepEqual(erros, ['violates check constraint'])
  assert.deepEqual(enviadas, ['checkin'])
  assert.equal(fila.pendentes().length, 0)
  fila.destruir()
})

test('erros de rede, servidor e token vencido são retentáveis; erros de dados não', () => {
  assert.equal(new ErroDeDados('x').retentavel, true)
  assert.equal(new ErroDeDados('x', { status: 503 }).retentavel, true)
  assert.equal(new ErroDeDados('x', { status: 401 }).retentavel, true)
  assert.equal(new ErroDeDados('x', { status: 400 }).retentavel, false)
  assert.equal(new ErroDeDados('x', { status: 403 }).retentavel, false)
  assert.equal(chaveDaOperacao({ tipo: 'perfil', nome: 'A' }), 'perfil')
  assert.equal(chaveDaOperacao({ tipo: 'peso', dia: '2026-10-05' }), 'peso:2026-10-05')
})

// Cliente Supabase falso: registra a chamada e devolve a resposta configurada.
function clienteFalso(resposta = { error: null, status: 201 }) {
  const chamadas = []
  const construtor = (tabela) => {
    const chamada = { tabela, passos: [] }
    chamadas.push(chamada)
    const encadear = new Proxy({}, {
      get(_, metodo) {
        if (metodo === 'then') return (resolver) => resolver(resposta)
        return (...args) => {
          chamada.passos.push([metodo, ...args])
          return encadear
        }
      },
    })
    return encadear
  }
  return { cliente: { from: construtor }, chamadas }
}

test('grava cada tipo de operação na tabela certa, sempre do próprio usuário', async () => {
  const { cliente, chamadas } = clienteFalso()
  await executarOperacao(cliente, 'u1', { tipo: 'checkin', dia: '2026-10-05' })
  await executarOperacao(cliente, 'u1', { tipo: 'peso', dia: '2026-10-05', kg: 71.5 })
  await executarOperacao(cliente, 'u1', { tipo: 'peso', dia: '2026-10-04', kg: null })
  await executarOperacao(cliente, 'u1', { tipo: 'perfil', nome: '  Ana  ', metaSemanal: 4 })
  await executarOperacao(cliente, 'u1', { tipo: 'sessao', dia: '2026-10-05', sessao: sessaoValida })

  assert.deepEqual(chamadas.map(({ tabela, passos }) => [tabela, passos[0][0]]), [
    ['checkins', 'upsert'], ['pesos', 'upsert'], ['pesos', 'delete'], ['perfis', 'update'], ['sessoes_treino', 'upsert'],
  ])
  assert.deepEqual(chamadas[0].passos[0][1], { usuario_id: 'u1', dia: '2026-10-05' })
  assert.equal(chamadas[0].passos[0][2].ignoreDuplicates, true)
  assert.deepEqual(chamadas[2].passos.slice(1), [['eq', 'usuario_id', 'u1'], ['eq', 'dia', '2026-10-04']])
  assert.deepEqual(chamadas[3].passos[0][1], { nome: 'Ana', meta_semanal: 4 })
  assert.deepEqual(chamadas[3].passos[1], ['eq', 'id', 'u1'])
  assert.equal(chamadas[4].passos[0][1].fim, '2026-10-05T11:00:00.000Z')
})

test('reenviar um treino já finalizado conta como sucesso; outros erros viram ErroDeDados', async () => {
  const travado = clienteFalso({ error: { code: '42501', message: 'row-level security' }, status: 403 })
  await executarOperacao(travado.cliente, 'u1', { tipo: 'sessao', dia: '2026-10-05', sessao: sessaoValida })

  const emAndamento = { ...sessaoValida, fim: null }
  await assert.rejects(
    executarOperacao(travado.cliente, 'u1', { tipo: 'sessao', dia: '2026-10-05', sessao: emAndamento }),
    (erro) => erro instanceof ErroDeDados && erro.retentavel === false,
  )
  const semRede = clienteFalso({ error: { message: 'TypeError: Failed to fetch', code: '' }, status: 0 })
  await assert.rejects(
    executarOperacao(semRede.cliente, 'u1', { tipo: 'checkin', dia: '2026-10-05' }),
    (erro) => erro.retentavel === true,
  )
})

test('fila pausada guarda as alterações e só envia depois de retomar', async () => {
  const enviadas = []
  const fila = criarFila({
    armazenamento: armazenamentoFalso(), chave: 'fila', atraso: 0, pausada: true,
    executar: async (op) => { enviadas.push(op.tipo) },
  })
  fila.enfileirar({ tipo: 'checkin', dia: '2026-10-05' })
  await esperar(10)
  assert.deepEqual(enviadas, [])
  assert.equal(fila.pendentes().length, 1)
  fila.retomar()
  await esperar(10)
  assert.deepEqual(enviadas, ['checkin'])
  fila.destruir()
})

test('telefone: máscara, validação e envio só com números', async () => {
  const { formatarTelefone, somenteDigitos, telefoneValido } = await import('../utils/telefone.js')
  assert.equal(formatarTelefone('64999250218'), '(64) 99925-0218')
  assert.equal(formatarTelefone('6433334444'), '(64) 3333-4444')
  assert.equal(formatarTelefone('6'), '(6')
  assert.equal(formatarTelefone('649'), '(64) 9')
  assert.equal(formatarTelefone('(64) 99925-02189999'), '(64) 99925-0218')
  assert.equal(somenteDigitos('(64) 99925-0218'), '64999250218')
  assert.equal(telefoneValido('(64) 99925-0218'), true)
  assert.equal(telefoneValido('(64) 3333-4444'), true)
  assert.equal(telefoneValido('(64) 89925-0218'), false, 'celular precisa começar com 9')
  assert.equal(telefoneValido('(04) 3333-4444'), false, 'DDD não começa com 0')
  assert.equal(telefoneValido('(64) 9992'), false)

  assert.equal(linhasParaPerfil({ nome: 'Ana', meta_semanal: 3, telefone: '64999250218' }, []).telefone, '64999250218')
  assert.equal(linhasParaPerfil({ nome: 'Ana', meta_semanal: 3 }, []).telefone, '', 'banco sem a coluna ainda')

  const { cliente, chamadas } = clienteFalso()
  await executarOperacao(cliente, 'u1', { tipo: 'perfil', nome: 'Ana', metaSemanal: 3, telefone: '64999250218' })
  await executarOperacao(cliente, 'u1', { tipo: 'perfil', nome: 'Ana', metaSemanal: 3 })
  assert.equal(chamadas[0].passos[0][1].telefone, '64999250218')
  assert.equal('telefone' in chamadas[1].passos[0][1], false, 'operação antiga não apaga o telefone')
})

test('banco sem a coluna de telefone: o app segue funcionando sem ela', async () => {
  let tentativas = 0
  const cliente = {
    from: () => {
      const chamada = { campos: null }
      const encadear = new Proxy({}, {
        get(_, metodo) {
          if (metodo === 'then') {
            tentativas++
            const faltou = 'telefone' in (chamada.campos ?? {})
            return (resolver) => resolver(faltou
              ? { error: { code: 'PGRST204', message: "Could not find the 'telefone' column" }, status: 400 }
              : { error: null, status: 204 })
          }
          return (...args) => {
            if (metodo === 'update') chamada.campos = args[0]
            return encadear
          }
        },
      })
      return encadear
    },
  }
  await executarOperacao(cliente, 'u1', { tipo: 'perfil', nome: 'Ana', metaSemanal: 3, telefone: '64999250218' })
  assert.equal(tentativas, 2, 'tenta de novo sem o telefone e salva nome e meta')
})

test('papel do perfil: dono e personal entram no painel; qualquer outro valor vira aluno', () => {
  assert.equal(linhasParaPerfil({ papel: 'dono' }, []).papel, 'dono')
  assert.equal(linhasParaPerfil({ papel: 'personal' }, []).papel, 'personal')
  assert.equal(linhasParaPerfil({ papel: 'aluno' }, []).papel, 'aluno')
  assert.equal(linhasParaPerfil({ papel: 'admin' }, []).papel, 'aluno')
  assert.equal(linhasParaPerfil(null, []).papel, 'aluno')
})
