import assert from 'node:assert/strict'
import test from 'node:test'
import {
  atualizarCarga, atualizarSerie, exerciciosDoTreino, recordesPessoais, repeticoesNumericas, treinoDoDia,
  validarTreinos, volumeDaSessao,
} from '../componentes/area-treinos/treinoLocal.js'
import { CATALOGO_EXERCICIOS, exercicioDoCatalogo } from './catalogoExercicios.js'
import {
  copiarFicha, estadoDaFicha, fichaDoDia, fichaDoPlanoPadrao, itemDoCatalogo, itemPersonalizado, novaFicha,
  renovarFicha, somarDias, validarFicha,
} from './ficha.js'
import { filtrarAlunos, indicadoresDoPainel, linkWhatsApp, mensagemPara, resumoDosAlunos } from './painelAdmin.js'

const supino = itemDoCatalogo(exercicioDoCatalogo('Barbell_Bench_Press_-_Medium_Grip'))
const fichaBase = () => ({
  ...novaFicha('aluno-1', '2026-10-01'),
  treinos: [
    { letra: 'A', nome: 'Peito', dias: [0, 3], exercicios: [{ ...supino, series: 5, repeticoes: '8-10', carga: '40 kg', observacao: 'Desça devagar' }] },
    { letra: 'B', nome: 'Costas', dias: [1], exercicios: [itemPersonalizado('Remada na máquina articulada', 'x1')] },
  ],
})

test('datas: somar dias atravessa meses e anos', () => {
  assert.equal(somarDias('2026-10-31', 1), '2026-11-01')
  assert.equal(somarDias('2026-12-31', 1), '2027-01-01')
  assert.equal(somarDias('2026-03-01', -1), '2026-02-28')
})

test('repetições viram número para o volume', () => {
  assert.equal(repeticoesNumericas('12'), 12)
  assert.equal(repeticoesNumericas('8-12'), 10)
  assert.equal(repeticoesNumericas(15), 15)
  assert.equal(repeticoesNumericas('até a falha'), null)
  assert.equal(repeticoesNumericas('20 min'), null)
})

test('ficha válida é normalizada e ganha título automático', () => {
  const { erros, ficha } = validarFicha(fichaBase())
  assert.deepEqual(erros, [])
  assert.equal(ficha.titulo, 'Hipertrofia · outubro')
  assert.equal(ficha.fim, '2026-10-30')
  assert.deepEqual(ficha.treinos.map(({ letra, dias }) => [letra, dias]), [['A', [0, 3]], ['B', [1]]])
  assert.equal(ficha.treinos[0].exercicios[0].observacao, 'Desça devagar')
})

test('ficha inválida explica o que falta', () => {
  const ficha = fichaBase()
  ficha.treinos[1].dias = [0]
  ficha.treinos.push({ letra: 'C', nome: '', dias: [], exercicios: [] })
  ficha.treinos[0].exercicios.push({ ...supino })
  ficha.treinos[0].exercicios[0].series = 0
  ficha.fim = '2026-09-01'
  const { erros } = validarFicha(ficha)
  assert.ok(erros.some((erro) => /fim precisa ser depois/.test(erro)))
  assert.ok(erros.some((erro) => /Segunda está no treino A e no B/.test(erro)))
  assert.ok(erros.some((erro) => /Treino C: adicione pelo menos um exercício/.test(erro)))
  assert.ok(erros.some((erro) => /Treino C: escolha em quais dias/.test(erro)))
  assert.ok(erros.some((erro) => /aparece duas vezes/.test(erro)))
  assert.ok(erros.some((erro) => /séries entre 1 e 10/.test(erro)))
})

test('plano padrão, cópia e renovação', () => {
  const padrao = fichaDoPlanoPadrao('a', '2026-10-05')
  assert.equal(padrao.treinos.length, 5)
  assert.deepEqual(validarFicha(padrao).erros, [])

  const { ficha } = validarFicha(fichaBase())
  const copia = copiarFicha(ficha, 'aluno-2', '2026-11-10')
  assert.equal(copia.aluno_id, 'aluno-2')
  assert.equal(copia.fim, '2026-12-09', 'mantém a duração de 30 dias')
  assert.equal(copia.id, undefined)
  copia.treinos[0].exercicios[0].series = 9
  assert.equal(ficha.treinos[0].exercicios[0].series, 5, 'cópia não altera a original')

  assert.equal(renovarFicha(ficha, '2026-10-20').inicio, '2026-10-31', 'renova no dia seguinte ao fim')
  assert.equal(renovarFicha(ficha, '2026-11-15').inicio, '2026-11-15', 'se já venceu, começa hoje')
})

