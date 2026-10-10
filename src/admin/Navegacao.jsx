import { useEffect, useState } from 'react'
import { Avatar } from './comum.jsx'

const ICONES = {
  visao: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  alunos: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 19v-1a4 4 0 0 0-3-3.9M15.5 3.1a3.5 3.5 0 0 1 0 6.8',
  treinos: 'M6.5 6.5h11M6.5 17.5h11M3 9v6M21 9v6M6.5 5v14M17.5 5v14',
  loja: 'M5 8h14l1 12H4zM9 10V6a3 3 0 0 1 6 0v4',
  equipe: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4',
  aluno: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  sair: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11',
  menu: 'M4 6h16M4 12h16M4 18h16',
}

export function Icone({ nome, className = 'adm-icone' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d={ICONES[nome]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const PAPEIS = { dono: 'Dono', personal: 'Personal' }

// Menu lateral fixo no computador; no celular vira uma barra no topo com menu que abre por cima.
function Navegacao({ itens, atual, perfil, email, onIr, onModoAluno, onSair }) {
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    if (!aberto) return undefined
    const fechar = (event) => { if (event.key === 'Escape') setAberto(false) }
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [aberto])

  function ir(item) {
    setAberto(false)
    onIr(item)
  }

  return (
    <>
      <header className="adm-barra-movel">
        <button type="button" className="adm-barra-movel__menu" aria-label="Abrir menu" aria-expanded={aberto} onClick={() => setAberto(true)}>
          <Icone nome="menu" />
        </button>
        <img src="/logo-academia/logo-homefit-branca.svg" alt="Home Fit" />
        <span className="adm-barra-movel__pagina">{itens.find(({ id }) => id === atual)?.nome}</span>
      </header>

      {aberto && <button type="button" className="adm-menu-fundo" aria-label="Fechar menu" onClick={() => setAberto(false)} />}

      <nav className={`adm-menu${aberto ? ' aberto' : ''}`} aria-label="Menu do painel">
        <div className="adm-menu__marca">
          <img src="/logo-academia/logo-homefit-branca.svg" alt="Home Fit" />
          <span>Gestão</span>
        </div>

        <ul className="adm-menu__itens">
          {itens.map((item) => (
            <li key={item.id}>
              <a href={item.link} aria-current={atual === item.id ? 'page' : undefined}
                onClick={(event) => { event.preventDefault(); ir(item) }}>
                <Icone nome={item.icone} />
                <span>{item.nome}</span>
                {item.contador > 0 && <b aria-label={`${item.contador} pendentes`}>{item.contador}</b>}
              </a>
            </li>
          ))}
        </ul>

        <div className="adm-menu__rodape">
          <div className="adm-menu__usuario">
            <Avatar nome={perfil.nome || email} />
            <span>
              <b>{perfil.nome || email}</b>
              <small>{PAPEIS[perfil.papel]}</small>
            </span>
          </div>
          <button type="button" onClick={() => { setAberto(false); onModoAluno() }}>
            <Icone nome="aluno" /> Ver como aluno
          </button>
          <button type="button" onClick={onSair}>
            <Icone nome="sair" /> Sair
          </button>
        </div>
      </nav>
    </>
  )
}

export default Navegacao
