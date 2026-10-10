import './BarraDeNavegacao.css'

function BarraDeNavegacao({ abaAtual, trocarAba }) {
    return (
        <nav className="barra-navegacao">
            <div className="barra-navegacao-itens">
                <div className="barra-navegacao-marca" aria-hidden="true">
                    <span>HF</span>
                </div>

                {/* Início */}
                <button
                    type="button"
                    className={`item-navegacao ${abaAtual === 'inicio' ? 'ativo' : ''}`}
                    onClick={() => trocarAba('inicio')}
                >
                    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" aria-hidden="true">
                        <path
                            d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-5h4v5"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        />
                    </svg>
                    <span>Início</span>
                </button>

                {/* Treino */}
                <button
                    type="button"
                    className={`item-navegacao ${abaAtual === 'treino' ? 'ativo' : ''}`}
                    onClick={() => trocarAba('treino')}
                >
                    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" aria-hidden="true">
                        <path
                            d="M6.5 6.5h11M6.5 17.5h11M3 9v6M21 9v6M6.5 5v14M17.5 5v14"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        />
                    </svg>
                    <span>Treino</span>
                </button>

                {/* Loja */}
                <button
                    type="button"
                    className={`item-navegacao ${abaAtual === 'loja' ? 'ativo' : ''}`}
                    onClick={() => trocarAba('loja')}
                >
                    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" aria-hidden="true">
                        <path d="M5 8h14l1 12H4L5 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        <path d="M9 10V6a3 3 0 0 1 6 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>Loja</span>
                </button>

                {/* Conta */}
                <button
                    type="button"
                    className={`item-navegacao ${abaAtual === 'conta' ? 'ativo' : ''}`}
                    onClick={() => trocarAba('conta')}
                >
                    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" aria-hidden="true">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>Conta</span>
                </button>
            </div>
        </nav>
    )
}

export default BarraDeNavegacao