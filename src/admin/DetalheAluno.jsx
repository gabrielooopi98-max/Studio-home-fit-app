import { useEffect, useState } from 'react'
import { supabase } from '../dados/supabase.js'
import { formatarPeso, recordesPessoais } from '../componentes/area-treinos/treinoLocal.js'
import CartaoPedido from '../componentes/loja/CartaoPedido.jsx'
import { Bloco, CardEsqueleto, Carregando } from '../componentes/Esqueleto.jsx'
import { chaveDoDia, inicioDaSemana } from '../utils/checkins.js'
import { formatarPreco } from '../utils/dinheiro.js'
import {
  dataCurta, diasDoTreinoTexto, estadoDaFicha, fichaDoDia, modeloDaFicha, renovarFicha, somarDias,
} from '../utils/ficha.js'
import { linkWhatsApp, mensagemPara, primeiroNome } from '../utils/painelAdmin.js'
import { variacaoDePeso } from '../utils/perfil.js'
import { formatarTelefone } from '../utils/telefone.js'
import CabecalhoPagina from './CabecalhoPagina.jsx'
import { Avatar, IconeWhatsApp, PresencaTexto, SeloFicha } from './comum.jsx'
import { carregarAluno, excluirFicha, salvarModelo } from './dadosAdmin.js'
import { GraficoLinha } from './graficos.jsx'
import '../componentes/loja/Loja.css'

const SEMANAS = 8
const formatoMesAno = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })

function textoDescanso(segundos) {
  if (!segundos) return 'sem descanso'
  return segundos < 60 ? `${segundos}s` : `${Math.floor(segundos / 60)}${segundos % 60 ? `:${String(segundos % 60).padStart(2, '0')}` : ''} min`
}

function Frequencia({ dias, hoje }) {
  const presentes = new Set(dias)
  const ultimaSegunda = inicioDaSemana(new Date(`${hoje}T12:00:00`))
  const semanas = Array.from({ length: SEMANAS }, (_, indice) => {
    const segunda = new Date(ultimaSegunda)
    segunda.setDate(segunda.getDate() - 7 * (SEMANAS - 1 - indice))
    return Array.from({ length: 5 }, (__, dia) => chaveDoDia(new Date(segunda.getFullYear(), segunda.getMonth(), segunda.getDate() + dia, 12)))
  })
  return (
    <div className="adm-frequencia" role="img" aria-label={`${dias.length} check-ins nas últimas ${SEMANAS} semanas`}>
      <div className="adm-frequencia__dias" aria-hidden="true">{['S', 'T', 'Q', 'Q', 'S'].map((letra, i) => <span key={i}>{letra}</span>)}</div>
      {semanas.map((semana) => (
        <div key={semana[0]} className="adm-frequencia__semana" aria-hidden="true">
          {semana.map((dia) => <i key={dia} className={dia > hoje ? 'futuro' : presentes.has(dia) ? 'veio' : ''} title={dataCurta(dia)} />)}
        </div>
      ))}
    </div>
  )
}

