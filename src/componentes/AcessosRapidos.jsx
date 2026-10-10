import './AcessosRapidos.css'

// Passa a posição do mouse para o CSS desenhar a luz que segue o cursor.
function moverLuz(event) {
    const card = event.target.closest('.card-atalho')
    if (!card) return
    const { left, top } = card.getBoundingClientRect()
    card.style.setProperty('--mx', `${event.clientX - left}px`)
    card.style.setProperty('--my', `${event.clientY - top}px`)
}

const seta = (
    <svg className="seta-atalho" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

function AcessosRapidos({ onAbrirTreino, onAbrirLoja }) {
    return (
        <section className="acessos-rapidos">
            <h2>Acessos Rápidos</h2>

            <div className="cards-atalhos-rapidos" onPointerMove={moverLuz}>

                {/* Meu treino */}
                <button className="card-atalho card-meu-treino" type="button" onClick={onAbrirTreino}>
                    {seta}
                    <span className="icone-atalho">

                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#FFFFFF">
                            <path d="M156 235H356V277H156Z" />

                            <path d="M126 172H155V340H126C104 340 88 324 88 302V210C88 188 104 172 126 172Z" />
                            <path d="M356 172H386C408 172 424 188 424 210V302C424 324 408 340 386 340H356Z" />

                            <rect x="55" y="205" width="36" height="102" rx="18" />
                            <rect x="421" y="205" width="36" height="102" rx="18" />

                            <rect x="88" y="138" width="72" height="236" rx="27" />
                            <rect x="352" y="138" width="72" height="236" rx="27" />

                            <path d="M43 218H55V294H43C31 294 24 285 24 273V239C24 227 31 218 43 218Z" />
                            <path d="M457 218H469C481 218 488 227 488 239V273C488 285 481 294 469 294H457Z" />
                        </svg>

                    </span>
                    <span className="texto-atalho">
                        <strong>Meu Treino</strong>
                        <small>Abrir ficha</small>
                    </span>
                </button>

                {/* Loja */}
                <button className="card-atalho card-loja" type="button" onClick={onAbrirLoja}>
                    {seta}
                    <span className="icone-atalho">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
                            <path
                                d="M5 8h14l1 12H4L5 8Z"
                                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                            />
                            <path
                                d="M9 9V6a3 3 0 0 1 6 0v3"
                                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                    <span className="texto-atalho">
                        <strong>Loja</strong>
                        <small>Suplementos</small>
                    </span>
                </button>

                {/* Pagamentos */}
                <button className="card-atalho card-pagamentos" type="button" disabled>
                    <span className="icone-atalho">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
                            <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
                            <path d="M2 10h20M6 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </span>
                    <span className="texto-atalho">
                        <strong>Pagamentos</strong>
                        <small className="selo-em-breve">Em breve</small>
                    </span>
                </button>

                {/* WhatsApp: é link porque abre outro site */}
                <a
                    className="card-atalho card-whatsapp"
                    href="https://wa.me/5564999250218"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {seta}
                    <span className="icone-atalho">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
                            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3z" />
                        </svg>
                    </span>
                    <span className="texto-atalho">
                        <strong>WhatsApp</strong>
                        <small>Fale com a recepção</small>
                    </span>
                </a>
            </div>
        </section>
    )
}

export default AcessosRapidos;
