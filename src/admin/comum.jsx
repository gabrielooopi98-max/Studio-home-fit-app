// Pequenas peças usadas em várias telas do painel.

export function Avatar({ nome, grande = false }) {
  const iniciais = (nome || '?').trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase()
  return <span className={`adm-avatar${grande ? ' adm-avatar--grande' : ''}`} aria-hidden="true">{iniciais}</span>
}

export function PresencaTexto({ aluno }) {
  if (aluno.diasSemVir === null) return 'Nunca fez check-in'
  if (aluno.diasSemVir === 0) return 'Treinou hoje'
  if (aluno.diasSemVir === 1) return 'Última presença ontem'
  return `Última presença há ${aluno.diasSemVir} dias`
}

export function SeloFicha({ situacao }) {
  return <span className={`adm-selo adm-selo--${situacao.estado}`}>{situacao.texto}</span>
}

export function IconeWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="adm-icone">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3z" />
    </svg>
  )
}
