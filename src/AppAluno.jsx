import { Suspense, lazy, useState } from 'react'
import AvisoSincronizacao from './componentes/AvisoSincronizacao.jsx'
import CheckInCard from './componentes/CheckInCard.jsx'
import Header from './componentes/Header.jsx'
import AcessosRapidos from './componentes/AcessosRapidos.jsx'
import BarraDeNavegacao from './componentes/BarraDeNavegacao.jsx'
import ResultadosMes from './componentes/ResultadosMes.jsx'
import SequenciaCard from './componentes/SequenciaCard.jsx'
import TreinoDoDia from './componentes/TreinoDoDia.jsx'
import AreaTreinos from './componentes/area-treinos/AreaTreinos.jsx'
import TelaEstado from './componentes/auth/TelaEstado.jsx'
import { EsqueletoInicio } from './componentes/Esqueletos.jsx'
import PaginaConta from './componentes/conta/PaginaConta.jsx'
import PaginaLoja from './componentes/loja/PaginaLoja.jsx'
import { useDadosDoAluno } from './dados/useDadosDoAluno.js'

// O painel da academia só é baixado por quem é da equipe: o app do aluno fica mais leve.
const AppAdmin = lazy(() => import('./admin/AppAdmin.jsx'))

function saudacaoDoHorario() {
  const hora = new Date().getHours()
  if (hora < 5) return 'Boa noite'
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

const ORDEM_ABAS = ['inicio', 'treino', 'loja', 'conta']
const ABAS_DISPONIVEIS = ['inicio', 'treino', 'loja', 'conta']

// Dono e personal entram no painel da academia; podem trocar para ver o app como aluno.
function lerModo(usuarioId) {
  try {
    return window.localStorage.getItem(`home-fit:modo:${usuarioId}`) ?? 'admin'
  } catch {
    return 'admin'
  }
}

function AppAluno({ usuario, onSair }) {
  const [abaAtual, setAbaAtual] = useState('inicio')
  // Seção que a loja abre (o atalho "Meus pedidos" do início vai direto para as reservas).
  const [secaoLoja, setSecaoLoja] = useState('produtos')
  const [direcao, setDirecao] = useState('adiante')
  const [modo, setModoEstado] = useState(() => lerModo(usuario.id))
  const {
    carregando, erro, dados, sincronizacao, aviso, fecharAviso, tentarDeNovo,
    registrarCheckin, atualizarPerfil, salvarTreino,
  } = useDadosDoAluno(usuario.id)

  if (carregando) {
    return (
      <div className="app app--inicio">
        <EsqueletoInicio />
        <BarraDeNavegacao abaAtual="inicio" trocarAba={() => {}} />
      </div>
    )
  }
  if (erro) {
    return <TelaEstado titulo="Sem conexão" texto={erro} acao="Tentar novamente" onAcao={tentarDeNovo} />
  }

  const { perfil, checkins, treinos, fichas } = dados
  const equipe = perfil.papel === 'dono' || perfil.papel === 'personal'

  function setModo(novo) {
    try { window.localStorage.setItem(`home-fit:modo:${usuario.id}`, novo) } catch { /* sem armazenamento */ }
    setModoEstado(novo)
    window.scrollTo({ top: 0 })
  }

  if (equipe && modo === 'admin') {
    return (
      <Suspense fallback={<TelaEstado carregando />}>
        <AppAdmin usuario={usuario} perfil={perfil} onSair={onSair} onModoAluno={() => setModo('aluno')} />
      </Suspense>
    )
  }

  function trocarAba(aba, { secao = 'produtos' } = {}) {
    if (!ABAS_DISPONIVEIS.includes(aba)) return
    if (aba === abaAtual) return
    setSecaoLoja(secao)

    setDirecao(
      ORDEM_ABAS.indexOf(aba) > ORDEM_ABAS.indexOf(abaAtual)
        ? 'adiante'
        : 'atras',
    )
    setAbaAtual(aba)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className={`app app--${abaAtual}`}>
      <AvisoSincronizacao sincronizacao={sincronizacao} aviso={aviso} onFecharAviso={fecharAviso} />
      <div
        key={abaAtual}
        className={`pagina-transicao pagina-transicao--${direcao}`}
      >
        {abaAtual === 'treino' && (
          <div className="pagina-treino">
            <AreaTreinos
              treinos={treinos}
              fichas={fichas}
              onSalvarTreino={salvarTreino}
              onTreinoConcluido={registrarCheckin}
            />
          </div>
        )}
        {abaAtual === 'loja' && (
          <div className="pagina-loja">
            <PaginaLoja usuario={usuario} secaoInicial={secaoLoja} />
          </div>
        )}
        {abaAtual === 'conta' && (
          <div className="pagina-conta">
            <PaginaConta
              perfil={perfil}
              email={usuario.email}
              onAlterarPerfil={atualizarPerfil}
              onSair={onSair}
              onAbrirPainel={equipe ? () => setModo('admin') : null}
              checkins={checkins}
              treinos={treinos}
            />
          </div>
        )}
        {abaAtual === 'inicio' && (
          <div className="pagina-inicio">
            <Header saudacao={saudacaoDoHorario()} titulo={perfil.nome || 'Atleta'} fichas={fichas} />
            <div className="painel-inicio">
              <CheckInCard
                checkins={checkins}
                meta={perfil.metaSemanal}
                onCheckin={registrarCheckin}
              />
              <TreinoDoDia treinos={treinos} fichas={fichas} onAbrirTreino={() => trocarAba('treino')} />
              <SequenciaCard
                checkins={checkins}
                meta={perfil.metaSemanal}
                treinos={treinos}
                onAbrirConta={() => trocarAba('conta')}
              />
              <AcessosRapidos onAbrirTreino={() => trocarAba('treino')} onAbrirLoja={() => trocarAba('loja')}
                onAbrirPedidos={() => trocarAba('loja', { secao: 'pedidos' })} />
              <ResultadosMes
                checkins={checkins}
                treinos={treinos}
                perfil={perfil}
              />
            </div>
          </div>
        )}
      </div>
      <BarraDeNavegacao abaAtual={abaAtual} trocarAba={trocarAba} />
    </div>
  )
}

export default AppAluno
