import { chaveDoDia, chaveDoMes, inicioDaSemana } from '../utils/checkins.js'
import { variacaoDePeso } from '../utils/perfil.js'
import {
  formatarPeso, formatarVolume, recordesPessoais, sessoesFinalizadas, volumeDaSessao,
} from './area-treinos/treinoLocal.js'
import './ResultadosMes.css'

const formatoDiaMes = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
const DIAS_UTEIS_POR_SEMANA = 5

function ehDiaUtil(data) {
  return data.getDay() !== 0 && data.getDay() !== 6
}

// Semanas (segunda a sexta) que têm pelo menos um dia útil dentro do mês.
function semanasDoMes(agora, checkinsDoMes) {
  const ano = agora.getFullYear()
  const mes = agora.getMonth()
  const ultimoDia = new Date(ano, mes + 1, 0, 12)
  const hoje = chaveDoDia(agora)
  const semanas = []
  const segunda = inicioDaSemana(new Date(ano, mes, 1, 12))

  while (segunda <= ultimoDia) {
    const sexta = new Date(segunda)
    sexta.setDate(segunda.getDate() + 4)
    const inicio = segunda.getMonth() === mes ? new Date(segunda) : new Date(ano, mes, 1, 12)
    const fim = new Date(sexta.getMonth() === mes ? sexta : ultimoDia)
    while (!ehDiaUtil(fim) && fim > inicio) fim.setDate(fim.getDate() - 1)

    if (inicio <= fim && ehDiaUtil(inicio)) {
      const domingo = new Date(segunda)
      domingo.setDate(segunda.getDate() + 6)
      const de = chaveDoDia(inicio)
      const ate = chaveDoDia(fim)
      semanas.push({
        numero: semanas.length + 1,
        inicio,
        fim,
        treinos: [...checkinsDoMes].filter((dia) => dia >= de && dia <= ate).length,
        futura: de > hoje,
        atual: chaveDoDia(segunda) <= hoje && hoje <= chaveDoDia(domingo),
      })
    }
    segunda.setDate(segunda.getDate() + 7)
  }
  return semanas
}

function diasUteisAteHoje(agora) {
  let total = 0
  for (let dia = 1; dia <= agora.getDate(); dia++) {
    if (ehDiaUtil(new Date(agora.getFullYear(), agora.getMonth(), dia))) total++
  }
  return total
}

