import { useEffect, useState } from 'react'
import { supabase } from '../dados/supabase.js'
import {
  OBJETIVOS, copiarFicha, dataCurta, diasDoTreinoTexto, fichaAnteriorAoMes, fichaDoMes, fichaDoModelo,
  fichaDoPlanoPadrao, limitesDoMes, mesDe, nomeDoMes, noMes, novaFicha, somarMeses, textoDescanso, validarFicha,
} from '../utils/ficha.js'
import { linkWhatsApp, mensagemPara, primeiroNome } from '../utils/painelAdmin.js'
import { normalizar } from '../utils/vitrine.js'
import CabecalhoPagina from './CabecalhoPagina.jsx'
import { Avatar, IconeWhatsApp } from './comum.jsx'
import { listarModelos, salvarFicha } from './dadosAdmin.js'
import MontarTreinos from './MontarTreinos.jsx'

const ETAPAS = [
  { id: 'aluno', nome: 'Aluno' },
  { id: 'inicio', nome: 'Começar' },
  { id: 'montar', nome: 'Montar' },
  { id: 'revisar', nome: 'Enviar' },
]
const PLANO_PADRAO = '__padrao'

function Etapas({ atual }) {
  const posicao = ETAPAS.findIndex(({ id }) => id === atual)
  return (
    <ol className="adm-etapas" aria-label="Etapas">
      {ETAPAS.map(({ id, nome }, i) => (
        <li key={id} className={i < posicao ? 'feita' : ''} aria-current={i === posicao ? 'step' : undefined}>
          <span aria-hidden="true">{i < posicao ? '✓' : i + 1}</span>
          {nome}
        </li>
      ))}
    </ol>
  )
}

// ---------------------------------------------------------------- 1. para quem
function EscolherAluno({ alunos, mes, hoje, onMes, onEscolher }) {
  const [busca, setBusca] = useState('')
  const termo = normalizar(busca)
  const encontrados = alunos.filter((aluno) => !termo || normalizar(`${aluno.nome} ${aluno.email} ${aluno.telefone}`).includes(termo))
  const faltam = encontrados.filter((aluno) => !fichaDoMes(aluno.fichas, mes))
  const prontos = encontrados.filter((aluno) => fichaDoMes(aluno.fichas, mes))
  const meses = [mesDe(hoje), somarMeses(mesDe(hoje), 1)]

  const linha = (aluno, pronto) => {
    const anterior = fichaAnteriorAoMes(aluno.fichas, mes)
    const doMes = fichaDoMes(aluno.fichas, mes)
    return (
      <li key={aluno.id}>
        <button type="button" className="adm-escolha-aluno" onClick={() => onEscolher(aluno)}>
          <Avatar nome={aluno.nome} />
          <span>
            <b>{aluno.nome}</b>
            <small>
              {pronto
                ? `${doMes.titulo} · ${doMes.treinos.length} ${doMes.treinos.length === 1 ? 'treino' : 'treinos'}`
                : anterior ? `Último treino: ${dataCurta(anterior.inicio)} a ${dataCurta(anterior.fim)}` : 'Ainda não recebeu treino'}
            </small>
          </span>
          {pronto ? <span className="adm-selo adm-selo--vigente">Enviado</span> : <span className="adm-selo adm-selo--sem">Falta</span>}
          <span className="adm-escolha-aluno__seta" aria-hidden="true">›</span>
        </button>
      </li>
    )
  }

  return (
    <>
      <div className="adm-painel-card adm-assistente__pergunta">
        <div className="adm-campo">
          <span>Treino de qual mês?</span>
          <div className="adm-chips" role="group" aria-label="Mês do treino">
            {meses.map((opcao) => (
              <button key={opcao} type="button" aria-pressed={mes === opcao} onClick={() => onMes(opcao)}>
                {nomeDoMes(opcao)}{opcao === mesDe(hoje) ? ' (este mês)' : ''}
              </button>
            ))}
          </div>
        </div>
        <label className="adm-busca">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="visualmente-oculto">Buscar aluno</span>
          <input type="search" placeholder="Buscar aluno pelo nome" value={busca} onChange={(event) => setBusca(event.target.value)} />
        </label>
      </div>

      {alunos.length === 0 && (
        <div className="adm-aviso"><p>Nenhum aluno criou conta ainda.</p></div>
      )}
      {alunos.length > 0 && encontrados.length === 0 && (
        <div className="adm-aviso"><p>Nenhum aluno com esse nome.</p></div>
      )}
      {faltam.length > 0 && (
        <section className="adm-grupo-alunos" aria-label="Falta enviar">
          <h2>Falta enviar o treino de {nomeDoMes(mes)} <small>{faltam.length}</small></h2>
          <ul>{faltam.map((aluno) => linha(aluno, false))}</ul>
        </section>
      )}
      {prontos.length > 0 && (
        <section className="adm-grupo-alunos" aria-label="Já enviado">
          <h2>Já recebeu o de {nomeDoMes(mes)} <small>{prontos.length}</small></h2>
          <ul>{prontos.map((aluno) => linha(aluno, true))}</ul>
        </section>
      )}
    </>
  )
}

