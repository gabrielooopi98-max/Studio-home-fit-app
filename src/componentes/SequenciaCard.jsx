import { sequenciaDeSemanas, ultimasSemanas } from '../utils/checkins.js'
import { recordesPessoais, sessoesFinalizadas } from './area-treinos/treinoLocal.js'
import './SequenciaCard.css'

function SequenciaCard({ checkins, meta, treinos, onAbrirConta }) {
  const { atual, melhor } = sequenciaDeSemanas(checkins, meta)
  const semanas = ultimasSemanas(checkins, 8)
  const totalTreinos = sessoesFinalizadas(treinos).length
  const totalRecordes = recordesPessoais(treinos).length
  const formatoSemana = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })

  return (
    <section className={`sequencia${atual > 0 ? ' sequencia--ativa' : ''}`} aria-labelledby="sequencia-titulo">
      <div className="sequencia__topo">
        <span className="sequencia__fogo" aria-hidden="true">🔥</span>
        <div>
          <span className="sequencia__eyebrow">Sequência</span>
          <h2 id="sequencia-titulo">
            <strong>{atual}</strong> {atual === 1 ? 'semana' : 'semanas'} na meta
          </h2>
          <p>
            {atual === 0
              ? `Treine ${meta}x nesta semana para acender sua sequência.`
              : `Melhor marca: ${melhor} ${melhor === 1 ? 'semana' : 'semanas'}. Não deixe apagar!`}
          </p>
        </div>
      </div>

      <div className="sequencia__semanas" role="img" aria-label={`Últimas 8 semanas: ${semanas.map(({ total }) => total).join(', ')} check-ins`}>
        {semanas.map(({ inicio, total }, indice) => (
          <div
            key={inicio.toISOString()}
            className={`sequencia__semana${total >= meta ? ' sequencia__semana--meta' : total > 0 ? ' sequencia__semana--parcial' : ''}${indice === semanas.length - 1 ? ' sequencia__semana--atual' : ''}`}
            title={`Semana de ${formatoSemana.format(inicio)}: ${total} check-ins`}
          >
            <i style={{ height: `${Math.min(100, (total / meta) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="sequencia__legenda" aria-hidden="true">
        <span>8 semanas atrás</span>
        <span>Esta semana</span>
      </div>

      <button className="sequencia__rodape" type="button" onClick={onAbrirConta}>
        <span><strong>{totalTreinos}</strong> treinos</span>
        <span><strong>{totalRecordes}</strong> recordes</span>
        <span className="sequencia__link">Ver recordes →</span>
      </button>
    </section>
  )
}

export default SequenciaCard
