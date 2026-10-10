import { useState } from 'react'
import { supabase } from '../dados/supabase.js'
import { dataCurta, fichaDoMes, mesSugerido, nomeDoMes, renovarFicha, validarFicha } from '../utils/ficha.js'
import {
  alunoSumido, filtrarAlunos, linkWhatsApp, mensagemPara, nivelDePresenca, ordenarAlunos, planilhaDosAlunos,
} from '../utils/painelAdmin.js'
import CabecalhoPagina from './CabecalhoPagina.jsx'
import { Avatar, IconeWhatsApp } from './comum.jsx'
import { salvarFicha } from './dadosAdmin.js'

const ORDENS = [
  { valor: 'nome:asc', nome: 'Nome (A–Z)' },
  { valor: 'presenca:desc', nome: 'Mais tempo sem vir' },
  { valor: 'semana:desc', nome: 'Mais treinos na semana' },
  { valor: 'treino:asc', nome: 'Sem treino do mês primeiro' },
]

function textoPresenca(aluno) {
  if (aluno.diasSemVir === null) return 'Nunca veio'
  if (aluno.diasSemVir === 0) return 'Hoje'
  if (aluno.diasSemVir === 1) return 'Ontem'
  return `Há ${aluno.diasSemVir} dias`
}

// Bolinhas da meta da semana: cheias = treinos feitos.
function MetaSemana({ feitos, meta }) {
  return (
    <span className="adm-meta-semana" aria-label={`${feitos} de ${meta} treinos na semana`}>
      <span className="adm-meta-semana__pontos" aria-hidden="true">
        {Array.from({ length: Math.max(meta, Math.min(feitos, 7)) }, (_, i) => (
          <i key={i} className={i < feitos ? 'feito' : ''} />
        ))}
      </span>
      <b>{feitos}/{meta}</b>
    </span>
  )
}

