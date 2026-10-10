import './CheckInCard.css'
import { DIAS, chaveDoDia, diasDaSemana } from '../utils/checkins.js'

function CheckinCard({ checkins, meta, onCheckin }) {
  const hoje = chaveDoDia(new Date())
  const jaFezHoje = checkins.includes(hoje)
  // A academia só abre de segunda a sexta.
  const semana = diasDaSemana().slice(0, 5)
  const academiaFechada = [0, 6].includes(new Date().getDay())
  const totalSemana = semana.filter((dia) =>
    checkins.includes(chaveDoDia(dia)),
  ).length
  const faltam = Math.max(0, meta - totalSemana)
  const progressoMeta = Math.min(100, Math.round((totalSemana / meta) * 100))

  function fazerCheckin() {
    if (jaFezHoje || academiaFechada) return
    onCheckin(hoje)
  }

  return (
    <main className="checkin-page">
      <section className="checkin-card" aria-labelledby="checkin-titulo">
        <div className="checkin-topo">
          <div className="checkin-mensagem">
            <span className="checkin-eyebrow">Check-in diário</span>
            <h1 id="checkin-titulo">
              {jaFezHoje ? 'Presença confirmada' : 'Bora treinar hoje?'}
            </h1>
            <p>
              {faltam === 0
                ? 'Meta da semana batida! 🔥'
                : `Faltam ${faltam} ${faltam === 1 ? 'treino' : 'treinos'} para sua meta da semana.`}
            </p>
          </div>
          <div
            className={`checkin-contador${faltam === 0 ? ' checkin-contador--meta' : ''}`}
            role="img"
            aria-label={`${totalSemana} de ${meta} check-ins da meta semanal`}
            style={{ '--meta': `${progressoMeta}%` }}
          >
            <strong>{totalSemana}<small>/{meta}</small></strong>
            <span>meta</span>
          </div>
        </div>

        <div className="checkin-semana" aria-label="Check-ins desta semana">
          {semana.map((dia) => {
            const chave = chaveDoDia(dia)
            const treinou = checkins.includes(chave)
            const ehHoje = chave === hoje

            return (
              <div
                key={chave}
                className={`checkin-dia${ehHoje ? ' hoje' : ''}`}
                aria-label={`${DIAS[dia.getDay()]}, dia ${dia.getDate()}${treinou ? ', check-in feito' : ''}${ehHoje ? ', hoje' : ''}`}
              >
                <small>{DIAS[dia.getDay()]}</small>
                <span className={treinou ? 'feito' : ''}>
                  {treinou ? '✓' : dia.getDate()}
                </span>
              </div>
            )
          })}
        </div>

        {academiaFechada ? (
          <div className="checkin-fechado" role="status">
            Academia fechada hoje · volte na segunda
          </div>
        ) : jaFezHoje ? (
          <div className="checkin-feito" role="status">
            <span aria-hidden="true">✓</span> Check-in feito hoje
          </div>
        ) : (
          <button className="checkin-botao" type="button" onClick={fazerCheckin}>
            Marcar presença
            <span aria-hidden="true">→</span>
          </button>
        )}
      </section>
    </main>
  )
}

export default CheckinCard
