import { useState } from 'react'
import Gaveta from '../componentes/Gaveta.jsx'
import { CATALOGO_EXERCICIOS, GRUPOS_MUSCULARES } from '../utils/catalogoExercicios.js'
import { itemDoCatalogo, itemPersonalizado } from '../utils/ficha.js'
import { normalizar } from '../utils/vitrine.js'

// Escolher exercícios do catálogo (ou criar um novo) sem fechar a janela a cada um.
function SeletorExercicio({ aberto, treinoNome, idsNoTreino, onAdicionar, onFechar }) {
  const [busca, setBusca] = useState('')
  const [grupo, setGrupo] = useState('todos')
  const termo = normalizar(busca)
  const lista = CATALOGO_EXERCICIOS.filter((exercicio) =>
    (grupo === 'todos' || exercicio.grupo === grupo) &&
    (!termo || normalizar(`${exercicio.nome} ${exercicio.grupo}`).includes(termo)))
  const nomeExato = lista.some((exercicio) => normalizar(exercicio.nome) === termo)

  function fechar() {
    setBusca('')
    setGrupo('todos')
    onFechar()
  }

  return (
    <Gaveta
      aberta={aberto}
      titulo={`Adicionar ao ${treinoNome}`}
      onFechar={fechar}
      rodape={(
        <button type="button" className="adm-botao adm-botao--largo" onClick={fechar}>
          Pronto · {idsNoTreino.size} {idsNoTreino.size === 1 ? 'exercício' : 'exercícios'} no treino
        </button>
      )}
    >
      <div className="seletor">
        <label className="adm-busca">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="visualmente-oculto">Buscar exercício</span>
          <input
            type="search"
            placeholder="Buscar: supino, agachamento, rosca…"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </label>

        <div className="adm-chips adm-chips--rolagem" role="group" aria-label="Grupo muscular">
          {['todos', ...GRUPOS_MUSCULARES].map((nome) => (
            <button key={nome} type="button" aria-pressed={grupo === nome} onClick={() => setGrupo(nome)}>
              {nome === 'todos' ? 'Todos' : nome}
            </button>
          ))}
        </div>

        {busca.trim() && !nomeExato && (
          <button type="button" className="seletor__criar" onClick={() => {
            onAdicionar(itemPersonalizado(busca))
            setBusca('')
          }}>
            <span aria-hidden="true">+</span>
            <span>
              <span>Criar exercício “<b>{busca.trim()}</b>”</span>
              <small>Para algo que não está na lista (sem foto).</small>
            </span>
          </button>
        )}

        <ul className="seletor__lista">
          {lista.map((exercicio) => {
            const jaTem = idsNoTreino.has(exercicio.id)
            return (
              <li key={exercicio.id}>
                <button type="button" disabled={jaTem} onClick={() => onAdicionar(itemDoCatalogo(exercicio))}
                  aria-label={jaTem ? `${exercicio.nome}, já adicionado` : `Adicionar ${exercicio.nome}`}>
                  <span className="seletor__info">
                    <b>{exercicio.nome}</b>
                    <small>{exercicio.grupo} · {exercicio.series}x{exercicio.repeticoes}{exercicio.unidade === 'seg' ? ' seg' : ''}</small>
                  </span>
                  <span className={`seletor__marca${jaTem ? ' feito' : ''}`} aria-hidden="true">{jaTem ? '✓' : '+'}</span>
                </button>
              </li>
            )
          })}
        </ul>
        {lista.length === 0 && !busca.trim() && <p className="adm-vazio">Nenhum exercício neste grupo.</p>}
      </div>
    </Gaveta>
  )
}

export default SeletorExercicio