test('estado da ficha e ficha que vale no dia', () => {
  const ficha = { inicio: '2026-10-01', fim: '2026-10-30' }
  assert.equal(estadoDaFicha(null, '2026-10-10').estado, 'sem')
  assert.equal(estadoDaFicha(ficha, '2026-10-10').estado, 'vigente')
  assert.equal(estadoDaFicha(ficha, '2026-10-25').estado, 'vencendo')
  assert.equal(estadoDaFicha(ficha, '2026-10-30').texto, 'Vence hoje')
  assert.equal(estadoDaFicha(ficha, '2026-11-02').estado, 'vencida')
  assert.equal(estadoDaFicha(ficha, '2026-09-20').estado, 'futura')
  const nova = { inicio: '2026-10-20', fim: '2026-11-20' }
  assert.equal(fichaDoDia([ficha, nova], '2026-10-25'), nova, 'a mais recente vale')
  assert.equal(fichaDoDia([ficha], '2026-12-01'), null)
})

test('aluno com ficha recebe o treino do personal; sem ficha, o plano padrão', () => {
  const { ficha } = validarFicha(fichaBase())
  const segunda = new Date(2026, 9, 5, 12)
  const quarta = new Date(2026, 9, 7, 12)
  const treino = treinoDoDia(segunda, [ficha])
  assert.equal(treino.letra, 'A')
  assert.equal(treino.personalizado, true)
  const [exercicio] = exerciciosDoTreino(treino)
  assert.equal(exercicio.series, 5)
  assert.equal(exercicio.repeticoes, '8-10')
  assert.equal(exercicio.carga, '40 kg')
  assert.equal(exercicio.observacao, 'Desça devagar')
  assert.equal(treinoDoDia(quarta, [ficha]), null, 'dia sem treino na ficha é descanso')
  assert.equal(treinoDoDia(new Date(2026, 11, 7, 12), [ficha]).letra, 'A', 'fora da validade volta ao padrão')
  assert.equal(treinoDoDia(new Date(2026, 11, 7, 12), [ficha]).personalizado, undefined)
})

test('treino com exercício personalizado e 5 séries salva, valida e entra em volume e recordes', () => {
  const { ficha } = validarFicha(fichaBase())
  const [supinoFicha] = exerciciosDoTreino(treinoDoDia(new Date(2026, 9, 5, 12), [ficha]))
  const [livre] = exerciciosDoTreino(treinoDoDia(new Date(2026, 9, 6, 12), [ficha]))
  let dados = { versao: 1, sessoes: {} }
  dados = atualizarCarga(dados, '2026-10-06', livre.id, 50, livre)
  for (let serie = 1; serie <= 3; serie++) dados = atualizarSerie(dados, '2026-10-06', livre, serie, 1000)
  dados = atualizarCarga(dados, '2026-10-05', supinoFicha.id, 40, supinoFicha)
  for (let serie = 1; serie <= 5; serie++) dados = atualizarSerie(dados, '2026-10-05', supinoFicha, serie, 1000)
  dados.sessoes['2026-10-05'].fim = 2000
  dados.sessoes['2026-10-06'].fim = 2000

  assert.doesNotThrow(() => validarTreinos(JSON.parse(JSON.stringify(dados))))
  assert.equal(dados.sessoes['2026-10-06'].exercicios[livre.id].nome, 'Remada na máquina articulada')
  assert.equal(volumeDaSessao(dados.sessoes['2026-10-05']), 40 * 9 * 5, '8-10 reps conta como 9')
  assert.equal(volumeDaSessao(dados.sessoes['2026-10-06']), 50 * 12 * 3)
  const recordes = recordesPessoais(dados)
  assert.deepEqual(recordes.map(({ exercicio, carga }) => [exercicio.nome, carga]),
    [['Remada na máquina articulada', 50], ['Supino reto com barra', 40]])
})

test('catálogo não tem ids repetidos e todo item tem grupo', () => {
  const ids = CATALOGO_EXERCICIOS.map(({ id }) => id)
  assert.equal(new Set(ids).size, ids.length)
  assert.ok(CATALOGO_EXERCICIOS.every(({ grupo, nome }) => grupo && nome))
})

