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

const ICONES = {
    treino: (
        <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
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
    ),
    loja: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 8h14l1 12H4L5 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    pedidos: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    ),
    whatsapp: (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3z" />
        </svg>
    ),
}

// Conteúdo comum: seta do hover, ícone, marca d'água (o ícone grande e apagado) e textos.
function ConteudoAtalho({ icone, titulo, subtitulo }) {
    return (
        <>
            {seta}
            <span className="marca-atalho" aria-hidden="true">{ICONES[icone]}</span>
            <span className="icone-atalho">{ICONES[icone]}</span>
            <span className="texto-atalho">
                <strong>{titulo}</strong>
                <small>{subtitulo}</small>
            </span>
        </>
    )
}

// Cada card tem a sua cor: treino azul, loja violeta, pedidos dourado e WhatsApp verde.
function AcessosRapidos({ onAbrirTreino, onAbrirLoja, onAbrirPedidos }) {
    return (
        <section className="acessos-rapidos">
            <h2>Acessos Rápidos</h2>

            <div className="cards-atalhos-rapidos" onPointerMove={moverLuz}>
                <button className="card-atalho card-meu-treino" type="button" onClick={onAbrirTreino}>
                    <ConteudoAtalho icone="treino" titulo="Meu treino" subtitulo="Abrir ficha" />
                </button>

                <button className="card-atalho card-loja" type="button" onClick={onAbrirLoja}>
                    <ConteudoAtalho icone="loja" titulo="Loja" subtitulo="Suplementos" />
                </button>

                <button className="card-atalho card-pedidos" type="button" onClick={onAbrirPedidos}>
                    <ConteudoAtalho icone="pedidos" titulo="Meus pedidos" subtitulo="Reservas para retirar" />
                </button>

                {/* WhatsApp é link porque abre outro site */}
                <a className="card-atalho card-whatsapp" href="https://wa.me/5564999250218" target="_blank" rel="noopener noreferrer">
                    <ConteudoAtalho icone="whatsapp" titulo="WhatsApp" subtitulo="Fale com a recepção" />
                </a>
            </div>
        </section>
    )
}

export default AcessosRapidos
