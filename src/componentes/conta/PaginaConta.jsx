import { useState } from 'react'
import Header from '../Header.jsx'
import { chaveDoDia } from '../../utils/checkins.js'
import { calcularConquistas } from '../../utils/conquistas.js'
import { registrarPeso, removerPeso, variacaoDePeso } from '../../utils/perfil.js'
import { formatarTelefone, somenteDigitos, telefoneValido } from '../../utils/telefone.js'
import { formatarPeso, recordesPessoais } from '../area-treinos/treinoLocal.js'
import './PaginaConta.css'

const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

function dataCurta(dia) {
  return formatoData.format(new Date(`${dia}T12:00:00`)).replace('.', '')
}

function PaginaConta({ perfil, email, onAlterarPerfil, onSair, onAbrirPainel, checkins, treinos }) {
  const [pesoDigitado, setPesoDigitado] = useState('')
  const [erroPeso, setErroPeso] = useState('')
  const [telefoneDigitado, setTelefoneDigitado] = useState(() => formatarTelefone(perfil.telefone))
  const telefoneIncompleto = telefoneDigitado !== '' && !telefoneValido(telefoneDigitado)
  const conquistas = calcularConquistas({ checkins, treinos, metaSemanal: perfil.metaSemanal })
  const desbloqueadas = conquistas.filter(({ conquistada }) => conquistada).length
  const recordes = recordesPessoais(treinos)
  const variacao = variacaoDePeso(perfil.pesos)
  const ultimosPesos = [...perfil.pesos].reverse().slice(0, 6)
  const pesoAtual = perfil.pesos.at(-1)

  // Só grava quando o número está completo; enquanto digita, fica só na tela.
  function digitarTelefone(texto) {
    const formatado = formatarTelefone(texto)
    setTelefoneDigitado(formatado)
    if (telefoneValido(formatado)) onAlterarPerfil({ ...perfil, telefone: somenteDigitos(formatado) })
  }

  function salvarPeso(event) {
    event.preventDefault()
    try {
      onAlterarPerfil(registrarPeso(perfil, chaveDoDia(new Date()), Number(pesoDigitado.replace(',', '.'))))
      setPesoDigitado('')
      setErroPeso('')
    } catch (error) {
      setErroPeso(error.message)
    }
  }

  return (
    <>
      <Header
        titulo={perfil.nome || 'Seu perfil'}
        saudacao=""
        contexto="Minha conta"
        descricao="Suas metas, evolução, recordes e conquistas."
      />

      <div className="conta">
        <section className="conta-card conta-perfil" aria-labelledby="conta-perfil-titulo">
          <h2 id="conta-perfil-titulo">Perfil</h2>
          <label className="conta-campo">
            <span>Como quer ser chamado?</span>
            <input
              type="text"
              maxLength={40}
              autoComplete="given-name"
              placeholder="Seu nome"
              value={perfil.nome}
              onChange={(event) => onAlterarPerfil({ ...perfil, nome: event.target.value })}
            />
          </label>

          <label className="conta-campo">
            <span>WhatsApp</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="(00) 00000-0000"
              aria-invalid={telefoneIncompleto}
              aria-describedby="conta-telefone-dica"
              value={telefoneDigitado}
              onChange={(event) => digitarTelefone(event.target.value)}
            />
            <small id="conta-telefone-dica" className={telefoneIncompleto ? 'conta-campo__dica conta-campo__dica--erro' : 'conta-campo__dica'}>
              {telefoneIncompleto ? 'Número incompleto: use DDD + número.' : 'A academia usa para avisos e contato.'}
            </small>
          </label>

          <fieldset className="conta-meta">
            <legend>Meta semanal de treinos</legend>
            <div>
              {[2, 3, 4, 5].map((meta) => (
                <button
                  key={meta}
                  type="button"
                  aria-pressed={perfil.metaSemanal === meta}
                  className={perfil.metaSemanal === meta ? 'ativo' : ''}
                  onClick={() => onAlterarPerfil({ ...perfil, metaSemanal: meta })}
                >
                  {meta}x
                </button>
              ))}
            </div>
            <small>Sua sequência 🔥 conta as semanas em que você bate essa meta.</small>
          </fieldset>
        </section>

        <section className="conta-card conta-peso" aria-labelledby="conta-peso-titulo">
          <div className="conta-card__topo">
            <h2 id="conta-peso-titulo">Peso corporal</h2>
            {variacao && (
              <span className={`conta-peso__variacao${variacao.diferenca > 0 ? ' subiu' : variacao.diferenca < 0 ? ' desceu' : ''}`}>
                {variacao.diferenca > 0 ? '▲ +' : variacao.diferenca < 0 ? '▼ ' : ''}{formatarPeso(variacao.diferenca)} kg desde {dataCurta(variacao.desde)}
              </span>
            )}
          </div>
          <div className="conta-peso__atual">
            <strong>{pesoAtual ? formatarPeso(pesoAtual.kg) : '--'}</strong>
            <span>kg {pesoAtual && `· ${dataCurta(pesoAtual.dia)}`}</span>
          </div>
          <form className="conta-peso__form" onSubmit={salvarPeso}>
            <label htmlFor="conta-peso-input" className="visualmente-oculto">Peso de hoje em kg</label>
            <input
              id="conta-peso-input"
              type="text"
              inputMode="decimal"
              placeholder="Peso hoje (kg)"
              value={pesoDigitado}
              onChange={(event) => setPesoDigitado(event.target.value)}
            />
            <button type="submit" disabled={!pesoDigitado.trim()}>Registrar</button>
          </form>
          {erroPeso && <p className="conta__erro" role="alert">{erroPeso}</p>}
          {ultimosPesos.length > 0 && (
            <ul className="conta-peso__lista">
              {ultimosPesos.map(({ dia, kg }, indice) => {
                const anterior = ultimosPesos[indice + 1]
                const diferenca = anterior ? Math.round((kg - anterior.kg) * 10) / 10 : null
                return (
                  <li key={dia}>
                    <span>{dataCurta(dia)}</span>
                    <strong>{formatarPeso(kg)} kg</strong>
                    <em>{diferenca === null || diferenca === 0 ? '' : `${diferenca > 0 ? '+' : ''}${formatarPeso(diferenca)}`}</em>
                    <button
                      type="button"
                      aria-label={`Remover registro de ${dataCurta(dia)}`}
                      onClick={() => onAlterarPerfil(removerPeso(perfil, dia))}
                    >✕</button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="conta-card conta-recordes" aria-labelledby="conta-recordes-titulo">
          <div className="conta-card__topo">
            <h2 id="conta-recordes-titulo">🏆 Recordes pessoais</h2>
            <span>{recordes.length}</span>
          </div>
          {recordes.length === 0 ? (
            <p className="conta__vazio">Registre a carga dos exercícios e conclua o treino para ver seus recordes aqui.</p>
          ) : (
            <ol className="conta-recordes__lista">
              {recordes.map(({ exercicio, carga, dia }) => (
                <li key={exercicio.id}>
                  <div>
                    <strong>{exercicio.nome}</strong>
                    <span>{exercicio.grupo} · {dataCurta(dia)}</span>
                  </div>
                  <b>{formatarPeso(carga)}<small>kg</small></b>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="conta-card conta-conquistas" aria-labelledby="conta-conquistas-titulo">
          <div className="conta-card__topo">
            <h2 id="conta-conquistas-titulo">Conquistas</h2>
            <span>{desbloqueadas}/{conquistas.length}</span>
          </div>
          <ul className="conta-conquistas__grade">
            {conquistas.map((conquista) => (
              <li
                key={conquista.id}
                className={conquista.conquistada ? 'conquistada' : ''}
                aria-label={`${conquista.titulo}: ${conquista.descricao}. ${conquista.conquistada ? 'Desbloqueada' : `Progresso ${conquista.atual} de ${conquista.alvo}`}`}
              >
                <span className="conta-conquistas__icone" aria-hidden="true">{conquista.icone}</span>
                <strong>{conquista.titulo}</strong>
                <small>{conquista.descricao}</small>
                {!conquista.conquistada && (
                  <span className="conta-conquistas__barra" aria-hidden="true">
                    <i style={{ width: `${Math.min(100, (conquista.atual / conquista.alvo) * 100)}%` }} />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="conta-card conta-sessao" aria-labelledby="conta-sessao-titulo">
          <h2 id="conta-sessao-titulo">Conta</h2>
          <div className="conta-sessao__linha">
            <span className="conta-sessao__avatar" aria-hidden="true">
              {(perfil.nome || email || '?').trim().charAt(0).toUpperCase()}
            </span>
            <div>
              <small>Conectado como</small>
              <strong>{email}</strong>
            </div>
          </div>
          {onAbrirPainel && (
            <button type="button" className="conta-sessao__painel" onClick={onAbrirPainel}>
              Abrir painel da academia
            </button>
          )}
          <button type="button" className="conta-sessao__sair" onClick={onSair}>
            Sair da conta
          </button>
        </section>

        <p className="conta__nota">Seus dados ficam salvos na sua conta e aparecem em qualquer aparelho.</p>
      </div>
    </>
  )
}

export default PaginaConta