function ResultadosMes({ checkins, treinos, perfil }) {
  const agora = new Date()
  const meta = perfil.metaSemanal
  const chaveMes = chaveDoMes(agora)
  const checkinsDoMes = new Set(checkins.filter((data) => data.startsWith(`${chaveMes}-`)))
  const diasTreinados = checkinsDoMes.size
  const diasUteis = diasUteisAteHoje(agora)
  const frequencia = diasUteis ? Math.min(100, Math.round((diasTreinados / diasUteis) * 100)) : 0
  const maiorRecorde = recordesPessoais(treinos)[0]
  const variacao = variacaoDePeso(perfil.pesos)
  const sessoesDoMes = sessoesFinalizadas(treinos).filter(([dia]) => dia.startsWith(`${chaveMes}-`))
  const volumeMes = sessoesDoMes.reduce((total, [, sessao]) => total + volumeDaSessao(sessao), 0)
  const mesAtual = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(agora)
  const mesCurto = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })
    .format(agora).replace('.', '')

  const semanas = semanasDoMes(agora, checkinsDoMes)
  const escala = Math.max(DIAS_UTEIS_POR_SEMANA, ...semanas.map(({ treinos: total }) => total))
  const semanasJogadas = semanas.filter(({ futura }) => !futura)
  const semanasNaMeta = semanasJogadas.filter(({ treinos: total }) => total >= meta).length
  const intervalo = ({ inicio, fim }) =>
    inicio.getDate() === fim.getDate()
      ? String(inicio.getDate()).padStart(2, '0')
      : `${String(inicio.getDate()).padStart(2, '0')}–${String(fim.getDate()).padStart(2, '0')}`

  return (
    <section className="resultados-mes" aria-labelledby="resultados-mes-titulo">
      <div className="resultados-mes__topo">
        <div>
          <span className="resultados-mes__sobretitulo">Acompanhamento</span>
          <h2 id="resultados-mes-titulo">Seu mês</h2>
        </div>
        <span className="resultados-mes__periodo">{mesCurto}</span>
      </div>

      <article className="resultado-dias">
        <div className="resultado-dias__cabeca">
          <span className="resultado-dias__numero">{diasTreinados}</span>
          <div className="resultado-dias__texto">
            <strong>{diasTreinados === 1 ? 'dia ativo' : 'dias ativos'}</strong>
            <small>de {diasUteis} {diasUteis === 1 ? 'dia útil' : 'dias úteis'} até hoje</small>
          </div>
        </div>
        <div
          className="resultado-dias__barra"
          role="meter"
          aria-label="Frequência no mês"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={frequencia}
        >
          <i style={{ width: `${frequencia}%` }} />
        </div>
        <div className="resultado-dias__rodape">
          <span><b>{frequencia}%</b> de frequência</span>
          <span><b>{semanasNaMeta}</b>/{semanasJogadas.length} semanas na meta</span>
        </div>
      </article>

      <div className="resultados-mes__grafico-secao">
        <div className="resultados-mes__atividade-topo">
          <div>
            <h3>Check-ins por semana</h3>
            <p>Segunda a sexta · meta de {meta}x por semana</p>
          </div>
          <ul className="resultados-mes__legenda" aria-label="Legenda">
            <li><i className="na-meta" aria-hidden="true" />Meta batida</li>
            <li><i aria-hidden="true" />Abaixo</li>
          </ul>
        </div>

        <div className="resultados-mes__grafico" style={{ '--colunas': semanas.length }}>
          <div className="resultados-mes__area">
            <div className="resultados-mes__meta" style={{ bottom: `${(meta / escala) * 100}%` }} aria-hidden="true">
              <span>meta {meta}x</span>
            </div>
            {semanas.map((semana) => {
              const naMeta = semana.treinos >= meta
              const descricao = semana.futura
                ? 'semana ainda não começou'
                : `${semana.treinos} ${semana.treinos === 1 ? 'check-in' : 'check-ins'}${naMeta ? ', meta batida' : ''}`
              return (
                <div
                  key={semana.numero}
                  className={`resultados-mes__coluna${semana.atual ? ' atual' : ''}${semana.futura ? ' futura' : ''}`}
                  tabIndex={0}
                  aria-label={`Semana ${semana.numero}, dias ${intervalo(semana)}: ${descricao}`}
                >
                  {!semana.futura && (
                    <>
                      <span className="resultados-mes__valor">{semana.treinos}</span>
                      <span
                        className={`resultados-mes__barra${naMeta ? ' na-meta' : ''}${semana.treinos === 0 ? ' vazia' : ''}`}
                        style={{ height: `${(semana.treinos / escala) * 100}%` }}
                      />
                    </>
                  )}
                  <span className="resultados-mes__dica" aria-hidden="true">
                    <b>Semana {semana.numero} · {intervalo(semana)}</b>
                    {descricao}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="resultados-mes__rotulos" aria-hidden="true">
            {semanas.map((semana) => (
              <span key={semana.numero} className={semana.atual ? 'atual' : ''}>
                {semana.atual ? 'Agora' : `S${semana.numero}`}
                <small>{intervalo(semana)}</small>
              </span>
            ))}
          </div>
        </div>

        {diasTreinados === 0 && (
          <p className="resultados-mes__vazio">
            Seu histórico aparece aqui depois do primeiro check-in.
          </p>
        )}
      </div>

      <div className="resultados-mes__indicadores-topo">
        <h3>Outros indicadores</h3>
        <span>{mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1)}</span>
      </div>
      <div className="resultados-mes__grade">
        <article className="indicador indicador--treinos">
          <span className="indicador__icone" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5 10 17l9-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="indicador__rotulo">Treinos concluídos</span>
          <strong className="indicador__valor">{sessoesDoMes.length}</strong>
          <small className="indicador__detalhe">
            {sessoesDoMes.length ? 'finalizados no mês' : 'Finalize um treino na aba Treino'}
          </small>
        </article>

        <article className="indicador indicador--carga">
          <span className="indicador__icone" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 9v6m4-9v12m8-12v12m4-9v6M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="indicador__rotulo">Maior carga</span>
          {maiorRecorde ? (
            <>
              <strong className="indicador__valor">{formatarPeso(maiorRecorde.carga)}<small>kg</small></strong>
              <small className="indicador__detalhe">{maiorRecorde.exercicio.nome}</small>
            </>
          ) : (
            <>
              <strong className="indicador__valor indicador__valor--vazio">—</strong>
              <small className="indicador__detalhe">Registre cargas no treino</small>
            </>
          )}
        </article>

        <article className="indicador indicador--volume">
          <span className="indicador__icone" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 20V10m6 10V4m6 16v-7m4 7H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="indicador__rotulo">Volume levantado</span>
          {volumeMes > 0 ? (
            <>
              <strong className="indicador__valor">{formatarVolume(volumeMes)}</strong>
              <small className="indicador__detalhe">carga × reps no mês</small>
            </>
          ) : (
            <>
              <strong className="indicador__valor indicador__valor--vazio">—</strong>
              <small className="indicador__detalhe">Sem treinos com carga</small>
            </>
          )}
        </article>

        <article className="indicador indicador--peso">
          <span className="indicador__icone" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="4" y="3" width="16" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 7h8m-4 0-2 3m2-3 2 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="indicador__rotulo">Variação de peso</span>
          {variacao ? (
            <>
              <strong className="indicador__valor">
                {variacao.diferenca === 0 ? '' : variacao.diferenca > 0 ? '↑ ' : '↓ '}
                {formatarPeso(Math.abs(variacao.diferenca))}<small>kg</small>
              </strong>
              <small className="indicador__detalhe">
                desde {formatoDiaMes.format(new Date(`${variacao.desde}T12:00:00`)).replace('.', '')}
              </small>
            </>
          ) : (
            <>
              <strong className="indicador__valor indicador__valor--vazio">—</strong>
              <small className="indicador__detalhe">Pese-se na aba Conta</small>
            </>
          )}
        </article>
      </div>

    </section>
  )
}

export default ResultadosMes
