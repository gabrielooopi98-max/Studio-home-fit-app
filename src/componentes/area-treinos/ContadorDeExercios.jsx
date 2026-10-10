import './ContadorDeExercios.css'

function ContadorDeExercios({ concluidos, total, titulo = 'Treino de hoje', dia, encerrado = false }) {
  const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0
  const treinoConcluido = total > 0 && concluidos === total

  return (
    <section className="contador-exercicios" aria-labelledby="contador-exercicios-titulo">
      <div className="contador-exercicios__topo">
        <div>
          <span className="contador-exercicios__eyebrow">{dia ? `${dia} · seu progresso` : 'Seu progresso'}</span>
          <h2 id="contador-exercicios-titulo">{titulo}</h2>
          <p>
            {encerrado
              ? 'Treino concluído. Excelente trabalho!'
              : treinoConcluido ? 'Exercícios feitos. Finalize seu treino abaixo.'
              : `${total - concluidos} ${total - concluidos === 1 ? 'exercício restante' : 'exercícios restantes'}`}
          </p>
        </div>
        <div
          className="contador-exercicios__anel"
          role="progressbar"
          aria-label={`Progresso: ${titulo}`}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={concluidos}
          style={{ '--progresso': `${progresso}%` }}
        >
          <span className="contador-exercicios__contagem">
            <strong>{concluidos}</strong>
            <span>/{total}</span>
          </span>
        </div>
      </div>

      <div className="contador-exercicios__rodape">
        <span>Progresso do treino</span>
        <strong>{progresso}%</strong>
      </div>
      <div className="contador-exercicios__barra" aria-hidden="true">
        <span
          className="contador-exercicios__preenchimento"
          style={{ width: `${progresso}%` }}
        />
      </div>
    </section>
  )
}

export default ContadorDeExercios