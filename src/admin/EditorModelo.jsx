import { useState } from 'react'
import { supabase } from '../dados/supabase.js'
import { OBJETIVOS, diasEntre, novaFicha, somarDias, validarFicha } from '../utils/ficha.js'
import CabecalhoPagina from './CabecalhoPagina.jsx'
import { salvarModelo } from './dadosAdmin.js'
import MontarTreinos from './MontarTreinos.jsx'

const DURACOES = [['4 semanas', 28], ['1 mês', 30], ['6 semanas', 42], ['8 semanas', 56], ['12 semanas', 84]]

// Modelo de treino: montado uma vez, usado como ponto de partida para vários alunos.
function EditorModelo({ modelo, hoje, ir, onFechar }) {
  const [ficha, setFicha] = useState(() => (modelo ? {
    id: modelo.id, aluno_id: null, titulo: modelo.nome, objetivo: modelo.objetivo, observacoes: modelo.observacoes,
    inicio: hoje, fim: somarDias(hoje, modelo.duracao_dias - 1), treinos: structuredClone(modelo.treinos),
  } : { ...novaFicha(null, hoje), titulo: '' }))
  const [erros, setErros] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(null)
  const [alterado, setAlterado] = useState(false)
  const [confirmarSaida, setConfirmarSaida] = useState(false)
  const duracao = diasEntre(ficha.inicio, ficha.fim) + 1

  function mudar(transformar) {
    setFicha((atual) => transformar(structuredClone(atual)))
    setAlterado(true)
    setErros([])
    setConfirmarSaida(false)
  }

  async function salvar() {
    const { erros: problemas, ficha: pronta } = validarFicha(ficha)
    if (!ficha.titulo.trim()) problemas.unshift('Dê um nome ao modelo, por exemplo “Iniciante 3x por semana”.')
    if (problemas.length) {
      setErros(problemas)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSalvando(true)
    try {
      setSalvo(await salvarModelo(supabase, {
        ...(ficha.id ? { id: ficha.id } : {}),
        nome: pronta.titulo,
        objetivo: pronta.objetivo,
        observacoes: pronta.observacoes,
        duracao_dias: duracao,
        treinos: pronta.treinos,
      }))
      setAlterado(false)
    } catch (erro) {
      setErros([erro.message])
    } finally {
      setSalvando(false)
    }
  }

  function sair() {
    if (alterado && !confirmarSaida) return setConfirmarSaida(true)
    onFechar(false)
  }

  if (salvo) {
    return (
      <section className="adm-editor" aria-label="Modelo salvo">
        <div className="adm-painel-card adm-salvo" role="status">
          <span className="adm-salvo__icone" aria-hidden="true">✓</span>
          <h1>Modelo salvo</h1>
          <p><b>{salvo.nome}</b> · {salvo.treinos.length} {salvo.treinos.length === 1 ? 'treino' : 'treinos'}</p>
          <p>Ele aparece em “Usar um modelo pronto” quando você for enviar o treino do mês.</p>
          <div className="adm-acoes adm-acoes--centro">
            <button type="button" className="adm-botao adm-botao--secundario" onClick={() => onFechar(true)}>Voltar aos modelos</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="adm-editor" aria-label="Modelo de treino">
      <CabecalhoPagina
        migalhas={[
          { nome: 'Treinos', aoClicar: () => ir({ pagina: 'treinos' }) },
          { nome: 'Modelos', aoClicar: sair },
          { nome: ficha.id ? 'Editar modelo' : 'Novo modelo' },
        ]}
        titulo={ficha.id ? 'Editar modelo' : 'Novo modelo'}
        descricao="Monte uma vez e use como ponto de partida para vários alunos."
      />

      {erros.length > 0 && (
        <div className="adm-erros" role="alert">
          <b>Antes de salvar, ajuste:</b>
          <ul>{erros.map((erro) => <li key={erro}>{erro}</li>)}</ul>
        </div>
      )}

      <section className="adm-painel-card adm-editor__dados" aria-label="Dados do modelo">
        <label className="adm-campo adm-campo--largo">
          <span>Nome do modelo</span>
          <input value={ficha.titulo} maxLength={60} placeholder="Ex.: Iniciante 3x por semana"
            onChange={(event) => mudar((f) => ({ ...f, titulo: event.target.value }))} />
        </label>
        <label className="adm-campo">
          <span>Objetivo</span>
          <select value={ficha.objetivo} onChange={(event) => mudar((f) => ({ ...f, objetivo: event.target.value }))}>
            {OBJETIVOS.map((objetivo) => <option key={objetivo}>{objetivo}</option>)}
          </select>
        </label>
        <label className="adm-campo">
          <span>Duração</span>
          <select value={duracao} onChange={(event) => mudar((f) => ({ ...f, fim: somarDias(f.inicio, Number(event.target.value) - 1) }))}>
            {[...new Map([...DURACOES, [`${duracao} dias`, duracao]].map(([rotulo, dias]) => [dias, rotulo]))]
              .sort(([a], [b]) => a - b)
              .map(([dias, rotulo]) => <option key={dias} value={dias}>{rotulo}</option>)}
          </select>
        </label>
        <label className="adm-campo adm-campo--largo">
          <span>Recado geral (opcional)</span>
          <textarea rows={2} maxLength={1000} value={ficha.observacoes}
            placeholder="Ex.: aqueça 10 min na esteira antes. Beba água!"
            onChange={(event) => mudar((f) => ({ ...f, observacoes: event.target.value }))} />
        </label>
      </section>

      <MontarTreinos ficha={ficha} onMudar={mudar} />

      <div className="adm-assistente__rodape">
        <button type="button" className={`adm-voltar${confirmarSaida ? ' confirmando' : ''}`} onClick={sair}>
          {confirmarSaida ? 'Sair sem salvar?' : '← Voltar'}
        </button>
        <button type="button" className="adm-botao" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar modelo'}
        </button>
      </div>
    </section>
  )
}

export default EditorModelo
