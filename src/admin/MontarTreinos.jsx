import { useState } from 'react'
import { DESCANSOS, DIAS_UTEIS, LETRAS, MAXIMO_TREINOS, diasDoTreinoTexto, novoTreino, textoDescanso } from '../utils/ficha.js'
import MidiaExercicio from './MidiaExercicio.jsx'
import SeletorExercicio from './SeletorExercicio.jsx'

const SUGESTOES_REPS = ['6', '8', '10', '12', '15', '20', '8-10', '10-12', '12-15', '30 seg', 'até a falha']

// ---------------------------------------------------------------- um exercício
// O essencial (séries, repetições, descanso) sempre à vista; carga, recado, foto e vídeo só quando o personal quiser.
function CartaoExercicio({ item, posicao, total, idCampo, onMudar, onMidia, onMover, onRemover }) {
  const [extras, setExtras] = useState(Boolean(item.carga || item.observacao || item.imagem || item.video))
  return (
    <li className="adm-exercicio">
      <div className="adm-exercicio__topo">
        <span className="adm-exercicio__numero">{posicao + 1}</span>
        <span className="adm-exercicio__nome">
          <b>{item.nome}</b>
          <small>{item.grupo || 'Personalizado'}</small>
        </span>
        <span className="adm-exercicio__ordem">
          <button type="button" aria-label={`Subir ${item.nome}`} disabled={posicao === 0} onClick={() => onMover(-1)}>↑</button>
          <button type="button" aria-label={`Descer ${item.nome}`} disabled={posicao === total - 1} onClick={() => onMover(1)}>↓</button>
          <button type="button" className="perigo" aria-label={`Remover ${item.nome}`} onClick={onRemover}>✕</button>
        </span>
      </div>

      <div className="adm-exercicio__campos">
        <div className="adm-campo">
          <span id={`${idCampo}-series`}>Séries</span>
          <div className="adm-passo" role="group" aria-labelledby={`${idCampo}-series`}>
            <button type="button" aria-label="Menos uma série" disabled={item.series <= 1} onClick={() => onMudar({ series: item.series - 1 })}>−</button>
            <output>{item.series}</output>
            <button type="button" aria-label="Mais uma série" disabled={item.series >= 10} onClick={() => onMudar({ series: item.series + 1 })}>+</button>
          </div>
        </div>
        <label className="adm-campo">
          <span>Repetições</span>
          <input value={item.repeticoes} list="sugestoes-reps" maxLength={20} placeholder="12"
            onChange={(event) => onMudar({ repeticoes: event.target.value })} />
        </label>
        <label className="adm-campo">
          <span>Descanso</span>
          <select value={item.descanso} onChange={(event) => onMudar({ descanso: Number(event.target.value) })}>
            {[...new Set([...DESCANSOS, item.descanso])].sort((a, b) => a - b).map((segundos) => (
              <option key={segundos} value={segundos}>{textoDescanso(segundos)}</option>
            ))}
          </select>
        </label>
      </div>

      {extras ? (
        <div className="adm-exercicio__extras">
          <label className="adm-campo">
            <span>Carga sugerida</span>
            <input value={item.carga} maxLength={30} placeholder="ex.: 20 kg" onChange={(event) => onMudar({ carga: event.target.value })} />
          </label>
          <label className="adm-campo">
            <span>Como fazer (o aluno vê)</span>
            <textarea rows={2} value={item.observacao} maxLength={300}
              placeholder="Ex.: desce devagar, 3 segundos. Cotovelos fechados."
              onChange={(event) => onMudar({ observacao: event.target.value })} />
          </label>
          <MidiaExercicio item={item} onMudar={onMidia} />
        </div>
      ) : (
        <button type="button" className="adm-exercicio__mais" onClick={() => setExtras(true)}>
          + Carga, como fazer, foto e vídeo
        </button>
      )}
    </li>
  )
}