test('painel: resumo, filtros e indicadores dos alunos', () => {
  const hoje = '2026-10-09'
  const alunos = resumoDosAlunos({
    perfis: [
      { id: 'a', nome: 'Ana Souza', email: 'ana@x.com', telefone: '64999990000', papel: 'aluno', meta_semanal: 3 },
      { id: 'b', nome: 'Bruno', email: 'b@x.com', telefone: '', papel: 'aluno', meta_semanal: 4 },
      { id: 'c', nome: 'Carla', email: 'c@x.com', telefone: '', papel: 'aluno' },
      { id: 'p', nome: 'Personal', email: 'p@x.com', telefone: '', papel: 'personal' },
    ],
    checkins: [
      { usuario_id: 'a', dia: '2026-10-08' }, { usuario_id: 'a', dia: '2026-10-09' }, { usuario_id: 'a', dia: '2026-09-29' },
      { usuario_id: 'b', dia: '2026-09-20' },
    ],
    sessoes: [{ usuario_id: 'a', dia: '2026-10-08', fim: '2026-10-08T12:00:00Z' }, { usuario_id: 'a', dia: '2026-10-09', fim: null }],
    fichas: [
      { aluno_id: 'a', inicio: '2026-10-01', fim: '2026-10-30', titulo: 'Out' },
      { aluno_id: 'b', inicio: '2026-09-01', fim: '2026-10-12', titulo: 'Set' },
    ],
  }, hoje)

  assert.deepEqual(alunos.map(({ nome }) => nome), ['Ana Souza', 'Bruno', 'Carla'], 'equipe não entra')
  const [ana, bruno, carla] = alunos
  assert.equal(ana.checkinsMes, 2)
  assert.equal(ana.checkinsSemana, 2)
  assert.equal(ana.treinosMes, 1)
  assert.equal(ana.diasSemVir, 0)
  assert.equal(ana.situacaoFicha.estado, 'vigente')
  assert.equal(bruno.diasSemVir, 19)
  assert.equal(bruno.situacaoFicha.estado, 'vencendo')
  assert.equal(carla.situacaoFicha.estado, 'sem')
  assert.equal(carla.diasSemVir, null)

  assert.deepEqual(filtrarAlunos(alunos, { filtro: 'sumidos' }).map(({ id }) => id), ['b', 'c'])
  assert.deepEqual(filtrarAlunos(alunos, { filtro: 'sem-ficha' }).map(({ id }) => id), ['c'])
  assert.deepEqual(filtrarAlunos(alunos, { filtro: 'vencendo' }).map(({ id }) => id), ['b'])
  assert.deepEqual(filtrarAlunos(alunos, { busca: 'SOUZA' }).map(({ id }) => id), ['a'])
  assert.deepEqual(filtrarAlunos(alunos, { busca: '9999' }).map(({ id }) => id), ['a'])

  assert.deepEqual(indicadoresDoPainel(alunos, 1, hoje), { total: 3, checkinsHoje: 1, ativosSemana: 1, sumidos: 2, semFicha: 1, vencendo: 1 })
  assert.match(mensagemPara('ficha-nova', ana, { titulo: 'Out' }), /^Oi, Ana! Seu treino novo/)
  assert.equal(linkWhatsApp('', 'oi'), '')
  assert.match(linkWhatsApp('64999990000', 'Oi Ana'), /^https:\/\/wa\.me\/5564999990000\?text=Oi%20Ana$/)
})

