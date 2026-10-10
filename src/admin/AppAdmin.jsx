import { useEffect, useState } from 'react'
import { supabase } from '../dados/supabase.js'
import { fichaDoMes, mesDe, mesSugerido } from '../utils/ficha.js'
import { resumoDosAlunos } from '../utils/painelAdmin.js'
import { Bloco, CardEsqueleto, Carregando } from '../componentes/Esqueleto.jsx'
import { carregarPainel } from './dadosAdmin.js'
import DetalheAluno from './DetalheAluno.jsx'
import EditorModelo from './EditorModelo.jsx'
import EnviarTreino from './EnviarTreino.jsx'
import LojaAdmin from './LojaAdmin.jsx'
import Navegacao from './Navegacao.jsx'
import PaginaEquipe from './PaginaEquipe.jsx'
import PaginaTreinos from './PaginaTreinos.jsx'
import TabelaAlunos from './TabelaAlunos.jsx'
import VisaoGeral from './VisaoGeral.jsx'
import { linkDaRota, useRota } from './rotas.js'
import './Admin.css'

function EsqueletoPainel() {
  return (
    <Carregando rotulo="Carregando painel" className="adm-esqueleto">
      <Bloco largura={220} altura={28} raio={8} />
      <div className="adm-kpis">
        {Array.from({ length: 4 }, (_, i) => (
          <CardEsqueleto key={i}><Bloco largura={110} altura={10} /><Bloco largura={70} altura={30} raio={8} /><Bloco largura={140} altura={10} /></CardEsqueleto>
        ))}
      </div>
      <CardEsqueleto><Bloco largura={160} altura={16} /><Bloco altura={180} raio={12} /></CardEsqueleto>
    </Carregando>
  )
}

// Qual item do menu fica aceso em cada página.
const MENU_DA_PAGINA = { visao: 'visao', alunos: 'alunos', aluno: 'alunos', enviar: 'treinos', treinos: 'treinos', 'editor-modelo': 'treinos', loja: 'loja', equipe: 'equipe' }

