import { Bloco, CardEsqueleto, Carregando } from './Esqueleto.jsx'

const repetir = (quantidade, desenhar) => Array.from({ length: quantidade }, (_, indice) => desenhar(indice))

// Primeira abertura do app (sem cópia salva no aparelho): banner + cards da tela inicial.
export function EsqueletoInicio() {
  return (
    <Carregando rotulo="Carregando seus dados" className="esq-inicio">
      <header className="cabecalho">
        <div className="cabecalho__topo">
          <img className="cabecalho__logo" src="/logo-academia/logo-homefit-branca.svg" alt="" />
        </div>
        <div className="esqueleto-pilha esq-inicio__saudacao">
          <Bloco largura={130} altura={10} />
          <Bloco largura={90} altura={12} />
          <Bloco largura="min(240px, 70%)" altura={38} raio={10} />
          <Bloco largura="min(200px, 60%)" altura={12} />
        </div>
      </header>

      <div className="painel-inicio esq-inicio__painel">
        <CardEsqueleto className="esq-sobreposto">
          <div className="esqueleto-linha esqueleto-linha--entre">
            <div className="esqueleto-pilha" style={{ flex: 1 }}>
              <Bloco largura={90} altura={9} />
              <Bloco largura="70%" altura={24} />
              <Bloco largura="55%" altura={11} />
            </div>
            <Bloco largura={64} altura={64} raio={999} />
          </div>
          <div className="esq-dias">{repetir(5, (i) => <Bloco key={i} largura={34} altura={34} raio={999} />)}</div>
          <Bloco altura={52} raio={14} />
        </CardEsqueleto>

        <CardEsqueleto className="esq-sobreposto-desktop">
          <Bloco largura={140} altura={16} />
          <div className="esq-grade-2">{repetir(4, (i) => <Bloco key={i} altura={110} raio={16} />)}</div>
        </CardEsqueleto>

        <CardEsqueleto>
          <div className="esqueleto-linha esqueleto-linha--entre">
            <div className="esqueleto-pilha" style={{ flex: 1 }}>
              <Bloco largura={90} altura={9} />
              <Bloco largura="75%" altura={28} />
            </div>
            <Bloco largura={60} altura={60} raio={16} />
          </div>
          <div className="esqueleto-linha">{repetir(3, (i) => <Bloco key={i} largura={70} altura={18} />)}</div>
          <Bloco altura={52} raio={14} />
        </CardEsqueleto>

        <CardEsqueleto>
          <div className="esqueleto-linha">
            <Bloco largura={52} altura={52} raio={16} />
            <div className="esqueleto-pilha" style={{ flex: 1 }}>
              <Bloco largura={80} altura={9} />
              <Bloco largura="65%" altura={20} />
            </div>
          </div>
          <div className="esq-semanas">{repetir(8, (i) => <Bloco key={i} altura={44} raio={7} />)}</div>
        </CardEsqueleto>
      </div>
    </Carregando>
  )
}

