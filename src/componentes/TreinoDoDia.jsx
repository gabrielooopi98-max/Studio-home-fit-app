import { chaveDoDia } from '../utils/checkins.js'
import {
  PLANO_SEMANAL, duracaoEstimada, exerciciosDoTreino, proximoTreino, registroDoExercicio, treinoDoDia,
} from './area-treinos/treinoLocal.js'
import './TreinoDoDia.css'

function TreinoDoDia({ treinos, fichas, onAbrirTreino }) {
  const hoje = new Date()
  const treino = treinoDoDia(hoje, fichas)

  if (!treino) {
    const seguinte = proximoTreino(hoje, fichas)
    const proximo = seguinte?.treino ?? PLANO_SEMANAL[0]
    return (
      <section className="treino-hoje treino-hoje--descanso" aria-labelledby="treino-hoje-titulo">
        <span className="treino-hoje__eyebrow">Hoje</span>
        <h2 id="treino-hoje-titulo">Dia de descanso</h2>
        <p>
          Músculo cresce na recuperação. Durma bem, hidrate-se e volte com tudo {seguinte?.nomeDoDia === 'amanhã' ? 'amanhã' : `na ${seguinte?.nomeDoDia ?? 'segunda'}`}:
          <strong> Treino {proximo.letra} · {proximo.foco}</strong>.
        </p>
        <button className="treino-hoje__botao treino-hoje__botao--secundario" type="button" onClick={onAbrirTreino}>
          Ver treinos da semana <span aria-hidden="true">→</span>
        </button>
      </section>
    )
  }

  const exercicios = exerciciosDoTreino(treino)
  const sessao = treinos.sessoes[chaveDoDia(hoje)]
  const totalSeries = exercicios.reduce((total, exercicio) => total + exercicio.series, 0)
  const seriesFeitas = exercicios.reduce((total, exercicio) =>
    total + registroDoExercicio(sessao, exercicio.id).series.length, 0)
  const status = sessao?.fim ? 'concluido' : sessao?.inicio || seriesFeitas > 0 ? 'andamento' : 'novo'
  const grupos = [...new Set(exercicios.map((exercicio) => exercicio.grupo).filter(Boolean))]
  const progresso = totalSeries ? Math.round((seriesFeitas / totalSeries) * 100) : 0

  return (
    <section className={`treino-hoje treino-hoje--${status}`} aria-labelledby="treino-hoje-titulo">
      <div className="treino-hoje__topo">
        <div>
          <span className="treino-hoje__eyebrow">Treino de hoje</span>
          <h2 id="treino-hoje-titulo">{treino.foco}</h2>
        </div>
        <span className="treino-hoje__letra" aria-label={`Treino ${treino.letra}`}>{treino.letra}</span>
      </div>

      <ul className="treino-hoje__info">
        <li><strong>{exercicios.length}</strong> exercícios</li>
        <li><strong>{totalSeries}</strong> séries</li>
        <li><strong>~{duracaoEstimada(exercicios)}</strong> min</li>
      </ul>

      <ul className="treino-hoje__grupos" aria-label="Grupos musculares">
        {grupos.map((grupo) => <li key={grupo}>{grupo}</li>)}
      </ul>

      {status === 'andamento' && (
        <div className="treino-hoje__progresso">
          <span>Em andamento · {seriesFeitas}/{totalSeries} séries</span>
          <div aria-hidden="true"><i style={{ width: `${progresso}%` }} /></div>
        </div>
      )}

      <button className="treino-hoje__botao" type="button" onClick={onAbrirTreino}>
        {status === 'concluido' ? '✓ Treino concluído · ver resumo'
          : status === 'andamento' ? 'Continuar treino' : 'Começar treino'}
        <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}

export default TreinoDoDia