// ---------------------------------------------------------------- treinos A, B, C…
// Parte da ficha que é igual para aluno e modelo: os treinos, os dias e os exercícios.
function MontarTreinos({ ficha, onMudar }) {
  const [ativo, setAtivo] = useState(0)
  const [seletorAberto, setSeletorAberto] = useState(false)
  const [padrao, setPadrao] = useState({ series: 3, repeticoes: '12', descanso: 60 })
  const [aviso, setAviso] = useState('')

  const indice = Math.min(ativo, ficha.treinos.length - 1)
  const treino = ficha.treinos[indice]
  const idsNoTreino = new Set(treino.exercicios.map(({ id }) => id))
  const donoDoDia = new Map(ficha.treinos.flatMap((t, i) => t.dias.map((dia) => [dia, i])))
  const diasLivres = DIAS_UTEIS.filter(({ indice: dia }) => !donoDoDia.has(dia))

  const mudarTreino = (campos) => onMudar((f) => { Object.assign(f.treinos[indice], campos); return f })
  // O envio de foto/vídeo termina depois: acha o exercício pelo id, mesmo que ele tenha mudado de posição.
  const mudarPorId = (t, id, campos) => onMudar((f) => {
    const alvo = f.treinos[t]?.exercicios.find((exercicio) => exercicio.id === id)
    if (alvo) Object.assign(alvo, campos)
    return f
  })
  const mudarExercicio = (j, campos) => onMudar((f) => { Object.assign(f.treinos[indice].exercicios[j], campos); return f })

  function trocarDeTreino(i) {
    setAtivo(i)
    setAviso('')
  }

  function alternarDia(dia) {
    const outro = donoDoDia.get(dia)
    onMudar((f) => {
      const atual = f.treinos[indice]
      if (atual.dias.includes(dia)) {
        atual.dias = atual.dias.filter((d) => d !== dia)
      } else {
        // Dia que estava em outro treino passa para este.
        if (outro !== undefined && outro !== indice) f.treinos[outro].dias = f.treinos[outro].dias.filter((d) => d !== dia)
        atual.dias = [...atual.dias, dia].sort()
      }
      return f
    })
    setAviso(outro !== undefined && outro !== indice
      ? `${DIAS_UTEIS[dia].nome} saiu do treino ${LETRAS[outro]} e veio para o ${LETRAS[indice]}.`
      : '')
  }

  function adicionarTreino() {
    if (ficha.treinos.length >= MAXIMO_TREINOS) return
    // O treino novo já pega o primeiro dia que ninguém usa.
    const dia = diasLivres[0]?.indice
    onMudar((f) => ({ ...f, treinos: [...f.treinos, { ...novoTreino(f.treinos.length), dias: dia === undefined ? [] : [dia] }] }))
    trocarDeTreino(ficha.treinos.length)
  }

  function duplicarTreino() {
    if (ficha.treinos.length >= MAXIMO_TREINOS) return
    onMudar((f) => ({ ...f, treinos: [...f.treinos, { ...structuredClone(f.treinos[indice]), letra: LETRAS[f.treinos.length], dias: [] }] }))
    trocarDeTreino(ficha.treinos.length)
  }

  function removerTreino() {
    if (ficha.treinos.length <= 1) return
    onMudar((f) => ({ ...f, treinos: f.treinos.filter((_, i) => i !== indice).map((t, i) => ({ ...t, letra: LETRAS[i] })) }))
    trocarDeTreino(Math.max(0, indice - 1))
  }

  function moverExercicio(j, delta) {
    onMudar((f) => {
      const lista = f.treinos[indice].exercicios
      const [item] = lista.splice(j, 1)
      lista.splice(j + delta, 0, item)
      return f
    })
  }

  function aplicarATodos() {
    onMudar((f) => {
      f.treinos[indice].exercicios = f.treinos[indice].exercicios.map((item) => ({ ...item, ...padrao }))
      return f
    })
    setAviso(`${padrao.series}x${padrao.repeticoes} aplicado a todos os exercícios do treino ${treino.letra}.`)
  }

  return (
    <section className="adm-painel-card adm-editor__treinos" aria-label="Treinos">
      <div className="adm-montar__titulo">
        <b>Treinos da semana</b>
        <small>Cada letra é um treino. Escolha os dias e os exercícios de cada um.</small>
      </div>

      <div className="adm-treinos__abas" role="tablist" aria-label="Treinos da ficha">
        {ficha.treinos.map((t, i) => (
          <button key={t.letra} type="button" role="tab" aria-selected={i === indice} onClick={() => trocarDeTreino(i)}>
            <b>{t.letra}</b>
            <small>{t.dias.length ? diasDoTreinoTexto(t.dias) : 'sem dia'}</small>
          </button>
        ))}
        {ficha.treinos.length < MAXIMO_TREINOS && (
          <button type="button" className="adm-treinos__novo" onClick={adicionarTreino} aria-label="Adicionar treino">+ Treino</button>
        )}
      </div>

      <div className="adm-treino">
        <div className="adm-treino__cabeca">
          <label className="adm-campo">
            <span>Nome do treino {treino.letra}</span>
            <input value={treino.nome} maxLength={40} placeholder="Ex.: Peito e tríceps"
              onChange={(event) => mudarTreino({ nome: event.target.value })} />
          </label>
          <div className="adm-campo">
            <span>Em quais dias o aluno faz o treino {treino.letra}?</span>
            <div className="adm-dias" role="group" aria-label={`Dias do treino ${treino.letra}`}>
              {DIAS_UTEIS.map(({ indice: dia, curto, nome }) => {
                const outro = donoDoDia.get(dia)
                const ocupado = outro !== undefined && outro !== indice
                return (
                  <button key={dia} type="button" aria-pressed={treino.dias.includes(dia)}
                    aria-label={`${nome}${ocupado ? `, hoje no treino ${LETRAS[outro]}` : ''}`}
                    className={ocupado ? 'ocupado' : ''} onClick={() => alternarDia(dia)}>
                    {curto}
                    {ocupado && <small>{LETRAS[outro]}</small>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {aviso && <p className="adm-dica" role="status">{aviso}</p>}

        {treino.exercicios.length > 1 && (
          <details className="adm-padrao">
            <summary>Mesmas séries e repetições para todos do treino {treino.letra}</summary>
            <div className="adm-padrao__campos">
              <label className="adm-campo">
                <span>Séries</span>
                <select value={padrao.series} onChange={(event) => setPadrao({ ...padrao, series: Number(event.target.value) })}>
                  {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                </select>
              </label>
              <label className="adm-campo">
                <span>Repetições</span>
                <input value={padrao.repeticoes} list="sugestoes-reps" maxLength={20}
                  onChange={(event) => setPadrao({ ...padrao, repeticoes: event.target.value })} />
              </label>
              <label className="adm-campo">
                <span>Descanso</span>
                <select value={padrao.descanso} onChange={(event) => setPadrao({ ...padrao, descanso: Number(event.target.value) })}>
                  {DESCANSOS.map((segundos) => <option key={segundos} value={segundos}>{textoDescanso(segundos)}</option>)}
                </select>
              </label>
              <button type="button" className="adm-botao adm-botao--secundario" onClick={aplicarATodos}>Aplicar a todos</button>
            </div>
          </details>
        )}

        {treino.exercicios.length === 0 ? (
          <div className="adm-vazio adm-vazio--acao">
            <p>O treino {treino.letra} ainda não tem exercícios. Toque no botão abaixo para escolher.</p>
          </div>
        ) : (
          <ol className="adm-exercicios">
            {treino.exercicios.map((item, j) => (
              <CartaoExercicio
                key={item.id}
                item={item}
                posicao={j}
                total={treino.exercicios.length}
                idCampo={`ex-${indice}-${j}`}
                onMudar={(campos) => mudarExercicio(j, campos)}
                onMidia={(campos) => mudarPorId(indice, item.id, campos)}
                onMover={(delta) => moverExercicio(j, delta)}
                onRemover={() => onMudar((f) => { f.treinos[indice].exercicios.splice(j, 1); return f })}
              />
            ))}
          </ol>
        )}

        <button type="button" className="adm-botao adm-botao--largo adm-botao--adicionar" onClick={() => setSeletorAberto(true)}>
          + Adicionar exercício ao treino {treino.letra}
        </button>

        <div className="adm-treino__rodape">
          <button type="button" className="adm-link" onClick={duplicarTreino} disabled={ficha.treinos.length >= MAXIMO_TREINOS}>
            Duplicar treino {treino.letra}
          </button>
          {ficha.treinos.length > 1 && (
            <button type="button" className="adm-link adm-link--perigo" onClick={removerTreino}>Excluir treino {treino.letra}</button>
          )}
        </div>
      </div>

      <datalist id="sugestoes-reps">
        {SUGESTOES_REPS.map((valor) => <option key={valor} value={valor} />)}
      </datalist>

      <SeletorExercicio
        aberto={seletorAberto}
        treinoNome={`treino ${treino.letra}`}
        idsNoTreino={idsNoTreino}
        onAdicionar={(item) => onMudar((f) => { f.treinos[indice].exercicios.push(item); return f })}
        onFechar={() => setSeletorAberto(false)}
      />
    </section>
  )
}

export default MontarTreinos