// Aba Treino enquanto o catálogo de exercícios chega.
export function EsqueletoTreino() {
  return (
    <Carregando rotulo="Carregando exercícios" className="esq-treino">
      <CardEsqueleto className="esq-sobreposto">
        <div className="esqueleto-linha esqueleto-linha--entre">
          <div className="esqueleto-pilha" style={{ flex: 1 }}>
            <Bloco largura={110} altura={9} />
            <Bloco largura="80%" altura={22} />
            <Bloco largura={130} altura={11} />
          </div>
          <Bloco largura={58} altura={58} raio={999} />
        </div>
        <Bloco altura={6} raio={999} />
      </CardEsqueleto>

      <div className="esq-treino__dias">
        {repetir(5, (i) => (
          <div key={i} className="esqueleto-pilha esq-treino__dia">
            <Bloco largura={26} altura={8} />
            <Bloco largura={22} altura={22} raio={6} />
            <Bloco largura={18} altura={8} />
          </div>
        ))}
      </div>

      <CardEsqueleto className="esqueleto-linha esqueleto-linha--entre esq-treino__sessao">
        <div className="esqueleto-pilha" style={{ flex: 1 }}>
          <Bloco largura="55%" altura={13} />
          <Bloco largura="40%" altura={10} />
        </div>
        <Bloco largura={120} altura={42} raio={12} />
      </CardEsqueleto>

      <div className="esq-treino__lista">
        {repetir(4, (i) => (
          <CardEsqueleto key={i} className="esq-exercicio">
            <div className="esq-exercicio__topo">
              <Bloco altura={150} raio={14} className="esq-exercicio__foto" />
              <div className="esqueleto-pilha">
                <Bloco largura={64} altura={18} raio={6} />
                <Bloco largura="90%" altura={16} />
                <Bloco largura="60%" altura={16} />
                <Bloco largura={90} altura={10} />
              </div>
            </div>
            <div className="esq-exercicio__series">{repetir(4, (j) => <Bloco key={j} altura={44} raio={10} />)}</div>
          </CardEsqueleto>
        ))}
      </div>
    </Carregando>
  )
}

// Vitrine da loja: mesmo formato dos cards de produto.
export function EsqueletoProdutos({ quantidade = 6 }) {
  return (
    <Carregando rotulo="Carregando produtos">
      <ul className="loja__grade">
        {repetir(quantidade, (i) => (
          <li key={i}>
            <div className="card-produto esq-produto" aria-hidden="true">
              <Bloco className="esq-produto__foto" altura="auto" raio={15} />
              <div className="esqueleto-pilha esq-produto__info">
                <Bloco largura="40%" altura={9} />
                <Bloco largura="90%" altura={13} />
                <Bloco largura="65%" altura={13} />
                <Bloco largura="50%" altura={22} raio={6} />
                <Bloco altura={42} raio={12} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Carregando>
  )
}

// Pedidos (aluno e dono).
export function EsqueletoPedidos({ quantidade = 2, comCliente = false }) {
  return (
    <Carregando rotulo="Carregando pedidos" className="loja__pedidos">
      {repetir(quantidade, (i) => (
        <CardEsqueleto key={i}>
          <div className="esqueleto-linha esqueleto-linha--entre">
            <div className="esqueleto-pilha">
              <Bloco largura={110} altura={18} />
              <Bloco largura={90} altura={10} />
            </div>
            <Bloco largura={84} altura={24} raio={999} />
          </div>
          {comCliente && <Bloco altura={40} raio={12} />}
          <div className="esqueleto-linha esqueleto-linha--entre"><Bloco largura="60%" altura={12} /><Bloco largura={60} altura={12} /></div>
          <div className="esqueleto-linha esqueleto-linha--entre"><Bloco largura="45%" altura={12} /><Bloco largura={60} altura={12} /></div>
          <div className="esqueleto-linha esqueleto-linha--entre">
            <Bloco largura={110} altura={20} />
            <Bloco largura={130} altura={40} raio={12} />
          </div>
        </CardEsqueleto>
      ))}
    </Carregando>
  )
}

// Lista de produtos do dono.
export function EsqueletoListaProdutos({ quantidade = 4 }) {
  return (
    <Carregando rotulo="Carregando produtos" className="gerenciar__produtos">
      {repetir(quantidade, (i) => (
        <CardEsqueleto key={i} className="esqueleto-linha esq-linha-produto">
          <Bloco largura={56} altura={56} raio={12} />
          <div className="esqueleto-pilha" style={{ flex: 1 }}>
            <Bloco largura="70%" altura={13} />
            <Bloco largura="45%" altura={10} />
          </div>
          <div className="esqueleto-pilha" style={{ justifyItems: 'end' }}>
            <Bloco largura={70} altura={16} />
            <Bloco largura={80} altura={10} />
          </div>
        </CardEsqueleto>
      ))}
    </Carregando>
  )
}
