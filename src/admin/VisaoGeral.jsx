import { formatarPreco } from '../utils/dinheiro.js'
import { dataCurta, renovarFicha } from '../utils/ficha.js'
import {
  alunoSumido, checkinsPorDiaUtil, comparativoSemanal, faturamento, linkWhatsApp, mensagemPara, novosAlunos, primeiroNome,
  tendencia,
} from '../utils/painelAdmin.js'
import CabecalhoPagina from './CabecalhoPagina.jsx'
import { Avatar, IconeWhatsApp, PresencaTexto } from './comum.jsx'
import { GraficoBarras } from './graficos.jsx'

const formatoHoje = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
const formatoDiaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })

function saudacao() {
  const hora = new Date().getHours()
  return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
}

function Indicador({ rotulo, valor, comparacao, detalhe }) {
  return (
    <div className="adm-kpi">
      <span className="adm-kpi__rotulo">{rotulo}</span>
      <strong className="adm-kpi__valor">{valor}</strong>
      <span className="adm-kpi__rodape">
        {comparacao && (
          <b className={`adm-tendencia adm-tendencia--${comparacao.direcao}`}>
            {comparacao.direcao === 'sobe' ? '↑' : comparacao.direcao === 'desce' ? '↓' : '→'} {comparacao.texto}
          </b>
        )}
        <small>{detalhe}</small>
      </span>
    </div>
  )
}

function ListaDeAcao({ titulo, descricao, vazio, itens, limite = 5, onVerTodos, renderizar }) {
  return (
    <section className="adm-painel-card adm-acao">
      <header className="adm-painel-card__topo">
        <div>
          <h2>{titulo} {itens.length > 0 && <span className="adm-contador">{itens.length}</span>}</h2>
          {descricao && <p>{descricao}</p>}
        </div>
        {onVerTodos && itens.length > limite && <button type="button" className="adm-link" onClick={onVerTodos}>Ver todos</button>}
      </header>
      {itens.length === 0 ? <p className="adm-vazio">{vazio}</p> : <ul className="adm-acao__lista">{itens.slice(0, limite).map(renderizar)}</ul>}
    </section>
  )
}

