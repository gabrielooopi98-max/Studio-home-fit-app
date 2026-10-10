import { useEffect, useState } from 'react'
import { supabase } from '../dados/supabase.js'
import { Bloco, CardEsqueleto, Carregando } from '../componentes/Esqueleto.jsx'
import {
  dataCurta, diasDoTreinoTexto, fichaAnteriorAoMes, fichaDoMes, fichaDoModelo, limitesDoMes, mesDe, mesSugerido, noMes, nomeDoMes, somarMeses,
} from '../utils/ficha.js'
import CabecalhoPagina from './CabecalhoPagina.jsx'
import { Avatar } from './comum.jsx'
import { excluirModelo, listarModelos } from './dadosAdmin.js'

function AbaDoMes({ alunos, hoje, mes, ir, onMes, onEnviar }) {
  const [mostrar, setMostrar] = useState('faltam')
  const comTreino = alunos.filter((aluno) => fichaDoMes(aluno.fichas, mes))
  const faltam = alunos.filter((aluno) => !fichaDoMes(aluno.fichas, mes))
  const lista = mostrar === 'faltam' ? faltam : comTreino
  const porcentagem = alunos.length ? Math.round((comTreino.length / alunos.length) * 100) : 0
  const mesAtual = mesDe(hoje)

  return (
    <>
      <section className="adm-painel-card adm-mes" aria-label={`Treinos de ${nomeDoMes(mes)}`}>
        <div className="adm-mes__troca">
          <button type="button" aria-label="Mês anterior" onClick={() => onMes(somarMeses(mes, -1))}>‹</button>
          <b>{nomeDoMes(mes, { ano: true })}{mes === mesAtual && <small>este mês</small>}</b>
          <button type="button" aria-label="Próximo mês" onClick={() => onMes(somarMeses(mes, 1))}
            disabled={mes >= somarMeses(mesAtual, 1)}>›</button>
        </div>
        <div className="adm-mes__progresso">
          <p><b>{comTreino.length} de {alunos.length}</b> alunos já receberam o treino de {nomeDoMes(mes)}</p>
          <div className="adm-barra-progresso" role="progressbar" aria-valuenow={porcentagem} aria-valuemin={0} aria-valuemax={100}
            aria-label="Treinos enviados">
            <span style={{ width: `${porcentagem}%` }} />
          </div>
        </div>
      </section>

      <div className="adm-ferramentas">
        <div className="adm-segmento" role="group" aria-label="Mostrar">
          <button type="button" aria-pressed={mostrar === 'faltam'} onClick={() => setMostrar('faltam')}>
            Falta enviar <small>{faltam.length}</small>
          </button>
          <button type="button" aria-pressed={mostrar === 'enviados'} onClick={() => setMostrar('enviados')}>
            Já enviado <small>{comTreino.length}</small>
          </button>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="adm-aviso">
          {mostrar === 'faltam'
            ? <><strong>Tudo certo!</strong><p>Todos os alunos já têm o treino de {nomeDoMes(mes)}.</p></>
            : <p>Ninguém recebeu o treino de {nomeDoMes(mes)} ainda.</p>}
        </div>
      ) : (
        <ul className="adm-lista-fichas">
          {lista.map((aluno) => {
            const doMes = fichaDoMes(aluno.fichas, mes)
            const anterior = fichaAnteriorAoMes(aluno.fichas, mes)
            return (
              <li key={aluno.id} className="adm-painel-card">
                <button type="button" className="adm-pessoa" onClick={() => ir({ pagina: 'aluno', id: aluno.id, aba: 'treino' })}>
                  <Avatar nome={aluno.nome} />
                  <span>
                    <b>{aluno.nome}</b>
                    <small>
                      {doMes ? `${doMes.titulo} · ${dataCurta(doMes.inicio)} a ${dataCurta(doMes.fim)}`
                        : anterior ? `Último treino: ${dataCurta(anterior.inicio)} a ${dataCurta(anterior.fim)}` : 'Ainda não recebeu treino'}
                    </small>
                  </span>
                </button>
                {doMes && (
                  <span className="adm-lista-fichas__treinos" aria-label="Treinos">
                    {doMes.treinos.map((treino) => (
                      <span key={treino.letra} title={`${treino.nome || `Treino ${treino.letra}`} · ${diasDoTreinoTexto(treino.dias)}`}>{treino.letra}</span>
                    ))}
                  </span>
                )}
                <span className="adm-lista-fichas__acoes">
                  {doMes ? (
                    <button type="button" className="adm-botao adm-botao--pequeno adm-botao--secundario"
                      onClick={() => onEnviar({ aluno, ficha: doMes, mes })}>Editar</button>
                  ) : (
                    <button type="button" className="adm-botao adm-botao--pequeno" onClick={() => onEnviar({ aluno, mes })}>
                      Enviar treino
                    </button>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

function AbaModelos({ alunos, hoje, onEnviar, onEditarModelo }) {
  const [estado, setEstado] = useState({ carregando: true, disponivel: true, modelos: [], erro: '' })
  const [versao, setVersao] = useState(0)
  const [aplicando, setAplicando] = useState(null)
  const [alunoEscolhido, setAlunoEscolhido] = useState('')
  const [confirmando, setConfirmando] = useState(null)

  useEffect(() => {
    let ativo = true
    listarModelos(supabase)
      .then(({ disponivel, modelos }) => { if (ativo) setEstado({ carregando: false, disponivel, modelos, erro: '' }) })
      .catch((erro) => { if (ativo) setEstado((anterior) => ({ ...anterior, carregando: false, erro: erro.message })) })
    return () => { ativo = false }
  }, [versao])

  async function excluir(modelo) {
    if (confirmando !== modelo.id) return setConfirmando(modelo.id)
    try {
      await excluirModelo(supabase, modelo.id)
      setVersao((valor) => valor + 1)
    } catch (erro) {
      setEstado((anterior) => ({ ...anterior, erro: erro.message }))
    } finally {
      setConfirmando(null)
    }
  }

  if (estado.carregando) {
    return (
      <Carregando rotulo="Carregando modelos" className="adm-grade-modelos">
        {Array.from({ length: 3 }, (_, i) => <CardEsqueleto key={i}><Bloco largura={160} altura={16} /><Bloco altura={60} raio={12} /></CardEsqueleto>)}
      </Carregando>
    )
  }
  if (!estado.disponivel) {
    return (
      <div className="adm-aviso">
        <strong>Falta um passo no Supabase</strong>
        <p>Rode o arquivo <code>0005_modelos_equipe.sql</code> no SQL Editor para liberar os modelos de treino.</p>
      </div>
    )
  }

  return (
    <>
      {estado.erro && <p className="adm-erro" role="alert">{estado.erro}</p>}
      {estado.modelos.length === 0 ? (
        <div className="adm-aviso">
          <strong>Nenhum modelo ainda</strong>
          <p>Crie um modelo do zero ou abra a ficha de um aluno e toque em “Salvar como modelo”.</p>
          <button type="button" className="adm-botao" onClick={() => onEditarModelo(null)}>+ Novo modelo</button>
        </div>
      ) : (
        <ul className="adm-grade-modelos">
          {estado.modelos.map((modelo) => (
            <li key={modelo.id} className="adm-painel-card adm-modelo">
              <header>
                <b>{modelo.nome}</b>
                <small>{[modelo.objetivo, `${modelo.duracao_dias} dias`, `${modelo.treinos.length} ${modelo.treinos.length === 1 ? 'treino' : 'treinos'}`].filter(Boolean).join(' · ')}</small>
              </header>
              <ul className="adm-modelo__treinos">
                {modelo.treinos.map((treino) => (
                  <li key={treino.letra}>
                    <b className="adm-letra adm-letra--pequena">{treino.letra}</b>
                    <span>{treino.nome || `Treino ${treino.letra}`}<small>{diasDoTreinoTexto(treino.dias)} · {treino.exercicios.length} exercícios</small></span>
                  </li>
                ))}
              </ul>
              {aplicando === modelo.id ? (
                <div className="adm-inline-form">
                  <label className="visualmente-oculto" htmlFor={`aluno-${modelo.id}`}>Usar com o aluno</label>
                  <select id={`aluno-${modelo.id}`} value={alunoEscolhido} onChange={(event) => setAlunoEscolhido(event.target.value)}>
                    <option value="">Escolha o aluno…</option>
                    {alunos.map((aluno) => <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>)}
                  </select>
                  <button type="button" className="adm-botao adm-botao--pequeno" disabled={!alunoEscolhido}
                    onClick={() => {
                      const aluno = alunos.find(({ id }) => id === alunoEscolhido)
                      const mes = mesSugerido(hoje)
                      onEnviar({ aluno, mes, ficha: noMes(fichaDoModelo(modelo, aluno.id, limitesDoMes(mes).inicio), mes) })
                    }}>Continuar</button>
                  <button type="button" className="adm-link" onClick={() => setAplicando(null)}>Cancelar</button>
                </div>
              ) : (
                <footer className="adm-modelo__acoes">
                  <button type="button" className="adm-botao adm-botao--pequeno" onClick={() => { setAplicando(modelo.id); setAlunoEscolhido('') }}>
                    Usar com um aluno
                  </button>
                  <button type="button" className="adm-link" onClick={() => onEditarModelo(modelo)}>Editar</button>
                  <button type="button" className={`adm-link adm-link--perigo${confirmando === modelo.id ? ' confirmando' : ''}`}
                    onClick={() => excluir(modelo)} onBlur={() => setConfirmando(null)}>
                    {confirmando === modelo.id ? 'Confirmar exclusão' : 'Excluir'}
                  </button>
                </footer>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="adm-dica-rodape">Dica: em “Enviar treino do mês”, escolha “Usar um modelo pronto” para começar com tudo montado.</p>
    </>
  )
}

function PaginaTreinos({ aba, alunos, hoje, ir, onEnviar, onEditarModelo }) {
  const [mes, setMes] = useState(() => mesSugerido(hoje))
  return (
    <section className="adm-treinos">
      <CabecalhoPagina
        migalhas={[{ nome: 'Treinos' }]}
        titulo="Treinos"
        descricao="Todo mês, cada aluno recebe o treino dele. Aqui você vê quem já recebeu e quem falta."
      >
        {aba === 'modelos'
          ? <button type="button" className="adm-botao" onClick={() => onEditarModelo(null)}>+ Novo modelo</button>
          : <button type="button" className="adm-botao" onClick={() => onEnviar({ mes })}>+ Enviar treino do mês</button>}
      </CabecalhoPagina>

      <nav className="adm-abas-pagina" aria-label="Seções de treinos">
        <button type="button" aria-current={aba === 'fichas' ? 'page' : undefined} onClick={() => ir({ pagina: 'treinos' })}>Treinos do mês</button>
        <button type="button" aria-current={aba === 'modelos' ? 'page' : undefined} onClick={() => ir({ pagina: 'treinos', aba: 'modelos' })}>Modelos prontos</button>
      </nav>

      {aba === 'modelos'
        ? <AbaModelos alunos={alunos} hoje={hoje} onEnviar={onEnviar} onEditarModelo={onEditarModelo} />
        : <AbaDoMes alunos={alunos} hoje={hoje} mes={mes} ir={ir} onMes={setMes} onEnviar={onEnviar} />}
    </section>
  )
}

export default PaginaTreinos
