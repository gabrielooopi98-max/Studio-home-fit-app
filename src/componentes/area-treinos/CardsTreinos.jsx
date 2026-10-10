import { useEffect, useRef, useState } from 'react'
import { chaveDoDia, diasDaSemana } from '../../utils/checkins.js'
import ContadorDeExercios from './ContadorDeExercios.jsx'
import DetalhesExercicio from './DetalhesExercicio.jsx'
import VideoDoPersonal from './VideoDoPersonal.jsx'
import { CATALOGO_EXERCICIOS } from '../../utils/catalogoExercicios.js'
import { Bloco } from '../Esqueleto.jsx'
import { EsqueletoTreino } from '../Esqueletos.jsx'
import {
  EXERCICIOS_DE_EXEMPLO, atualizarCarga, atualizarSerie,
  ehRecorde, encerrarSessao, melhorCarga, exercicioDoRegistro, exerciciosDoTreino, formatarPeso,
  formatarTempo, formatarVolume, iniciarSessao, proximaSerie, recordesDaSessao, registroDoExercicio,
  segundosRestantes, treinoDoDia, ultimaCarga, volumeDaSessao,
} from './treinoLocal.js'
import './CardsTreinos.css'

const PASSO_CARGA = 2.5

const DIAS_DE_TREINO = [
  { indice: 0, nome: 'Segunda' },
  { indice: 1, nome: 'Terça' },
  { indice: 2, nome: 'Quarta' },
  { indice: 3, nome: 'Quinta' },
  { indice: 4, nome: 'Sexta' },
]

// Esqueleto animado enquanto a foto chega; aviso só se ela falhar.
function ImagemExercicio({ src, nome }) {
  const [estado, setEstado] = useState(src ? 'carregando' : 'erro')
  return (
    <>
      {estado === 'carregando' && <Bloco className="card-treino__imagem-esqueleto" altura="100%" raio={0} />}
      {estado === 'erro' && <span className="card-treino__imagem-fallback">Imagem indisponível</span>}
      <img
        src={src}
        alt={`Demonstração de ${nome}`}
        loading="lazy"
        hidden={estado === 'erro'}
        className={estado === 'ok' ? 'surgir' : 'card-treino__imagem-pendente'}
        onLoad={() => setEstado('ok')}
        onError={() => setEstado('erro')}
      />
    </>
  )
}

function mensagemErroDaApi(payload) {
  return payload?.error?.message || 'Não foi possível carregar os exercícios. Tente novamente.'
}