function VisaoGeral({ perfil, dono, dados, alunos, ir, onEditarFicha }) {
  const { hoje } = dados
  const semana = comparativoSemanal(dados.checkins, hoje)
  const novos = novosAlunos(dados.perfis, hoje)
  const caixa = faturamento(dados.pedidos, hoje)
  const serie = checkinsPorDiaUtil(dados.checkins, hoje, 30)
  const media = serie.length ? serie.reduce((soma, { total }) => soma + total, 0) / serie.length : 0
  const idsHoje = new Set(dados.checkins.filter(({ dia }) => dia === hoje).map(({ usuario_id: id }) => id))
  const vieramHoje = alunos.filter(({ id }) => idsHoje.has(id))
  const semFicha = alunos.filter((aluno) => ['sem', 'vencida'].includes(aluno.situacaoFicha.estado))
  const vencendo = alunos.filter((aluno) => aluno.situacaoFicha.estado === 'vencendo')
    .sort((a, b) => a.situacaoFicha.restantes - b.situacaoFicha.restantes)
  const sumidos = alunos.filter(alunoSumido).sort((a, b) => (b.diasSemVir ?? 9999) - (a.diasSemVir ?? 9999))
  const abrirAluno = (aluno, aba) => ir({ pagina: 'aluno', id: aluno.id, aba })

  const pessoa = (aluno, subtitulo) => (
    <button type="button" className="adm-pessoa" onClick={() => abrirAluno(aluno)}>
      <Avatar nome={aluno.nome} />
      <span><b>{aluno.nome}</b><small>{subtitulo}</small></span>
    </button>
  )

  return (
    <div className="adm-visao">
      <CabecalhoPagina
        titulo="Visão geral"
        descricao={`${saudacao()}, ${primeiroNome(perfil.nome || 'equipe')}. Hoje é ${formatoHoje.format(new Date(`${hoje}T12:00:00`))}.`}
      />

      <div className="adm-kpis">
        <Indicador rotulo="Check-ins na semana" valor={semana.checkins}
          comparacao={tendencia(semana.checkins, semana.checkinsAntes)} detalhe="vs. mesmo período da semana passada" />
        <Indicador rotulo="Alunos ativos na semana" valor={`${semana.ativos}/${alunos.length}`}
          comparacao={tendencia(semana.ativos, semana.ativosAntes)} detalhe="treinaram pelo menos 1 vez" />
        {dono ? (
          <Indicador rotulo="Faturamento da loja no mês" valor={formatarPreco(caixa.mes)}
            comparacao={tendencia(caixa.mes, caixa.mesAnterior)}
            detalhe={caixa.aReceber ? `+ ${formatarPreco(caixa.aReceber)} a receber` : `${caixa.pedidosMes} pedidos retirados`} />
        ) : (
          <Indicador rotulo="Fichas vencendo" valor={vencendo.length} detalhe="nos próximos 7 dias" />
        )}
        <Indicador rotulo="Novos alunos no mês" valor={novos.mes}
          comparacao={tendencia(novos.mes, novos.mesAnterior)} detalhe="vs. mês passado" />
      </div>

      <div className="adm-visao__meio">
        <section className="adm-painel-card adm-visao__grafico">
          <header className="adm-painel-card__topo">
            <div>
              <h2>Check-ins por dia</h2>
              <p>Últimos 30 dias úteis · média de {media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} por dia</p>
            </div>
          </header>
          <GraficoBarras
            dados={serie.map(({ dia, total }) => ({ chave: dia, dia, valor: total, destaque: dia === hoje }))}
            descricao={`Check-ins por dia nos últimos 30 dias úteis. Média de ${media.toFixed(1)} por dia.`}
            formatarRotulo={({ dia }) => dataCurta(dia)}
            marcarRotulo={({ dia }) => new Date(`${dia}T12:00:00`).getDay() === 1}
            formatarDica={({ dia, valor }) => `${formatoDiaSemana.format(new Date(`${dia}T12:00:00`)).replace('.', '')}: ${valor} ${valor === 1 ? 'check-in' : 'check-ins'}`}
          />
        </section>

        <section className="adm-painel-card adm-visao__hoje">
          <header className="adm-painel-card__topo">
            <div>
              <h2>Hoje</h2>
              <p>{vieramHoje.length} {vieramHoje.length === 1 ? 'aluno treinou' : 'alunos treinaram'}</p>
            </div>
          </header>
          {dono && dados.pedidosNovos > 0 && (
            <button type="button" className="adm-alerta" onClick={() => ir({ pagina: 'loja' })}>
              <b>{dados.pedidosNovos}</b>
              <span>{dados.pedidosNovos === 1 ? 'pedido novo para separar' : 'pedidos novos para separar'}</span>
              <span aria-hidden="true">→</span>
            </button>
          )}
          {vieramHoje.length === 0
            ? <p className="adm-vazio">Ninguém fez check-in hoje ainda.</p>
            : <ul className="adm-acao__lista">{vieramHoje.slice(0, 7).map((aluno) => (
              <li key={aluno.id}>{pessoa(aluno, `${aluno.checkinsMes} check-ins no mês`)}</li>
            ))}</ul>}
        </section>
      </div>

      <div className="adm-visao__acoes">
        <ListaDeAcao
          titulo="Sem treino montado"
          descricao="Envie o treino do mês em poucos minutos."
          vazio="Todos os alunos estão com ficha. 👏"
          itens={semFicha}
          onVerTodos={() => ir({ pagina: 'alunos' })}
          renderizar={(aluno) => (
            <li key={aluno.id}>
              {pessoa(aluno, aluno.situacaoFicha.texto)}
              {aluno.situacaoFicha.estado === 'vencida' ? (
                <button type="button" className="adm-botao adm-botao--pequeno adm-botao--secundario"
                  onClick={() => onEditarFicha(aluno, renovarFicha(aluno.fichaAtual, hoje))}>Renovar</button>
              ) : (
                <button type="button" className="adm-botao adm-botao--pequeno" onClick={() => onEditarFicha(aluno, null)}>Enviar treino</button>
              )}
            </li>
          )}
        />
        <ListaDeAcao
          titulo="Fichas vencendo"
          descricao="Renove para o próximo período."
          vazio="Nenhuma ficha vence nos próximos 7 dias."
          itens={vencendo}
          renderizar={(aluno) => (
            <li key={aluno.id}>
              {pessoa(aluno, `${aluno.situacaoFicha.texto} · ${aluno.fichaAtual.titulo}`)}
              <button type="button" className="adm-botao adm-botao--pequeno adm-botao--secundario"
                onClick={() => onEditarFicha(aluno, renovarFicha(aluno.fichaAtual, hoje))}>Renovar</button>
            </li>
          )}
        />
        <ListaDeAcao
          titulo="Sumidos"
          descricao="7 dias ou mais sem check-in."
          vazio="Ninguém sumido. A turma está firme! 💪"
          itens={sumidos}
          onVerTodos={() => ir({ pagina: 'alunos' })}
          renderizar={(aluno) => (
            <li key={aluno.id}>
              {pessoa(aluno, <PresencaTexto aluno={aluno} />)}
              {aluno.telefone ? (
                <a className="adm-icone-botao adm-icone-botao--whats" target="_blank" rel="noopener noreferrer"
                  aria-label={`Chamar ${aluno.nome} no WhatsApp`} href={linkWhatsApp(aluno.telefone, mensagemPara('sumido', aluno))}>
                  <IconeWhatsApp />
                </a>
              ) : <small className="adm-sem-contato">Sem WhatsApp</small>}
            </li>
          )}
        />
      </div>
    </div>
  )
}

export default VisaoGeral
