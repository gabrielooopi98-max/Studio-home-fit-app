import { PLANO_SEMANAL, proximoTreino, treinoDoDia } from './area-treinos/treinoLocal.js'
import './Header.css'

// Uma frase por dia útil (segunda = 0) e uma para o fim de semana.
const FRASES = [
    'Semana nova, carga nova. Começa forte.',
    'Constância vence motivação. Bora.',
    'Metade da semana. Não tira o pé agora.',
    'Foco no treino que o resultado vem.',
    'Fecha a semana com tudo.',
]
const FRASE_FIM_DE_SEMANA = 'Descanso também é treino. Segunda tem mais.'

const formatoData = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })

// Na tela inicial (com saudação) mostra data, frase do dia e selos; nas outras abas,
// só o rótulo da página, o título e a descrição.
function Header({ titulo, saudacao = 'Bom dia', contexto, descricao, fichas }) {
    const inicio = Boolean(saudacao)
    const hoje = new Date()
    const indiceDoDia = (hoje.getDay() + 6) % 7
    // A academia abre de segunda a sexta, independente de ter treino na ficha hoje.
    const aberta = indiceDoDia <= 4
    const treinoHoje = treinoDoDia(hoje, fichas)
    const seguinte = treinoHoje ? null : proximoTreino(hoje, fichas)
    const treino = treinoHoje ?? seguinte?.treino ?? PLANO_SEMANAL[0]
    const data = formatoData.format(hoje).replace('.', '').replace(',', ' ·')

    return (
        <header className="cabecalho">
            <div className="cabecalho__arte" aria-hidden="true">
                {inicio && <span className="cabecalho__letra">{treino.letra}</span>}
                <svg className="cabecalho__setas" viewBox="0 0 360 280">
                    <defs>
                        <linearGradient id="cabecalho-seta-frente" x1="1" x2="0" y1="0" y2="0">
                            <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
                            <stop offset="1" stopColor="#fff" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>
                    <polygon points="230,20 0,150 230,280" fill="#2450e8" fillOpacity="0.5" />
                    <polygon points="295,10 65,140 295,270" fill="#05070b" fillOpacity="0.85" />
                    <polygon points="360,0 130,130 360,260" fill="url(#cabecalho-seta-frente)" />
                </svg>
            </div>

            <div className="cabecalho__topo">
                <img
                    className="cabecalho__logo"
                    src="/logo-academia/logo-homefit-branca.svg"
                    alt="Home Fit"
                />
            </div>

            <div className="cabecalho__saudacao">
                <span className="cabecalho__data">{inicio ? data : contexto || 'Área de treino'}</span>
                {inicio && <p>{saudacao},</p>}
                <p className={`cabecalho__nome${inicio ? '' : ' cabecalho__nome--pagina'}`}>{titulo || 'Atleta'}</p>
                <p className="cabecalho__frase">
                    {inicio ? (aberta ? FRASES[indiceDoDia] : FRASE_FIM_DE_SEMANA) : descricao}
                </p>
            </div>

            {inicio && (
                <div className="cabecalho__rodape">
                    <div className="cabecalho__treino">
                        <b aria-hidden="true">{treino.letra}</b>
                        <span>
                            <small>{treinoHoje ? 'Treino de hoje' : `Próximo treino · ${seguinte?.nomeDoDia ?? 'segunda'}`}</small>
                            {treino.foco}
                        </span>
                    </div>
                    <span className={`cabecalho__status${aberta ? ' cabecalho__status--aberta' : ''}`}>
                        <i aria-hidden="true" />
                        {aberta ? 'Aberta hoje' : 'Fechada hoje'}
                    </span>
                </div>
            )}
        </header>
    )
}

export default Header