function CardsTreinos({ treinos: dados, fichas, onSalvarTreino, onTreinoConcluido }) {
  const diasDaSemanaAtual = diasDaSemana()
  const diasUteis = DIAS_DE_TREINO.map(({ indice, nome }) => ({
    nome,
    data: diasDaSemanaAtual[indice],
  }))
  const [diaSelecionado, setDiaSelecionado] = useState(() => {
    const hoje = chaveDoDia(new Date())
    return diasUteis.find(({ data }) => chaveDoDia(data) === hoje)?.data ?? diasUteis[0].data
  })
  const [imagens, setImagens] = useState(() => new Map())
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [erroProgresso, setErroProgresso] = useState('')
  const [descanso, setDescanso] = useState(null)
  const [agora, setAgora] = useState(Date.now)
  const [detalhe, setDetalhe] = useState(null)
  const [video, setVideo] = useState(null)
  const [descansoSaindo, setDescansoSaindo] = useState(false)
  const formularioRef = useRef(null)
  const acionadorDetalheRef = useRef(null)
  const dataSelecionada = chaveDoDia(diaSelecionado)
  const ehHoje = dataSelecionada === chaveDoDia(new Date())
  const treino = treinoDoDia(diaSelecionado, fichas)
  // Prescrição do dia (ficha do personal ou plano padrão) + foto do exercício, se houver.
  const exercicios = exerciciosDoTreino(treino)
    .map((exercicio) => ({ ...exercicio, imagem: exercicio.fotoPersonal || imagens.get(exercicio.id) }))
  const sessao = dados?.sessoes[dataSelecionada]
  const treinoEncerrado = Boolean(sessao?.fim)
  const nomeDia = diasUteis.find(({ data }) => chaveDoDia(data) === dataSelecionada)?.nome
  const tempoRestante = descanso ? segundosRestantes(descanso, agora) : 0
  const proximoExercicio = exercicios.find((exercicio) => proximaSerie(sessao, exercicio) !== null)
  const totalSeries = exercicios.reduce((total, exercicio) => total + exercicio.series, 0)
  const seriesConcluidas = exercicios.reduce((total, exercicio) =>
    total + registroDoExercicio(sessao, exercicio.id).series.length, 0)

  useEffect(() => {
    if (!descanso || descanso.terminaEm === null) return
    const atualizarRelogio = () => {
      const instante = Date.now()
      setAgora(instante)
      if (instante >= descanso.terminaEm) window.clearInterval(intervalo)
    }
    const intervalo = window.setInterval(atualizarRelogio, 250)
    window.addEventListener('focus', atualizarRelogio)
    document.addEventListener('visibilitychange', atualizarRelogio)
    return () => {
      window.clearInterval(intervalo)
      window.removeEventListener('focus', atualizarRelogio)
      document.removeEventListener('visibilitychange', atualizarRelogio)
    }
  }, [descanso])

  useEffect(() => {
    if (!descansoSaindo) return undefined
    const timeout = window.setTimeout(() => {
      setDescanso(null)
      setDescansoSaindo(false)
    }, 220)
    return () => window.clearTimeout(timeout)
  }, [descansoSaindo])

  useEffect(() => {
    const controller = new AbortController()
    const parametros = new URLSearchParams({
      ids: [...new Set([...EXERCICIOS_DE_EXEMPLO, ...CATALOGO_EXERCICIOS].map(({ id }) => id))].join(','),
    })

    async function carregarExercicios() {
      setCarregando(true)
      setErro('')

      try {
        const resposta = await fetch(`/api/exercises?${parametros}`, {
          signal: controller.signal,
        })
        const payload = await resposta.json()
        if (!resposta.ok) throw new Error(mensagemErroDaApi(payload))

        setImagens(new Map(payload.data.map((exercicio) => [exercicio.id, exercicio.imageUrl])))
      } catch (error) {
        // Sem fotos o treino continua funcionando; só avisa.
        if (error.name !== 'AbortError') setErro('Não foi possível carregar as fotos dos exercícios agora.')
      } finally {
        if (!controller.signal.aborted) setCarregando(false)
      }
    }

    carregarExercicios()
    return () => controller.abort()
  }, [])

  // A gravação no servidor acontece em segundo plano (fila de sincronização).
  function salvarTreino(atualizados) {
    onSalvarTreino(atualizados, dataSelecionada)
    setErroProgresso('')
    return true
  }

  function marcarSerie(exercicio, numero, inicio) {
    const registro = registroDoExercicio(sessao, exercicio.id)
    const marcada = registro.series.includes(numero)
    if (!salvarTreino(atualizarSerie(dados, dataSelecionada, exercicio, numero, inicio))) return
    if (!marcada) {
      setAgora(inicio)
      setDescansoSaindo(false)
      setDescanso({
        id: exercicio.id,
        nome: exercicio.nome,
        restante: exercicio.descanso,
        terminaEm: inicio + exercicio.descanso * 1000,
      })
    } else if (descanso?.id === exercicio.id) {
      fecharDescanso()
    }
  }

  function selecionarDia(data) {
    setDiaSelecionado(data)
    fecharDescanso()
  }

  function definirCarga(exercicio, carga) {
    try {
      salvarTreino(atualizarCarga(dados, dataSelecionada, exercicio.id, carga, exercicio))
    } catch (error) {
      setErroProgresso(error.message)
    }
  }

  function ajustarCarga(exercicio, delta) {
    const atual = registroDoExercicio(sessao, exercicio.id).carga ??
      ultimaCarga(dados, dataSelecionada, exercicio.id) ?? 0
    definirCarga(exercicio, Math.max(0, Math.round((atual + delta) * 2) / 2))
  }

  function digitarCarga(exercicio, texto) {
    if (texto.trim() === '') return definirCarga(exercicio, null)
    const carga = Number(texto.replace(',', '.'))
    if (Number.isFinite(carga) && carga >= 0 && carga <= 1000) definirCarga(exercicio, carga)
  }

  function finalizarTreino() {
    if (salvarTreino(encerrarSessao(dados, dataSelecionada, exercicios))) {
      fecharDescanso()
      // Concluir o treino de hoje já conta como presença na academia.
      if (ehHoje) onTreinoConcluido?.(dataSelecionada)
    }
  }

  function fecharDescanso() {
    if (descanso) setDescansoSaindo(true)
  }

  function continuarTreino() {
    const iniciado = proximoExercicio ? iniciarSessao(dados, dataSelecionada) : dados
    if ((iniciado !== dados || erroProgresso) && !salvarTreino(iniciado)) return
    const destino = proximoExercicio
      ? formularioRef.current.querySelector(`[data-exercicio="${proximoExercicio.id}"] .card-treino__proxima-serie`)
      : document.getElementById('concluir-treino')
    destino?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'center',
    })
    destino?.focus({ preventScroll: true })
  }

  function alternarPausa() {
    const instante = Date.now()
    setAgora(instante)
    setDescanso({
      ...descanso,
      restante: segundosRestantes(descanso, instante),
      terminaEm: descanso.terminaEm === null
        ? instante + descanso.restante * 1000
        : null,
    })
  }

  const totalConcluidos = exercicios.filter((exercicio) =>
    registroDoExercicio(sessao, exercicio.id).series.length === exercicio.series,
  ).length
  const todosExerciciosConcluidos =
    exercicios.length > 0 && totalConcluidos === exercicios.length

  return (
    <section className="cards-treinos" aria-label="Exercícios do treino">
      {!carregando && exercicios.length > 0 && (
        <ContadorDeExercios
          concluidos={totalConcluidos}
          total={exercicios.length}
          titulo={`Treino ${treino.letra} · ${treino.foco}`}
          dia={nomeDia}
          encerrado={treinoEncerrado}
        />
      )}

      {erroProgresso && (
        <p className="cards-treinos__estado cards-treinos__estado--erro" role="alert">
          {erroProgresso}
        </p>
      )}

      {erro && !carregando && (
        <p className="cards-treinos__aviso" role="status">
          {erro}
        </p>
      )}
      {carregando && <EsqueletoTreino />}
      {!carregando && exercicios.length === 0 && (
        <div className="cards-treinos__descanso">
          <div className="cards-treinos__descanso-dias">
            {diasUteis.map(({ nome, data }) => (
              <button key={nome} type="button" aria-pressed={chaveDoDia(data) === dataSelecionada} onClick={() => selecionarDia(data)}>
                {nome.slice(0, 3)} <b>{treinoDoDia(data, fichas)?.letra ?? '—'}</b>
              </button>
            ))}
          </div>
          <strong>Dia de descanso na sua ficha</strong>
          <p>Seu personal não colocou treino para {nomeDia?.toLowerCase() ?? 'este dia'}. Recupere bem e volte com tudo no próximo treino.</p>
        </div>
      )}

      {!carregando && exercicios.length > 0 && (
        <>
          <nav className="cards-treinos__filtros surgir" aria-label="Filtrar exercícios por dia da semana">
            {diasUteis.map(({ nome, data }) => {
              const selecionado = chaveDoDia(data) === chaveDoDia(diaSelecionado)
              return (
                <button
                  className={`cards-treinos__filtro${selecionado ? ' cards-treinos__filtro--ativo' : ''}`}
                  type="button"
                  key={nome}
                  aria-pressed={selecionado}
                  onClick={() => selecionarDia(data)}
                >
                  <span>{nome.slice(0, 3)}</span>
                  <strong className="cards-treinos__filtro-letra">{treinoDoDia(data, fichas)?.letra ?? '—'}</strong>
                  <small aria-hidden="true">{String(data.getDate()).padStart(2, '0')}</small>
                </button>
              )
            })}
          </nav>
          <div className="treino-sessao">
            <div>
              <strong>{treinoEncerrado ? 'Sessão concluída' : todosExerciciosConcluidos
                ? 'Pronto para finalizar' : sessao?.inicio ? 'Treino em andamento' : 'Tudo pronto para treinar'}</strong>
              <span>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(diaSelecionado)} · {seriesConcluidas}/{totalSeries} séries</span>
            </div>
            {treinoEncerrado ? (
              <a href="#treino-historico-titulo">Ver histórico</a>
            ) : (
              <button
                type="button"
                disabled={!dados || Boolean(erroProgresso)}
                onClick={continuarTreino}
              >
                {todosExerciciosConcluidos ? 'Ir para concluir' : sessao?.inicio ? 'Continuar treino' : 'Iniciar treino'}
                <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
          {(descanso || descansoSaindo) && (
            <aside
              className={`treino-descanso${descansoSaindo ? ' treino-descanso--saindo' : ''}`}
              aria-label="Cronômetro de descanso"
            >
              <div>
                <strong>{descanso.terminaEm === null ? 'Descanso pausado' : 'Descanso'}</strong>
                <small>{descanso.nome}</small>
              </div>
              <span className="treino-descanso__tempo">{formatarTempo(tempoRestante)}</span>
              <div className="treino-descanso__acoes">
                {tempoRestante > 0 && (
                  <button type="button" onClick={alternarPausa}>
                    {descanso.terminaEm === null ? 'Continuar' : 'Pausar'}
                  </button>
                )}
                <button type="button" onClick={fecharDescanso}>
                  {tempoRestante > 0 ? 'Pular' : 'Fechar'}
                </button>
              </div>
              {tempoRestante === 0 && <p role="status">Descanso concluído.</p>}
            </aside>
          )}
          <form className="cards-treinos__lista" ref={formularioRef} onSubmit={(event) => event.preventDefault()}>
            {exercicios.map((exercicio, index) => {
              const registro = registroDoExercicio(sessao, exercicio.id)
              const proxima = proximaSerie(sessao, exercicio)
              const concluido = proxima === null
              const anterior = dados ? ultimaCarga(dados, dataSelecionada, exercicio.id) : null
              const melhorAnterior = dados ? melhorCarga(dados, exercicio.id, dataSelecionada) : null
              const recorde = dados ? ehRecorde(dados, dataSelecionada, exercicio.id, registro.carga) : false
              return (
              <article
                className={`card-treino${concluido ? ' card-treino--concluido' : ''}${sessao?.inicio && proximoExercicio?.id === exercicio.id ? ' card-treino--proximo' : ''}`}
                key={`${dataSelecionada}:${exercicio.id}`}
                data-exercicio={exercicio.id}
              >
                <div className="card-treino__imagem">
                  <span className="card-treino__ordem">{String(index + 1).padStart(2, '0')}</span>
                  <span className="card-treino__seta-imagem" aria-hidden="true" />
                  <ImagemExercicio src={exercicio.imagem} nome={exercicio.nome} />
                </div>

                <div className="card-treino__conteudo">
                  <div className="card-treino__identificacao">
                    <div className="card-treino__etiquetas">
                      <span className="card-treino__grupo">{exercicio.grupo}</span>
                      {concluido && <span className="card-treino__status">✓ Feito</span>}
                      {!concluido && sessao?.inicio && proximoExercicio?.id === exercicio.id &&
                        <span className="card-treino__status card-treino__status--proximo">Próximo</span>}
                    </div>
                    <h3>
                      <button
                        className="card-treino__abrir"
                        type="button"
                        onClick={(event) => {
                          acionadorDetalheRef.current = event.currentTarget
                          setDetalhe(exercicio)
                        }}
                      >
                        {exercicio.nome}
                        <span>Ver demonstração →</span>
                      </button>
                    </h3>
                  </div>

                  <dl className="card-treino__detalhes">
                    <div className="card-treino__detalhe">
                      <dt>Séries</dt>
                      <dd>{exercicio.series}<span>x</span></dd>
                    </div>
                    <div className="card-treino__detalhe">
                      {exercicio.unidade === 'seg'
                        ? <dt><span className="rotulo-longo">Duração</span><abbr className="rotulo-curto" title="Duração">Tempo</abbr></dt>
                        : <dt><span className="rotulo-longo">Repetições</span><abbr className="rotulo-curto" title="Repetições">Reps</abbr></dt>}
                      <dd>
                        {exercicio.repeticoes}
                        {/* "8-10" ou "até a falha" já se explicam; a unidade só apertaria a coluna */}
                        {String(exercicio.repeticoes).length <= 3 && <span>{exercicio.unidade === 'seg' ? 'seg' : 'reps'}</span>}
                      </dd>
                    </div>
                    <div className="card-treino__detalhe">
                      <dt><span className="rotulo-longo">Descanso</span><abbr className="rotulo-curto" title="Descanso">Pausa</abbr></dt>
                      <dd>{exercicio.descanso}<span>seg</span></dd>
                    </div>
                  </dl>

                  {(exercicio.observacao || exercicio.carga) && (
                    <div className="card-treino__personal">
                      <span aria-hidden="true">💬</span>
                      <p>
                        {exercicio.carga && <b>Carga sugerida: {exercicio.carga}. </b>}
                        {exercicio.observacao}
                      </p>
                    </div>
                  )}
                  {exercicio.video && (
                    <button type="button" className="card-treino__video" onClick={() => setVideo(exercicio)}>
                      <span aria-hidden="true">▶</span> Vídeo do personal
                    </button>
                  )}

                </div>
                <div className="card-treino__registro">
                  {exercicio.unidade !== 'seg' && dados && (
                    <div className={`card-treino__carga${recorde ? ' card-treino__carga--recorde' : ''}`}>
                      <label htmlFor={`carga-${exercicio.id}`}>
                        <span>Carga</span>
                        <small role={recorde ? 'status' : undefined}>
                          {recorde
                            ? `🏆 Novo recorde! (antes ${formatarPeso(melhorAnterior)} kg)`
                            : anterior !== null ? `Última vez: ${formatarPeso(anterior)} kg` : 'Primeiro registro'}
                        </small>
                      </label>
                      <div className="card-treino__carga-controle">
                        <button
                          type="button"
                          aria-label={`Diminuir carga de ${exercicio.nome}`}
                          disabled={treinoEncerrado || !registro.carga}
                          onClick={() => ajustarCarga(exercicio, -PASSO_CARGA)}
                        >−</button>
                        <input
                          key={`${dataSelecionada}:${registro.carga}`}
                          id={`carga-${exercicio.id}`}
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder={anterior !== null ? formatarPeso(anterior) : '0'}
                          defaultValue={registro.carga === null ? '' : formatarPeso(registro.carga)}
                          disabled={treinoEncerrado}
                          onBlur={(event) => digitarCarga(exercicio, event.currentTarget.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') event.currentTarget.blur()
                          }}
                        />
                        <span aria-hidden="true">kg</span>
                        <button
                          type="button"
                          aria-label={`Aumentar carga de ${exercicio.nome}`}
                          disabled={treinoEncerrado}
                          onClick={() => ajustarCarga(exercicio, PASSO_CARGA)}
                        >+</button>
                      </div>
                    </div>
                  )}
                  <fieldset className="card-treino__series" disabled={!dados || treinoEncerrado}>
                    <legend>
                      <span>{concluido ? 'Séries concluídas' : 'Suas séries'}</span>
                      <span>{registro.series.length}/{exercicio.series}</span>
                    </legend>
                    <div>
                      {Array.from({ length: exercicio.series }, (_, indice) => {
                        const numero = indice + 1
                        const marcada = registro.series.includes(numero)
                        return (
                          <button
                            className={`card-treino__serie${marcada ? ' card-treino__serie--feita' : ''}`}
                            type="button"
                            key={numero}
                            aria-label={`Série ${numero} de ${exercicio.nome}`}
                            aria-pressed={marcada}
                            onClick={() => marcarSerie(exercicio, numero, Date.now())}
                          >
                            {marcada ? '✓' : numero}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                  {proxima !== null && proximoExercicio?.id === exercicio.id && !treinoEncerrado && (
                    <button
                      className="card-treino__proxima-serie"
                      type="button"
                      disabled={!dados}
                      aria-label={`Concluir série ${proxima} de ${exercicio.nome}`}
                      onClick={() => marcarSerie(exercicio, proxima, Date.now())}
                    >
                      <span>✓ Concluir série</span>
                      <span>{proxima} de {exercicio.series}</span>
                    </button>
                  )}
                </div>
              </article>
              )
            })}
          </form>
        </>
      )}

      {!carregando && !erro && exercicios.length > 0 && (
        <div className="cards-treinos__encerramento">
          <button
            id="concluir-treino"
            className={`cards-treinos__encerrar${todosExerciciosConcluidos ? ' cards-treinos__encerrar--ativo' : ''}${treinoEncerrado ? ' cards-treinos__encerrar--feito' : ''}`}
            type="button"
            disabled={!dados || Boolean(erroProgresso) || !todosExerciciosConcluidos || treinoEncerrado}
            onClick={finalizarTreino}
          >
            <span className="cards-treinos__encerrar-icone" aria-hidden="true">
              {todosExerciciosConcluidos ? (
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              )}
            </span>
            {treinoEncerrado
              ? 'Treino concluído'
              : todosExerciciosConcluidos
                ? `Concluir (${totalConcluidos} de ${exercicios.length})`
                : 'Conclua os exercícios para encerrar'}
          </button>
          {treinoEncerrado && (
            <div className="treino-resumo" role="status">
              <span className="treino-resumo__selo" aria-hidden="true">💪</span>
              <strong>Treino {treino.letra} amassado!</strong>
              <dl className="treino-resumo__numeros">
                <div>
                  <dt>Duração</dt>
                  <dd>{sessao.inicio === null ? '—' : formatarTempo(Math.floor((sessao.fim - sessao.inicio) / 1000))}</dd>
                </div>
                <div>
                  <dt>Séries</dt>
                  <dd>{Object.values(sessao.exercicios).reduce((total, registro) => total + registro.series.length, 0)}</dd>
                </div>
                <div>
                  <dt>Volume</dt>
                  <dd>{volumeDaSessao(sessao) > 0 ? formatarVolume(volumeDaSessao(sessao)) : '—'}</dd>
                </div>
              </dl>
              {recordesDaSessao(dados, dataSelecionada).length > 0 && (
                <ul className="treino-resumo__recordes" aria-label="Recordes batidos">
                  {recordesDaSessao(dados, dataSelecionada).map(({ exercicio, carga, anterior }) => (
                    <li key={exercicio.id}>
                      🏆 <strong>{exercicio.nome}</strong>: {formatarPeso(anterior)} → {formatarPeso(carga)} kg
                    </li>
                  ))}
                </ul>
              )}
              {ehHoje && <span className="treino-resumo__checkin">✓ Check-in de hoje registrado</span>}
              <small>{sessao.inicio === null
                ? 'O progresso anterior não possui horário de início.'
                : 'Duração desde o início do treino, incluindo descansos e tempo fora do app.'}</small>
            </div>
          )}
        </div>
      )}
      {dados && (
        <section className="treino-historico" aria-labelledby="treino-historico-titulo">
          <h2 id="treino-historico-titulo">Histórico de treinos</h2>
          <p>Salvo na sua conta.</p>
          {Object.values(dados.sessoes).every((registro) => !registro.fim) && (
            <p>Ao encerrar seu primeiro treino, ele aparece aqui.</p>
          )}
          {Object.entries(dados.sessoes).filter(([, registro]) => registro.fim)
            .sort(([a], [b]) => b.localeCompare(a)).map(([dia, registro]) => {
              const data = new Date(`${dia}T12:00:00`)
              const treinoDaData = treinoDoDia(data, fichas)
              const volume = volumeDaSessao(registro)
              const recordes = recordesDaSessao(dados, dia)
              return (
                <details key={dia}>
                  <summary>
                    {treinoDaData && <b className="treino-historico__letra">{treinoDaData.letra}</b>}
                    {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', weekday: 'short' }).format(data)}
                    {recordes.length > 0 && <em aria-label={`${recordes.length} recordes`}>🏆 {recordes.length}</em>}
                    <span>
                      {volume > 0 && `${formatarVolume(volume)} · `}
                      {registro.inicio === null ? 'Sem duração' : formatarTempo(Math.floor((registro.fim - registro.inicio) / 1000))}
                    </span>
                  </summary>
                  <ul>
                    {Object.keys(registro.exercicios).map((id) => exercicioDoRegistro(id, registro.exercicios[id])).filter(Boolean)
                      .map((exercicio) => {
                        const item = registro.exercicios[exercicio.id]
                        return (
                          <li key={exercicio.id}>
                            <strong>{exercicio.nome}</strong>
                            <span>
                              {item.series.length} séries · {item.reps ?? exercicio.repeticoes} {exercicio.unidade === 'seg' ? 'seg' : 'reps'}
                              {exercicio.unidade !== 'seg' && ` · ${item.carga === null ? 'Carga não registrada' : `${formatarPeso(item.carga)} kg`}`}
                            </span>
                          </li>
                        )
                      })}
                  </ul>
                </details>
              )
            })}
        </section>
      )}
      {detalhe && (
        <DetalhesExercicio
          exercicio={detalhe}
          acionadorRef={acionadorDetalheRef}
          onFechar={() => setDetalhe(null)}
        />
      )}
      <VideoDoPersonal exercicio={video} onFechar={() => setVideo(null)} />
    </section>
  )
}

export default CardsTreinos