test('treino do mês: limites, nomes e qual ficha é do mês', async () => {
  const { limitesDoMes, somarMeses, nomeDoMes, mesSugerido, fichaDoMes, fichaAnteriorAoMes, noMes, novaFicha } = await import('./ficha.js')
  assert.deepEqual(limitesDoMes('2026-02'), { inicio: '2026-02-01', fim: '2026-02-28' })
  assert.deepEqual(limitesDoMes('2024-02'), { inicio: '2024-02-01', fim: '2024-02-29' })
  assert.equal(somarMeses('2026-12', 1), '2027-01')
  assert.equal(somarMeses('2026-01', -1), '2025-12')
  assert.equal(nomeDoMes('2026-10'), 'outubro')
  assert.equal(nomeDoMes('2026-10', { ano: true }), 'outubro de 2026')
  assert.equal(mesSugerido('2026-10-10'), '2026-10')
  assert.equal(mesSugerido('2026-10-27'), '2026-11')

  const setembro = { id: 's', inicio: '2026-09-01', fim: '2026-09-30' }
  const meioDoMes = { id: 'm', inicio: '2026-09-15', fim: '2026-10-14' }
  const outubro = { id: 'o', inicio: '2026-10-01', fim: '2026-10-31' }
  assert.equal(fichaDoMes([setembro, meioDoMes], '2026-10'), null)
  assert.equal(fichaDoMes([setembro, meioDoMes, outubro], '2026-10').id, 'o')
  assert.equal(fichaDoMes([{ id: 'longa', inicio: '2026-08-01', fim: '2026-12-31' }], '2026-10').id, 'longa')
  // Começou no fim de setembro, mas vale quase outubro inteiro: é o de outubro.
  const quaseOutubro = { id: 'q', inicio: '2026-09-30', fim: '2026-10-29' }
  assert.equal(fichaDoMes([setembro, quaseOutubro], '2026-10').id, 'q')
  assert.equal(fichaAnteriorAoMes([setembro, quaseOutubro], '2026-10').id, 's')
  assert.equal(fichaAnteriorAoMes([setembro, meioDoMes, outubro], '2026-10').id, 'm')
  assert.equal(fichaAnteriorAoMes([outubro], '2026-10'), null)
  assert.equal(fichaAnteriorAoMes([quaseOutubro], '2026-11').id, 'q')

  const ficha = noMes({ ...novaFicha('a1', '2026-10-10'), titulo: 'velho' }, '2026-11')
  assert.deepEqual([ficha.inicio, ficha.fim, ficha.titulo], ['2026-11-01', '2026-11-30', ''])
})

test('foto e vídeo do personal: guardados só quando existem e com link válido', async () => {
  const { validarFicha, novaFicha } = await import('./ficha.js')
  const base = novaFicha('a1', '2026-10-01')
  const item = { id: 'x', nome: 'Supino', grupo: 'Peito', series: 3, repeticoes: '10', descanso: 60, carga: '', observacao: '' }
  const montar = (extra) => ({ ...base, treinos: [{ letra: 'A', nome: '', dias: [0], exercicios: [{ ...item, ...extra }] }] })

  const semMidia = validarFicha(montar({}))
  assert.deepEqual(Object.keys(semMidia.ficha.treinos[0].exercicios[0]).includes('imagem'), false)

  const comMidia = validarFicha(montar({ imagem: 'https://x.supabase.co/a.jpg', video: ' https://youtu.be/abc123XYZ ' }))
  assert.equal(comMidia.ficha.treinos[0].exercicios[0].imagem, 'https://x.supabase.co/a.jpg')
  assert.equal(comMidia.ficha.treinos[0].exercicios[0].video, 'https://youtu.be/abc123XYZ')

  assert.equal(validarFicha(montar({ video: 'meu video' })).erros.length, 1)
})

test('vídeo: YouTube vira player, arquivo usa o player do navegador, o resto vira link', async () => {
  const { comoMostrarVideo, conferirArquivo } = await import('./midia.js')
  const embed = 'https://www.youtube-nocookie.com/embed/abc123XYZ'
  assert.deepEqual(comoMostrarVideo('https://youtu.be/abc123XYZ'), { tipo: 'youtube', url: embed })
  assert.deepEqual(comoMostrarVideo('https://www.youtube.com/watch?v=abc123XYZ&t=10'), { tipo: 'youtube', url: embed })
  assert.deepEqual(comoMostrarVideo('https://youtube.com/shorts/abc123XYZ'), { tipo: 'youtube', url: embed })
  assert.equal(comoMostrarVideo('https://x.supabase.co/storage/v1/object/public/treinos/a.mp4').tipo, 'arquivo')
  assert.equal(comoMostrarVideo('https://www.instagram.com/reel/xyz/').tipo, 'link')
  assert.equal(comoMostrarVideo('javascript:alert(1)'), null)
  assert.equal(comoMostrarVideo(''), null)

  assert.equal(conferirArquivo({ type: 'video/mp4', size: 1000 }, 'video'), 'mp4')
  assert.throws(() => conferirArquivo({ type: 'video/mp4', size: 60 * 1024 * 1024 }, 'video'), /50 MB/)
  assert.throws(() => conferirArquivo({ type: 'image/gif', size: 10 }, 'imagem'), /JPG/)
})