function FichaCompleta({ ficha }) {
  return (
    <div className="adm-ficha-completa">
      {ficha.treinos.map((treino) => (
        <section key={treino.letra} className="adm-ficha-treino">
          <header>
            <b className="adm-letra">{treino.letra}</b>
            <span>
              <strong>{treino.nome || `Treino ${treino.letra}`}</strong>
              <small>{diasDoTreinoTexto(treino.dias)} · {treino.exercicios.length} {treino.exercicios.length === 1 ? 'exercício' : 'exercícios'}</small>
            </span>
          </header>
          <ol>
            {treino.exercicios.map((item) => (
              <li key={item.id}>
                <span className="adm-ficha-treino__nome">{item.nome}{item.observacao && <small>{item.observacao}</small>}</span>
                <span className="adm-ficha-treino__prescricao">
                  {item.series}×{item.repeticoes}
                  <small>{textoDescanso(item.descanso)}{item.carga ? ` · ${item.carga}` : ''}</small>
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

function SalvarComoModelo({ ficha }) {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState(ficha.titulo)
  const [estado, setEstado] = useState('')

  async function salvar(event) {
    event.preventDefault()
    setEstado('salvando')
    try {
      await salvarModelo(supabase, modeloDaFicha(ficha, nome))
      setEstado('ok')
      setAberto(false)
    } catch (erro) {
      setEstado(erro.message)
    }
  }

  if (!aberto) {
    return (
      <>
        <button type="button" className="adm-botao adm-botao--secundario" onClick={() => { setAberto(true); setEstado('') }}>Salvar como modelo</button>
        {estado === 'ok' && <span className="adm-ok" role="status">Modelo salvo ✓</span>}
      </>
    )
  }
  return (
    <form className="adm-inline-form" onSubmit={salvar}>
      <label className="visualmente-oculto" htmlFor="nome-modelo">Nome do modelo</label>
      <input id="nome-modelo" value={nome} maxLength={60} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Iniciante 3x por semana" />
      <button type="submit" className="adm-botao adm-botao--pequeno" disabled={estado === 'salvando'}>Salvar</button>
      <button type="button" className="adm-link" onClick={() => setAberto(false)}>Cancelar</button>
      {estado && estado !== 'salvando' && estado !== 'ok' && <span className="adm-erro-texto" role="alert">{estado}</span>}
    </form>
  )
}

function DetalheAluno({ aluno, aba, dono, hoje, ir, onEditarFicha, onFichasMudaram }) {
  const [estado, setEstado] = useState({ carregando: true, erro: '', dados: null })
  const [versao, setVersao] = useState(0)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(null)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      try {
        const dados = await carregarAluno(supabase, aluno.id, { dono })
        if (ativo) setEstado({ carregando: false, erro: '', dados })
      } catch (erro) {
        if (ativo) setEstado({ carregando: false, erro: erro.message, dados: null })
      }
    }
    carregar()
    return () => { ativo = false }
  }, [aluno.id, dono, versao])

  async function excluir(ficha) {
    if (confirmandoExclusao !== ficha.id) return setConfirmandoExclusao(ficha.id)
    try {
      await excluirFicha(supabase, ficha.id)
      setVersao((valor) => valor + 1)
      onFichasMudaram()
    } catch (erro) {
      setEstado((anterior) => ({ ...anterior, erro: erro.message }))
    } finally {
      setConfirmandoExclusao(null)
    }
  }

  const dados = estado.dados
  const fichas = dados?.fichas ?? []
  const atual = (aluno.fichaAtual && fichas.find(({ id }) => id === aluno.fichaAtual.id)) ?? fichaDoDia(fichas, hoje) ?? fichas[0] ?? null
  const situacao = estadoDaFicha(atual, hoje)
  const outras = fichas.filter((ficha) => ficha.id !== atual?.id)
  const recordes = dados ? recordesPessoais(dados.treinos) : []
  const pesos = dados?.pesos ?? []
  const variacao = variacaoDePeso(pesos)
  const ultimos30 = aluno.checkins.filter((dia) => dia >= somarDias(hoje, -29)).length
  const pedidos = dados?.pedidos ?? []
  const totalGasto = pedidos.filter(({ status }) => status === 'retirado').reduce((soma, { total_centavos: total }) => soma + total, 0)
  const abas = [
    { id: 'geral', nome: 'Visão geral' },
    { id: 'treino', nome: 'Treino' },
    { id: 'evolucao', nome: 'Evolução' },
    ...(dono ? [{ id: 'pedidos', nome: 'Pedidos' }] : []),
  ]
  const carregandoDados = estado.carregando && !dados
  const esqueleto = (
    <Carregando rotulo="Carregando dados do aluno">
      <CardEsqueleto><Bloco largura={180} altura={16} /><Bloco altura={120} raio={14} /></CardEsqueleto>
    </Carregando>
  )

  const acoesFicha = atual ? (
    <div className="adm-acoes">
      <button type="button" className="adm-botao" onClick={() => onEditarFicha(null)}>Enviar treino do mês</button>
      <button type="button" className="adm-botao adm-botao--secundario" onClick={() => onEditarFicha(atual)}>Editar este treino</button>
      <SalvarComoModelo key={atual.id} ficha={atual} />
    </div>
  ) : null

  return (
    <section className="adm-aluno" aria-label={`Aluno ${aluno.nome}`}>
      <CabecalhoPagina
        migalhas={[{ nome: 'Alunos', aoClicar: () => ir({ pagina: 'alunos' }) }, { nome: aluno.nome }]}
        titulo={aluno.nome}
        descricao={<><PresencaTexto aluno={aluno} /> · meta de {aluno.metaSemanal}x por semana</>}
      >
        {aluno.telefone && (
          <a className="adm-botao adm-botao--secundario" target="_blank" rel="noopener noreferrer"
            href={linkWhatsApp(aluno.telefone, `Oi, ${primeiroNome(aluno.nome)}!`)}>
            <IconeWhatsApp /> WhatsApp
          </a>
        )}
        <button type="button" className="adm-botao" onClick={() => onEditarFicha(null)}>Enviar treino do mês</button>
      </CabecalhoPagina>

      <div className="adm-perfil-faixa">
        <Avatar nome={aluno.nome} grande />
        <dl>
          <div><dt>E-mail</dt><dd>{aluno.email || '—'}</dd></div>
          <div><dt>WhatsApp</dt><dd>{aluno.telefone ? formatarTelefone(aluno.telefone) : '—'}</dd></div>
          <div><dt>Aluno desde</dt><dd>{aluno.criadoEm ? formatoMesAno.format(new Date(aluno.criadoEm)).replace('.', '') : '—'}</dd></div>
          <div><dt>Ficha</dt><dd><SeloFicha situacao={situacao} /></dd></div>
        </dl>
      </div>

      <nav className="adm-abas-pagina" aria-label="Seções do aluno">
        {abas.map(({ id, nome }) => (
          <button key={id} type="button" aria-current={aba === id ? 'page' : undefined}
            onClick={() => ir({ pagina: 'aluno', id: aluno.id, aba: id })}>
            {nome}
            {id === 'pedidos' && pedidos.length > 0 && <small>{pedidos.length}</small>}
          </button>
        ))}
      </nav>

      {estado.erro && <p className="adm-erro" role="alert">{estado.erro}</p>}

      {aba === 'geral' && (
        <div className="adm-aba">
          <div className="adm-kpis">
            <div className="adm-kpi"><span className="adm-kpi__rotulo">Check-ins no mês</span><strong className="adm-kpi__valor">{aluno.checkinsMes}</strong><span className="adm-kpi__rodape"><small>{ultimos30} nos últimos 30 dias</small></span></div>
            <div className="adm-kpi"><span className="adm-kpi__rotulo">Esta semana</span><strong className="adm-kpi__valor">{aluno.checkinsSemana}<em>/{aluno.metaSemanal}</em></strong><span className="adm-kpi__rodape"><small>da meta semanal</small></span></div>
            <div className="adm-kpi"><span className="adm-kpi__rotulo">Treinos concluídos</span><strong className="adm-kpi__valor">{aluno.treinosMes}</strong><span className="adm-kpi__rodape"><small>neste mês</small></span></div>
            <div className="adm-kpi">
              <span className="adm-kpi__rotulo">Peso atual</span>
              <strong className="adm-kpi__valor">{pesos.at(-1) ? formatarPeso(pesos.at(-1).kg) : '—'}{pesos.at(-1) && <em>kg</em>}</strong>
              <span className="adm-kpi__rodape"><small>{variacao ? `${variacao.diferenca > 0 ? '+' : ''}${formatarPeso(variacao.diferenca)} kg desde ${dataCurta(variacao.desde)}` : 'sem registros'}</small></span>
            </div>
          </div>
          <div className="adm-duas-colunas">
            <section className="adm-painel-card">
              <header className="adm-painel-card__topo"><div><h2>Frequência</h2><p>Últimas {SEMANAS} semanas · {aluno.checkins.length} check-ins</p></div></header>
              <Frequencia dias={aluno.checkins} hoje={hoje} />
            </section>
            <section className="adm-painel-card">
              <header className="adm-painel-card__topo">
                <div><h2>Ficha atual</h2>{atual && <p>{atual.titulo} · {dataCurta(atual.inicio)} a {dataCurta(atual.fim)}</p>}</div>
                <SeloFicha situacao={situacao} />
              </header>
              {carregandoDados ? esqueleto : atual ? (
                <>
                  <ul className="adm-ficha-resumo">
                    {atual.treinos.map((treino) => (
                      <li key={treino.letra}>
                        <b className="adm-letra">{treino.letra}</b>
                        <span><strong>{treino.nome || `Treino ${treino.letra}`}</strong><small>{diasDoTreinoTexto(treino.dias)} · {treino.exercicios.length} {treino.exercicios.length === 1 ? 'exercício' : 'exercícios'}</small></span>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="adm-link" onClick={() => ir({ pagina: 'aluno', id: aluno.id, aba: 'treino' })}>Ver treino completo →</button>
                </>
              ) : (
                <div className="adm-vazio adm-vazio--acao">
                  <p>{primeiroNome(aluno.nome)} ainda não tem treino montado. O app mostra o plano padrão da academia.</p>
                  <button type="button" className="adm-botao" onClick={() => onEditarFicha(null)}>Enviar treino do mês</button>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {aba === 'treino' && (
        <div className="adm-aba">
          {carregandoDados ? esqueleto : atual ? (
            <section className="adm-painel-card">
              <header className="adm-painel-card__topo">
                <div>
                  <h2>{atual.titulo}</h2>
                  <p>{atual.objetivo ? `${atual.objetivo} · ` : ''}{dataCurta(atual.inicio)} a {dataCurta(atual.fim)}</p>
                </div>
                <SeloFicha situacao={situacao} />
              </header>
              {atual.observacoes && <p className="adm-recado">“{atual.observacoes}”</p>}
              {acoesFicha}
              {aluno.telefone && (
                <a className="adm-link" target="_blank" rel="noopener noreferrer"
                  href={linkWhatsApp(aluno.telefone, mensagemPara(situacao.estado === 'vencendo' ? 'ficha-vencendo' : 'ficha-nova', aluno, { titulo: atual.titulo }))}>
                  Avisar {primeiroNome(aluno.nome)} no WhatsApp →
                </a>
              )}
              <FichaCompleta ficha={atual} />
            </section>
          ) : (
            <section className="adm-painel-card">
              <div className="adm-vazio adm-vazio--acao">
                <p>{primeiroNome(aluno.nome)} ainda não tem treino montado.</p>
                <button type="button" className="adm-botao" onClick={() => onEditarFicha(null)}>Enviar treino do mês</button>
              </div>
            </section>
          )}

          {outras.length > 0 && (
            <section className="adm-painel-card">
              <header className="adm-painel-card__topo"><div><h2>Outras fichas</h2><p>{outras.length} no histórico</p></div></header>
              <ul className="adm-historico">
                {outras.map((ficha) => (
                  <li key={ficha.id}>
                    <span><b>{ficha.titulo}</b><small>{dataCurta(ficha.inicio)} a {dataCurta(ficha.fim)} · {estadoDaFicha(ficha, hoje).texto}</small></span>
                    <span className="adm-historico__acoes">
                      <button type="button" className="adm-link" onClick={() => onEditarFicha(ficha)}>Editar</button>
                      <button type="button" className="adm-link" onClick={() => onEditarFicha(renovarFicha(ficha, hoje))}>Reusar</button>
                      <button type="button" className={`adm-link adm-link--perigo${confirmandoExclusao === ficha.id ? ' confirmando' : ''}`}
                        onClick={() => excluir(ficha)} onBlur={() => setConfirmandoExclusao(null)}>
                        {confirmandoExclusao === ficha.id ? 'Confirmar exclusão' : 'Excluir'}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {aba === 'evolucao' && (
        <div className="adm-aba adm-duas-colunas">
          <section className="adm-painel-card">
            <header className="adm-painel-card__topo">
              <div><h2>Peso corporal</h2><p>{pesos.length} {pesos.length === 1 ? 'registro' : 'registros'}{variacao ? ` · ${variacao.diferenca > 0 ? '+' : ''}${formatarPeso(variacao.diferenca)} kg no período` : ''}</p></div>
            </header>
            {carregandoDados ? esqueleto : pesos.length >= 2 ? (
              <GraficoLinha
                pontos={pesos.map(({ dia, kg }) => ({ data: dia, valor: kg }))}
                descricao={`Peso de ${aluno.nome}: de ${formatarPeso(pesos[0].kg)} kg para ${formatarPeso(pesos.at(-1).kg)} kg`}
                formatarValor={(valor) => `${formatarPeso(valor)} kg`}
                formatarData={dataCurta}
              />
            ) : <p className="adm-vazio">O aluno registra o peso na aba Conta do app. Com 2 registros o gráfico aparece aqui.</p>}
          </section>
          <section className="adm-painel-card">
            <header className="adm-painel-card__topo"><div><h2>Recordes de carga</h2><p>Maior carga em cada exercício</p></div></header>
            {carregandoDados ? esqueleto : recordes.length === 0 ? <p className="adm-vazio">Sem cargas registradas ainda.</p> : (
              <ol className="adm-recordes">
                {recordes.slice(0, 10).map(({ exercicio, carga, dia }) => (
                  <li key={exercicio.id}>
                    <span><b>{exercicio.nome}</b><small>{dataCurta(dia)}</small></span>
                    <strong>{formatarPeso(carga)} kg</strong>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}

      {aba === 'pedidos' && dono && (
        <div className="adm-aba">
          <section className="adm-painel-card">
            <header className="adm-painel-card__topo">
              <div><h2>Pedidos na loja</h2><p>{pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'} · {formatarPreco(totalGasto)} em retirados</p></div>
            </header>
            {carregandoDados ? esqueleto : pedidos.length === 0 ? <p className="adm-vazio">Nenhum pedido ainda.</p> : (
              <div className="loja__pedidos">
                {pedidos.map((pedido) => <CartaoPedido key={pedido.id} pedido={pedido} />)}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  )
}

export default DetalheAluno