function AppAdmin({ usuario, perfil, onSair, onModoAluno }) {
  const dono = perfil.papel === 'dono'
  const [rota, ir] = useRota()
  // O que não cabe no link (aluno e ficha do envio, modelo em edição) fica guardado aqui.
  const [edicao, setEdicao] = useState(null)
  const [estado, setEstado] = useState({ carregando: true, erro: '', dados: null })
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      try {
        const dados = await carregarPainel(supabase, { dono })
        if (ativo) setEstado({ carregando: false, erro: '', dados })
      } catch (erro) {
        if (ativo) setEstado((anterior) => ({ ...anterior, carregando: false, erro: erro.message }))
      }
    }
    carregar()
    return () => { ativo = false }
  }, [dono, versao])

  const recarregar = () => setVersao((valor) => valor + 1)
  const dados = estado.dados
  const alunos = dados ? resumoDosAlunos(dados, dados.hoje) : []
  const alunoDaRota = rota.id ? alunos.find(({ id }) => id === rota.id) : null
  const paginaRestrita = !dono && (rota.pagina === 'loja' || rota.pagina === 'equipe')
  // Editor de modelo aberto pelo link (ex.: F5) sem o modelo em memória: volta para a lista.
  const editorSemDados = rota.pagina === 'editor-modelo' && (!edicao || edicao.tipo !== 'modelo')

  useEffect(() => {
    if (paginaRestrita) ir({ pagina: 'visao' })
    else if (editorSemDados) ir({ pagina: 'treinos', aba: 'modelos' })
  })

  // Todo envio ou edição de treino de aluno passa pelo mesmo passo a passo.
  function abrirEnvio({ aluno = null, ficha = null, mes = null } = {}) {
    const origem = rota.pagina === 'enviar' ? { pagina: 'treinos' } : rota
    setEdicao({ tipo: 'envio', aluno, ficha, mes: mes ?? (ficha ? mesDe(ficha.inicio) : mesSugerido(dados.hoje)), origem, chave: Date.now() })
    ir({ pagina: 'enviar' })
  }

  const abrirEditor = (aluno, ficha) => abrirEnvio({ aluno, ficha })

  function abrirEditorModelo(modelo) {
    setEdicao({ tipo: 'modelo', modelo })
    ir({ pagina: 'editor-modelo', id: modelo?.id ?? 'novo' })
  }

  function fecharModelo(salvou) {
    setEdicao(null)
    if (salvou) recarregar()
    ir({ pagina: 'treinos', aba: 'modelos' })
  }

  function sairDoEnvio() {
    const origem = edicao?.tipo === 'envio' ? edicao.origem : null
    setEdicao(null)
    ir(origem ?? { pagina: 'treinos' })
  }

  const itensMenu = [
    { id: 'visao', nome: 'Visão geral', icone: 'visao', rota: { pagina: 'visao' } },
    { id: 'alunos', nome: 'Alunos', icone: 'alunos', rota: { pagina: 'alunos' } },
    { id: 'treinos', nome: 'Treinos', icone: 'treinos', rota: { pagina: 'treinos' },
      // Quantos ainda não receberam o treino do mês.
      contador: dados ? alunos.filter((aluno) => !fichaDoMes(aluno.fichas, mesSugerido(dados.hoje))).length : 0 },
    ...(dono ? [
      { id: 'loja', nome: 'Loja', icone: 'loja', rota: { pagina: 'loja' }, contador: dados?.pedidosNovos ?? 0 },
      { id: 'equipe', nome: 'Equipe', icone: 'equipe', rota: { pagina: 'equipe' } },
    ] : []),
  ].map((item) => ({ ...item, link: linkDaRota(item.rota) }))

  let conteudo
  if (estado.carregando && !dados) {
    conteudo = <EsqueletoPainel />
  } else if (estado.erro && !dados) {
    conteudo = (
      <div className="adm-aviso" role="alert">
        <strong>Não deu para abrir o painel</strong>
        <p>{estado.erro}</p>
        <button type="button" className="adm-botao" onClick={recarregar}>Tentar novamente</button>
      </div>
    )
  } else if (paginaRestrita || editorSemDados) {
    conteudo = <EsqueletoPainel />
  } else if (rota.pagina === 'enviar') {
    // Sem dados em memória (ex.: F5), o passo a passo começa do zero, na escolha do aluno.
    const envio = edicao?.tipo === 'envio' ? edicao : { chave: 'link', mes: mesSugerido(dados.hoje) }
    conteudo = (
      <EnviarTreino key={envio.chave} alunos={alunos} hoje={dados.hoje} inicial={envio}
        onSalvou={recarregar} onSair={sairDoEnvio} />
    )
  } else if (rota.pagina === 'editor-modelo') {
    conteudo = (
      <EditorModelo key={`modelo:${edicao.modelo?.id ?? 'novo'}`}
        modelo={edicao.modelo} hoje={dados.hoje} ir={ir} onFechar={fecharModelo} />
    )
  } else if (rota.pagina === 'aluno' && alunoDaRota) {
    conteudo = (
      <DetalheAluno key={alunoDaRota.id} aluno={alunoDaRota} aba={rota.aba} dono={dono} hoje={dados.hoje} ir={ir}
        onEditarFicha={(ficha) => abrirEditor(alunoDaRota, ficha)} onFichasMudaram={recarregar} />
    )
  } else if (rota.pagina === 'aluno') {
    conteudo = (
      <div className="adm-aviso">
        <strong>Aluno não encontrado</strong>
        <p>Pode ter sido removido ou o link está incompleto.</p>
        <button type="button" className="adm-botao" onClick={() => ir({ pagina: 'alunos' })}>Ver alunos</button>
      </div>
    )
  } else if (rota.pagina === 'alunos') {
    conteudo = (
      <TabelaAlunos alunos={alunos} hoje={dados.hoje} ir={ir}
        onEnviarTreino={abrirEnvio} onDadosMudaram={recarregar} />
    )
  } else if (rota.pagina === 'treinos') {
    conteudo = (
      <PaginaTreinos aba={rota.aba} alunos={alunos} hoje={dados.hoje} ir={ir}
        onEnviar={abrirEnvio} onEditarModelo={abrirEditorModelo} />
    )
  } else if (rota.pagina === 'loja') {
    conteudo = <LojaAdmin onPedidosMudaram={recarregar} />
  } else if (rota.pagina === 'equipe') {
    conteudo = <PaginaEquipe perfis={dados.perfis} usuarioId={usuario.id} onDadosMudaram={recarregar} />
  } else {
    conteudo = <VisaoGeral perfil={perfil} dono={dono} dados={dados} alunos={alunos} ir={ir} onEditarFicha={abrirEditor} />
  }

  return (
    <div className="adm">
      <Navegacao
        itens={itensMenu}
        atual={MENU_DA_PAGINA[rota.pagina] ?? 'visao'}
        perfil={perfil}
        email={usuario.email}
        onIr={(item) => ir(item.rota)}
        onModoAluno={() => {
          // Sai do endereço do painel para o app do aluno abrir limpo.
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
          onModoAluno()
        }}
        onSair={onSair}
      />
      <main className="adm-principal">
        {estado.erro && dados && <p className="adm-erro adm-erro--bloco" role="alert">{estado.erro}</p>}
        <div className="adm-principal__barra">
          <button type="button" className="adm-atualizar" onClick={recarregar} disabled={estado.carregando} aria-label="Atualizar dados">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={estado.carregando ? 'girando' : ''}>
              <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{estado.carregando ? 'Atualizando…' : 'Atualizar'}</span>
          </button>
        </div>
        {conteudo}
      </main>
    </div>
  )
}

export default AppAdmin
