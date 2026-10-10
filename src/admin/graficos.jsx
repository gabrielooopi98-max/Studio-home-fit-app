import { useState } from 'react'

function escalaBonita(maximo) {
  if (maximo <= 4) return 4
  const passo = maximo <= 10 ? 2 : maximo <= 25 ? 5 : maximo <= 50 ? 10 : 20
  return Math.ceil(maximo / passo) * passo
}

// Colunas de uma série só (ex.: check-ins por dia). Passe o mouse ou toque para ver o valor.
export function GraficoBarras({ dados, descricao, formatarRotulo, formatarDica, marcarRotulo = () => true }) {
  const [ativo, setAtivo] = useState(null)
  const topo = escalaBonita(Math.max(0, ...dados.map(({ valor }) => valor)))
  const linhas = [topo, topo / 2, 0]

  return (
    <figure className="adm-grafico" aria-label={descricao}>
      <div className="adm-grafico__area">
        <div className="adm-grafico__eixo" aria-hidden="true">
          {linhas.map((valor) => <span key={valor}>{valor}</span>)}
        </div>
        <div className="adm-grafico__plot" onMouseLeave={() => setAtivo(null)}>
          {linhas.map((valor) => (
            <i key={valor} className="adm-grafico__grade" style={{ bottom: `${(valor / topo) * 100}%` }} aria-hidden="true" />
          ))}
          <ol className="adm-grafico__barras" style={{ gridTemplateColumns: `repeat(${dados.length}, minmax(0, 1fr))` }}>
            {dados.map((item, indice) => (
              <li key={item.chave}>
                <button
                  type="button"
                  className={`adm-grafico__coluna${ativo === indice ? ' ativo' : ''}`}
                  aria-label={formatarDica(item)}
                  onMouseEnter={() => setAtivo(indice)}
                  onFocus={() => setAtivo(indice)}
                  onBlur={() => setAtivo(null)}
                  onClick={() => setAtivo(ativo === indice ? null : indice)}
                >
                  <span
                    className={`adm-grafico__barra${item.valor === 0 ? ' zero' : ''}${item.destaque ? ' destaque' : ''}`}
                    style={{ height: item.valor ? `${(item.valor / topo) * 100}%` : undefined }}
                  />
                </button>
                {ativo === indice && (
                  <span className={`adm-grafico__dica${indice > dados.length * 0.7 ? ' esquerda' : indice < dados.length * 0.3 ? ' direita' : ''}`} role="status">
                    {formatarDica(item)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="adm-grafico__rotulos" style={{ gridTemplateColumns: `repeat(${dados.length}, minmax(0, 1fr))` }} aria-hidden="true">
        {dados.map((item, indice) => <span key={item.chave}>{marcarRotulo(item, indice) ? formatarRotulo(item) : ''}</span>)}
      </div>
    </figure>
  )
}

// Linha de uma série (ex.: peso ao longo do tempo), com o último valor marcado.
export function GraficoLinha({ pontos, descricao, formatarValor, formatarData }) {
  const [ativo, setAtivo] = useState(null)
  if (pontos.length < 2) return null
  const largura = 600
  const altura = 180
  const margem = { topo: 16, base: 8, lado: 8 }
  const valores = pontos.map(({ valor }) => valor)
  let minimo = Math.min(...valores)
  let maximo = Math.max(...valores)
  if (maximo - minimo < 2) { minimo -= 1; maximo += 1 }
  const x = (indice) => margem.lado + (indice / (pontos.length - 1)) * (largura - margem.lado * 2)
  const y = (valor) => margem.topo + (1 - (valor - minimo) / (maximo - minimo)) * (altura - margem.topo - margem.base)
  const caminho = pontos.map((ponto, indice) => `${indice ? 'L' : 'M'}${x(indice).toFixed(1)},${y(ponto.valor).toFixed(1)}`).join(' ')
  const area = `${caminho} L${x(pontos.length - 1).toFixed(1)},${altura} L${x(0).toFixed(1)},${altura} Z`
  const mostrado = ativo ?? pontos.length - 1

  function aoMover(event) {
    const caixa = event.currentTarget.getBoundingClientRect()
    const proporcao = (event.clientX - caixa.left) / caixa.width
    setAtivo(Math.max(0, Math.min(pontos.length - 1, Math.round(proporcao * (pontos.length - 1)))))
  }

  return (
    <figure className="adm-linha-grafico" aria-label={descricao}>
      <div className="adm-linha-grafico__valor" aria-hidden="true">
        <b>{formatarValor(pontos[mostrado].valor)}</b>
        <span>{formatarData(pontos[mostrado].data)}</span>
      </div>
      <div className="adm-linha-grafico__caixa">
      <svg viewBox={`0 0 ${largura} ${altura}`} preserveAspectRatio="none" role="img" aria-label={descricao}
        onPointerMove={aoMover} onPointerLeave={() => setAtivo(null)}>
        <line x1="0" x2={largura} y1={y(maximo)} y2={y(maximo)} className="grade" />
        <line x1="0" x2={largura} y1={y(minimo)} y2={y(minimo)} className="grade" />
        <path d={area} className="area" />
        <path d={caminho} className="traco" vectorEffect="non-scaling-stroke" />
        <line x1={x(mostrado)} x2={x(mostrado)} y1="0" y2={altura} className="cursor" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="adm-linha-grafico__ponto" style={{ left: `${(x(mostrado) / largura) * 100}%`, top: `${(y(pontos[mostrado].valor) / altura) * 100}%` }} aria-hidden="true" />
      </div>
      <div className="adm-linha-grafico__extremos" aria-hidden="true">
        <span>{formatarData(pontos[0].data)}</span>
        <span>{formatarData(pontos.at(-1).data)}</span>
      </div>
    </figure>
  )
}