function IconeSeta() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="adm-icone">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function baixarPlanilha(alunos, mes, nome) {
  const arquivo = new Blob([planilhaDosAlunos(alunos, mes)], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(arquivo)
  link.download = `${nome}-${mes}.csv`
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

function TabelaAlunos({ alunos, hoje, ir, onEnviarTreino, onDadosMudaram }) {
  const mes = mesSugerido(hoje)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [ordem, setOrdem] = useState({ coluna: 'nome', direcao: 'asc' })
  const [selecionados, setSelecionados] = useState(() => new Set())
  const [renovando, setRenovando] = useState(null)
  const [resultado, setResultado] = useState('')

  const filtros = [
    { id: 'todos', nome: 'Todos os alunos', descricao: 'cadastrados no app', tom: 'neutro' },
    { id: 'ativos', nome: 'Treinaram na semana', descricao: 'fizeram check-in desde segunda', tom: 'ok' },
    { id: 'sem-treino', nome: `Sem treino de ${nomeDoMes(mes)}`, descricao: 'falta enviar o treino do mês', tom: 'alerta' },
    { id: 'sumidos', nome: 'Sumidos', descricao: '7 dias ou mais sem vir', tom: 'perigo' },
  ]
  const visiveis = ordenarAlunos(filtrarAlunos(alunos, { busca, filtro, mes }), { ...ordem, mes })
  const contagem = Object.fromEntries(filtros.map(({ id }) => [id, filtrarAlunos(alunos, { filtro: id, mes }).length]))
  const escolhidos = alunos.filter(({ id }) => selecionados.has(id))
  const renovaveis = escolhidos.filter((aluno) => aluno.fichaAtual)
  const todosMarcados = visiveis.length > 0 && visiveis.every(({ id }) => selecionados.has(id))
  const algunsMarcados = !todosMarcados && visiveis.some(({ id }) => selecionados.has(id))

  function ordenarPor(coluna) {
    setOrdem((atual) => ({
      coluna,
      direcao: atual.coluna === coluna ? (atual.direcao === 'asc' ? 'desc' : 'asc') : coluna === 'presenca' || coluna === 'semana' ? 'desc' : 'asc',
    }))
  }

  function alternar(id) {
    setSelecionados((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  function alternarTodos() {
    setSelecionados(todosMarcados ? new Set() : new Set(visiveis.map(({ id }) => id)))
  }

  // Renova uma por uma para mostrar o progresso e não perder as que já deram certo se algo falhar.
  async function renovarSelecionados() {
    setResultado('')
    let feitas = 0
    const falhas = []
    for (const [indice, aluno] of renovaveis.entries()) {
      setRenovando({ atual: indice + 1, total: renovaveis.length })
      const { erros, ficha } = validarFicha(renovarFicha(aluno.fichaAtual, hoje))
      try {
        if (erros.length) throw new Error(erros[0])
        await salvarFicha(supabase, ficha)
        feitas++
      } catch {
        falhas.push(aluno.nome)
      }
    }
    setRenovando(null)
    setSelecionados(new Set())
    const semFicha = escolhidos.length - renovaveis.length
    setResultado([
      `${feitas} ${feitas === 1 ? 'ficha renovada' : 'fichas renovadas'} por mais um período.`,
      semFicha ? `${semFicha} sem ficha para renovar (envie o treino do mês para eles).` : '',
      falhas.length ? `Não deu para renovar: ${falhas.join(', ')}.` : '',
    ].filter(Boolean).join(' '))
    if (feitas) onDadosMudaram()
  }

  // A linha inteira abre o aluno, menos quando o clique foi num botão, link ou caixinha.
  function abrirPelaLinha(evento, aluno) {
    if (evento.target.closest('button, a, input, label')) return
    ir({ pagina: 'aluno', id: aluno.id })
  }

  const cabecalhoColuna = (id, nome, classe = '') => (
    <th scope="col" className={classe} aria-sort={ordem.coluna === id ? (ordem.direcao === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => ordenarPor(id)}>
        {nome}
        <span aria-hidden="true">{ordem.coluna === id ? (ordem.direcao === 'asc' ? '↑' : '↓') : '↕'}</span>
      </button>
    </th>
  )

  return (
    <section className="adm-alunos">
      <CabecalhoPagina
        migalhas={[{ nome: 'Alunos' }]}
        titulo="Alunos"
        descricao={`${alunos.length} ${alunos.length === 1 ? 'aluno cadastrado' : 'alunos cadastrados'} · frequência e treino de ${nomeDoMes(mes)}`}
      >
        <button type="button" className="adm-botao adm-botao--secundario" disabled={!alunos.length}
          onClick={() => baixarPlanilha(visiveis, mes, 'alunos-homefit')}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="adm-icone">
            <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Exportar planilha
        </button>
        <button type="button" className="adm-botao" onClick={() => onEnviarTreino({})}>+ Enviar treino do mês</button>
      </CabecalhoPagina>

      <div className="adm-resumo-alunos" role="group" aria-label="Filtrar por situação">
        {filtros.map(({ id, nome, descricao, tom }) => (
          <button key={id} type="button" className={`adm-resumo-aluno adm-resumo-aluno--${tom}`} aria-pressed={filtro === id}
            onClick={() => setFiltro(filtro === id && id !== 'todos' ? 'todos' : id)}>
            <span className="adm-resumo-aluno__nome">{nome}</span>
            <b>{contagem[id]}</b>
            <small>{descricao}</small>
          </button>
        ))}
      </div>

      <div className="adm-alunos__barra">
        <label className="adm-busca">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="visualmente-oculto">Buscar aluno</span>
          <input type="search" placeholder="Buscar por nome, e-mail ou telefone" value={busca} onChange={(event) => setBusca(event.target.value)} />
        </label>
        <label className="adm-alunos__ordem">
          <span>Ordenar</span>
          <select value={`${ordem.coluna}:${ordem.direcao}`}
            onChange={(event) => {
              const [coluna, direcao] = event.target.value.split(':')
              setOrdem({ coluna, direcao })
            }}>
            {!ORDENS.some(({ valor }) => valor === `${ordem.coluna}:${ordem.direcao}`) && (
              <option value={`${ordem.coluna}:${ordem.direcao}`}>Personalizado</option>
            )}
            {ORDENS.map(({ valor, nome }) => <option key={valor} value={valor}>{nome}</option>)}
          </select>
        </label>
        <span className="adm-alunos__contagem" role="status">
          {visiveis.length === alunos.length ? `${alunos.length} alunos` : `${visiveis.length} de ${alunos.length}`}
        </span>
      </div>

      {resultado && (
        <p className="adm-nota" role="status">
          {resultado}
          <button type="button" aria-label="Fechar aviso" onClick={() => setResultado('')}>✕</button>
        </p>
      )}

      {visiveis.length === 0 ? (
        <div className="adm-aviso">
          <p>{alunos.length === 0 ? 'Nenhum aluno criou conta ainda. Peça para baixarem o app e criarem a conta.' : 'Nenhum aluno encontrado com essa busca ou filtro.'}</p>
          {alunos.length > 0 && (
            <button type="button" className="adm-link" onClick={() => { setBusca(''); setFiltro('todos') }}>Limpar busca e filtro</button>
          )}
        </div>
      ) : (
        <div className="adm-alunos__tabela-caixa">
          <table className="adm-alunos__tabela">
            <thead>
              <tr>
                <th scope="col" className="adm-alunos__marcar">
                  <input type="checkbox" checked={todosMarcados} ref={(el) => { if (el) el.indeterminate = algunsMarcados }}
                    onChange={alternarTodos} aria-label="Selecionar todos os alunos da lista" />
                </th>
                {cabecalhoColuna('nome', 'Aluno')}
                {cabecalhoColuna('semana', 'Esta semana')}
                {cabecalhoColuna('presenca', 'Última presença')}
                {cabecalhoColuna('treino', `Treino de ${nomeDoMes(mes)}`)}
                <th scope="col" className="adm-alunos__acoes"><span className="visualmente-oculto">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((aluno) => {
                const treino = fichaDoMes(aluno.fichas, mes)
                const nivel = nivelDePresenca(aluno)
                const marcado = selecionados.has(aluno.id)
                return (
                  <tr key={aluno.id} className={marcado ? 'selecionado' : ''} onClick={(evento) => abrirPelaLinha(evento, aluno)}>
                    <td className="adm-alunos__marcar">
                      <input type="checkbox" checked={marcado} onChange={() => alternar(aluno.id)} aria-label={`Selecionar ${aluno.nome}`} />
                    </td>
                    <td className="adm-alunos__pessoa">
                      <Avatar nome={aluno.nome} />
                      <span>
                        <button type="button" onClick={() => ir({ pagina: 'aluno', id: aluno.id })}>{aluno.nome}</button>
                        <small>{aluno.email || aluno.telefone || 'sem contato'}</small>
                      </span>
                    </td>
                    <td data-rotulo="Semana">
                      <MetaSemana feitos={aluno.checkinsSemana} meta={aluno.metaSemanal} />
                      <small className="adm-alunos__sub">{aluno.checkinsMes} no mês</small>
                    </td>
                    <td data-rotulo="Presença">
                      <span className={`adm-presenca adm-presenca--${nivel}`}>{textoPresenca(aluno)}</span>
                      {aluno.ultimoCheckin && aluno.diasSemVir > 1 && <small className="adm-alunos__sub">{dataCurta(aluno.ultimoCheckin)}</small>}
                    </td>
                    <td data-rotulo="Treino">
                      {treino ? (
                        <>
                          <span className="adm-selo adm-selo--vigente">Enviado</span>
                          <small className="adm-alunos__sub">até {dataCurta(treino.fim)}</small>
                        </>
                      ) : <span className="adm-selo adm-selo--sem">Falta enviar</span>}
                    </td>
                    <td className="adm-alunos__acoes">
                      {aluno.telefone && (
                        <a className="adm-icone-botao adm-icone-botao--whats" target="_blank" rel="noopener noreferrer"
                          aria-label={`WhatsApp de ${aluno.nome}`} title="Chamar no WhatsApp"
                          href={linkWhatsApp(aluno.telefone, mensagemPara(alunoSumido(aluno) ? 'sumido' : '', aluno))}>
                          <IconeWhatsApp />
                        </a>
                      )}
                      {!treino && (
                        <button type="button" className="adm-botao adm-botao--pequeno" onClick={() => onEnviarTreino({ aluno, mes })}>
                          Enviar treino
                        </button>
                      )}
                      <button type="button" className="adm-icone-botao" aria-label={`Abrir ${aluno.nome}`} title="Abrir aluno"
                        onClick={() => ir({ pagina: 'aluno', id: aluno.id })}>
                        <IconeSeta />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {escolhidos.length > 0 && (
        <div className="adm-alunos__selecao" role="region" aria-label="Ações para os selecionados">
          <span><b>{escolhidos.length}</b> {escolhidos.length === 1 ? 'selecionado' : 'selecionados'}</span>
          <button type="button" className="adm-botao adm-botao--pequeno" disabled={!renovaveis.length || Boolean(renovando)}
            onClick={renovarSelecionados}>
            {renovando ? `Renovando ${renovando.atual} de ${renovando.total}…` : `Renovar fichas (${renovaveis.length})`}
          </button>
          <button type="button" className="adm-botao adm-botao--pequeno adm-botao--secundario" disabled={Boolean(renovando)}
            onClick={() => baixarPlanilha(escolhidos, mes, 'alunos-selecionados')}>
            Exportar
          </button>
          <button type="button" className="adm-link" onClick={() => setSelecionados(new Set())} disabled={Boolean(renovando)}>Limpar</button>
        </div>
      )}
    </section>
  )
}

export default TabelaAlunos