// ---------------------------------------------------------------- 2. como começar
function opcoesDePartida({ aluno, alunos, mes, modelos, emAndamento }) {
  const doMes = fichaDoMes(aluno.fichas, mes)
  const anterior = fichaAnteriorAoMes(aluno.fichas, mes)
  const outros = alunos.filter((outro) => outro.id !== aluno.id && outro.fichaAtual)
  return [
    emAndamento && { id: 'andamento', nome: 'Continuar o que eu estava montando', texto: 'Nada do que você fez se perde.' },
    doMes && { id: 'editar', nome: `Editar o treino de ${nomeDoMes(mes)} que ${primeiroNome(aluno.nome)} já tem`, texto: `${doMes.titulo} · ${dataCurta(doMes.inicio)} a ${dataCurta(doMes.fim)}` },
    anterior && { id: 'repetir', nome: 'Repetir o último treino', texto: `${anterior.titulo} (${dataCurta(anterior.inicio)} a ${dataCurta(anterior.fim)}). Mesmos exercícios; você só ajusta o que mudar.`, recomendado: !doMes },
    { id: 'modelo', nome: 'Usar um modelo pronto', texto: modelos.length ? 'Seus modelos e o plano padrão da academia.' : 'Plano padrão da academia (treinos A a E, um por dia).' },
    outros.length > 0 && { id: 'copiar', nome: 'Copiar o treino de outro aluno', texto: 'Bom para alunos com o mesmo nível e objetivo.' },
    { id: 'zero', nome: 'Começar do zero', texto: 'Em branco: você escolhe cada exercício.' },
  ].filter(Boolean)
}

function ComoComecar({ aluno, alunos, mes, modelos, emAndamento, onTrocarAluno, onContinuar }) {
  const opcoes = opcoesDePartida({ aluno, alunos, mes, modelos: modelos.lista, emAndamento })
  const outros = alunos.filter((outro) => outro.id !== aluno.id && outro.fichaAtual)
  const [escolha, setEscolha] = useState(opcoes[0].id)
  const [modeloId, setModeloId] = useState(PLANO_PADRAO)
  const [copiarDe, setCopiarDe] = useState(outros[0]?.id ?? '')
  const doMes = fichaDoMes(aluno.fichas, mes)
  const substitui = doMes && doMes.inicio >= limitesDoMes(mes).inicio && !['andamento', 'editar'].includes(escolha)

  function continuar() {
    const { inicio } = limitesDoMes(mes)
    let ficha
    if (escolha === 'andamento') return onContinuar(null)
    if (escolha === 'editar') ficha = structuredClone(doMes)
    else if (escolha === 'repetir') ficha = noMes(copiarFicha(fichaAnteriorAoMes(aluno.fichas, mes), aluno.id, inicio), mes)
    else if (escolha === 'copiar') ficha = noMes(copiarFicha(outros.find(({ id }) => id === copiarDe).fichaAtual, aluno.id, inicio), mes)
    else if (escolha === 'modelo') {
      const modelo = modelos.lista.find(({ id }) => id === modeloId)
      ficha = noMes(modelo ? fichaDoModelo(modelo, aluno.id, inicio) : fichaDoPlanoPadrao(aluno.id, inicio), mes)
    } else {
      const vazia = noMes(novaFicha(aluno.id, inicio), mes)
      ficha = { ...vazia, treinos: [{ ...vazia.treinos[0], dias: [0] }] }
    }
    // Um treino novo para um mês que já tem treino substitui o anterior, em vez de deixar dois.
    if (substitui) ficha.id = doMes.id
    onContinuar(ficha)
  }

  return (
    <>
      <div className="adm-assistente__quem">
        <Avatar nome={aluno.nome} />
        <span><b>{aluno.nome}</b><small>Treino de {nomeDoMes(mes, { ano: true })}</small></span>
        <button type="button" className="adm-link" onClick={onTrocarAluno}>Trocar aluno</button>
      </div>

      <fieldset className="adm-partidas">
        <legend>Como você quer começar?</legend>
        {opcoes.map((opcao) => (
          <label key={opcao.id} className={`adm-partida${escolha === opcao.id ? ' escolhida' : ''}`}>
            <input type="radio" name="partida" value={opcao.id} checked={escolha === opcao.id} onChange={() => setEscolha(opcao.id)} />
            <span className="adm-partida__texto">
              <b>{opcao.nome}{opcao.recomendado && <em>Mais rápido</em>}</b>
              <small>{opcao.texto}</small>
              {escolha === 'modelo' && opcao.id === 'modelo' && (
                <select aria-label="Qual modelo" value={modeloId} onChange={(event) => setModeloId(event.target.value)}>
                  <option value={PLANO_PADRAO}>Plano padrão da academia (A a E)</option>
                  {modelos.lista.map((modelo) => <option key={modelo.id} value={modelo.id}>{modelo.nome}</option>)}
                </select>
              )}
              {escolha === 'copiar' && opcao.id === 'copiar' && (
                <select aria-label="Copiar de qual aluno" value={copiarDe} onChange={(event) => setCopiarDe(event.target.value)}>
                  {outros.map((outro) => <option key={outro.id} value={outro.id}>{outro.nome} · {outro.fichaAtual.titulo}</option>)}
                </select>
              )}
            </span>
          </label>
        ))}
      </fieldset>
      {substitui && (
        <p className="adm-dica" role="status">
          Ao enviar, este treino substitui o de {nomeDoMes(mes)} que {primeiroNome(aluno.nome)} já tem.
        </p>
      )}

      <div className="adm-assistente__rodape">
        <span />
        <button type="button" className="adm-botao" onClick={continuar} disabled={modelos.carregando && escolha === 'modelo'}>
          Continuar →
        </button>
      </div>
    </>
  )
}

// ---------------------------------------------------------------- 4. revisar
function Revisao({ aluno, ficha, onRecado }) {
  return (
    <>
      <section className="adm-painel-card adm-revisao" aria-label="Como o aluno vai ver">
        <header>
          <small>Assim {primeiroNome(aluno.nome)} vai ver no app</small>
          <b>{ficha.titulo}</b>
          <span>{dataCurta(ficha.inicio)} a {dataCurta(ficha.fim)}</span>
        </header>
        {ficha.treinos.map((treino) => (
          <div key={treino.letra} className="adm-revisao__treino">
            <div className="adm-revisao__cabeca">
              <b className="adm-letra">{treino.letra}</b>
              <span><b>{treino.nome || `Treino ${treino.letra}`}</b><small>{diasDoTreinoTexto(treino.dias)}</small></span>
            </div>
            <ol>
              {treino.exercicios.map((item) => (
                <li key={item.id}>
                  <span className="adm-revisao__nome">{item.nome}</span>
                  <span className="adm-revisao__dose">
                    {item.series} × {item.repeticoes} · {textoDescanso(item.descanso)}{item.carga ? ` · ${item.carga}` : ''}
                  </span>
                  {item.observacao && <small>{item.observacao}</small>}
                  {(item.imagem || item.video) && (
                    <span className="adm-revisao__midia">
                      {item.imagem && <img src={item.imagem} alt="" loading="lazy" />}
                      {item.imagem && 'Foto'}{item.imagem && item.video && ' · '}{item.video && '▶ Vídeo'}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>
      <label className="adm-painel-card adm-campo adm-revisao__recado">
        <span>Recado para {primeiroNome(aluno.nome)} (opcional, aparece no topo do treino)</span>
        <textarea rows={2} maxLength={1000} value={ficha.observacoes}
          placeholder="Ex.: aqueça 10 min na esteira antes. Qualquer dor, me avisa!"
          onChange={(event) => onRecado(event.target.value)} />
      </label>
    </>
  )
}

// ---------------------------------------------------------------- assistente
// Enviar o treino do mês: escolher o aluno → como começar → montar → revisar e enviar.
function EnviarTreino({ alunos, hoje, inicial, onSalvou, onSair }) {
  const [passo, setPasso] = useState(() => (inicial.ficha ? 'montar' : inicial.aluno ? 'inicio' : 'aluno'))
  const [alunoId, setAlunoId] = useState(inicial.aluno?.id ?? null)
  const [mes, setMes] = useState(inicial.mes)
  const [ficha, setFicha] = useState(inicial.ficha ? structuredClone(inicial.ficha) : null)
  const [alterada, setAlterada] = useState(false)
  const [mudarDatas, setMudarDatas] = useState(false)
  const [erros, setErros] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [salva, setSalva] = useState(null)
  const [enviadosAgora, setEnviadosAgora] = useState(() => new Set())
  const [confirmarSaida, setConfirmarSaida] = useState(false)
  const [modelos, setModelos] = useState({ carregando: true, lista: [] })

  useEffect(() => {
    let ativo = true
    listarModelos(supabase)
      .then(({ modelos: lista }) => { if (ativo) setModelos({ carregando: false, lista }) })
      .catch(() => { if (ativo) setModelos({ carregando: false, lista: [] }) })
    return () => { ativo = false }
  }, [])

  // Os dados do aluno vêm da lista (atualizada depois de cada envio); o inicial cobre o primeiro instante.
  const aluno = alunos.find(({ id }) => id === alunoId) ?? (inicial.aluno?.id === alunoId ? inicial.aluno : null)
  const proximo = alunos.find((outro) => outro.id !== alunoId && !enviadosAgora.has(outro.id) && !fichaDoMes(outro.fichas, mes))

  function irPara(novo) {
    setPasso(novo)
    setErros([])
    setConfirmarSaida(false)
    window.scrollTo({ top: 0 })
  }

  function mudar(transformar) {
    setFicha((atual) => transformar(structuredClone(atual)))
    setAlterada(true)
    setErros([])
    setConfirmarSaida(false)
  }

  function escolherAluno(escolhido) {
    if (escolhido.id !== alunoId) {
      setFicha(null)
      setAlterada(false)
    }
    setAlunoId(escolhido.id)
    setSalva(null)
    irPara('inicio')
  }

  function revisar() {
    const { erros: problemas, ficha: pronta } = validarFicha(ficha)
    if (problemas.length) {
      setErros(problemas)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setFicha((atual) => ({ ...atual, titulo: pronta.titulo }))
    irPara('revisar')
  }

  async function enviar() {
    const { erros: problemas, ficha: pronta } = validarFicha(ficha)
    if (problemas.length) {
      setErros(problemas)
      return irPara('montar')
    }
    setSalvando(true)
    try {
      const resultado = await salvarFicha(supabase, pronta)
      setSalva({ ...resultado, atualizada: Boolean(pronta.id) })
      setEnviadosAgora((atual) => new Set(atual).add(aluno.id))
      setAlterada(false)
      setFicha(null)
      onSalvou()
      irPara('enviado')
    } catch (erro) {
      setErros([erro.message])
    } finally {
      setSalvando(false)
    }
  }

  function sair() {
    if (alterada && !confirmarSaida) return setConfirmarSaida(true)
    onSair()
  }

  const migalhas = [{ nome: 'Treinos', aoClicar: sair }, { nome: 'Enviar treino do mês' }]
  const titulo = aluno && passo !== 'aluno' ? `Treino de ${primeiroNome(aluno.nome)}` : 'Enviar treino do mês'
  const descricoes = {
    aluno: 'Escolha o aluno. Quem ainda não recebeu o treino do mês aparece primeiro.',
    inicio: 'Escolha um ponto de partida. Dá para mudar tudo no passo seguinte.',
    montar: 'Ajuste os treinos, os dias e os exercícios.',
    revisar: 'Confira e envie. O aluno vê na hora, na aba Treino do app.',
  }

  if (passo === 'enviado' && salva && aluno) {
    return (
      <section className="adm-editor" aria-label="Treino enviado">
        <div className="adm-painel-card adm-salvo" role="status">
          <span className="adm-salvo__icone" aria-hidden="true">✓</span>
          <h1>{salva.atualizada ? 'Treino atualizado' : 'Treino enviado'}</h1>
          <p><b>{salva.titulo}</b> · {dataCurta(salva.inicio)} a {dataCurta(salva.fim)}</p>
          <p>{primeiroNome(aluno.nome)} já vê o treino na aba Treino do app.</p>
          <div className="adm-acoes adm-acoes--centro">
            {aluno.telefone && (
              <a className="adm-botao adm-botao--whats" target="_blank" rel="noopener noreferrer"
                href={linkWhatsApp(aluno.telefone, mensagemPara('ficha-nova', aluno, { titulo: salva.titulo }))}>
                <IconeWhatsApp /> Avisar no WhatsApp
              </a>
            )}
          </div>
        </div>
        {proximo ? (
          <div className="adm-painel-card adm-proximo">
            <Avatar nome={proximo.nome} />
            <span><small>Próximo sem o treino de {nomeDoMes(mes)}</small><b>{proximo.nome}</b></span>
            <button type="button" className="adm-botao" onClick={() => escolherAluno(proximo)}>
              Enviar para {primeiroNome(proximo.nome)} →
            </button>
          </div>
        ) : (
          <p className="adm-dica adm-dica--centro">Todos os alunos já têm o treino de {nomeDoMes(mes)}. 🎉</p>
        )}
        <div className="adm-acoes adm-acoes--centro">
          <button type="button" className="adm-link" onClick={() => irPara('aluno')}>Escolher outro aluno</button>
          <button type="button" className="adm-link" onClick={onSair}>Voltar para Treinos</button>
        </div>
      </section>
    )
  }

  const totalExercicios = ficha ? ficha.treinos.reduce((soma, t) => soma + t.exercicios.length, 0) : 0
  const passoValido = passo === 'aluno' || (aluno && (passo === 'inicio' || ficha)) ? passo : 'aluno'

  return (
    <section className="adm-editor adm-assistente" aria-label="Enviar treino do mês">
      <CabecalhoPagina migalhas={migalhas} titulo={titulo} descricao={descricoes[passoValido]}>
        <button type="button" className={`adm-voltar${confirmarSaida ? ' confirmando' : ''}`} onClick={sair}>
          {confirmarSaida ? 'Sair sem enviar?' : 'Cancelar'}
        </button>
      </CabecalhoPagina>
      <Etapas atual={passoValido} />

      {erros.length > 0 && (
        <div className="adm-erros" role="alert">
          <b>Antes de continuar, ajuste:</b>
          <ul>{erros.map((erro) => <li key={erro}>{erro}</li>)}</ul>
        </div>
      )}

      {passoValido === 'aluno' && (
        <EscolherAluno alunos={alunos} mes={mes} hoje={hoje} onMes={setMes} onEscolher={escolherAluno} />
      )}

      {passoValido === 'inicio' && (
        <ComoComecar
          key={`${aluno.id}:${mes}:${modelos.carregando}`}
          aluno={aluno} alunos={alunos} mes={mes} modelos={modelos} emAndamento={Boolean(ficha && alterada)}
          onTrocarAluno={() => irPara('aluno')}
          onContinuar={(nova) => {
            if (nova) {
              setFicha(nova)
              setAlterada(false)
              setMudarDatas(false)
            }
            irPara('montar')
          }}
        />
      )}

      {passoValido === 'montar' && (
        <>
          <section className="adm-painel-card adm-assistente__resumo" aria-label="Dados do treino">
            <div className="adm-assistente__quem">
              <Avatar nome={aluno.nome} />
              <span>
                <b>{aluno.nome}</b>
                <small>{dataCurta(ficha.inicio)} a {dataCurta(ficha.fim)}</small>
              </span>
              <button type="button" className="adm-link" onClick={() => setMudarDatas((valor) => !valor)}>
                {mudarDatas ? 'Pronto' : 'Mudar datas'}
              </button>
            </div>
            {mudarDatas && (
              <div className="adm-assistente__datas">
                <label className="adm-campo">
                  <span>Começa em</span>
                  <input type="date" value={ficha.inicio} onChange={(event) => mudar((f) => ({ ...f, inicio: event.target.value }))} />
                </label>
                <label className="adm-campo">
                  <span>Termina em</span>
                  <input type="date" value={ficha.fim} min={ficha.inicio} onChange={(event) => mudar((f) => ({ ...f, fim: event.target.value }))} />
                </label>
              </div>
            )}
            <label className="adm-campo">
              <span>Objetivo</span>
              <select value={ficha.objetivo} onChange={(event) => mudar((f) => ({ ...f, objetivo: event.target.value }))}>
                {[...new Set([...OBJETIVOS, ficha.objetivo].filter(Boolean))].map((objetivo) => <option key={objetivo}>{objetivo}</option>)}
              </select>
            </label>
          </section>

          <MontarTreinos ficha={ficha} onMudar={mudar} />

          <div className="adm-assistente__rodape">
            <button type="button" className="adm-voltar" onClick={() => irPara('inicio')}>← Voltar</button>
            <span className="adm-assistente__conta">
              {ficha.treinos.length} {ficha.treinos.length === 1 ? 'treino' : 'treinos'} · {totalExercicios} {totalExercicios === 1 ? 'exercício' : 'exercícios'}
            </span>
            <button type="button" className="adm-botao" onClick={revisar}>Revisar →</button>
          </div>
        </>
      )}

      {passoValido === 'revisar' && (
        <>
          <Revisao aluno={aluno} ficha={ficha} onRecado={(observacoes) => mudar((f) => ({ ...f, observacoes }))} />
          <div className="adm-assistente__rodape">
            <button type="button" className="adm-voltar" onClick={() => irPara('montar')}>← Ajustar</button>
            <button type="button" className="adm-botao" onClick={enviar} disabled={salvando}>
              {salvando ? 'Enviando…' : `Enviar para ${primeiroNome(aluno.nome)}`}
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default EnviarTreino
