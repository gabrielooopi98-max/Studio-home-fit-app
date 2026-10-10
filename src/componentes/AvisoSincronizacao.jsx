import './AvisoSincronizacao.css'

// Só aparece quando há algo a dizer: sem internet com alterações guardadas, ou um aviso.
function AvisoSincronizacao({ sincronizacao, aviso, onFecharAviso }) {
  const offline = sincronizacao.estado === 'offline' && sincronizacao.pendentes > 0

  if (!offline && !aviso) return null

  return (
    <div className="aviso-sync" role="status">
      {offline ? (
        <>
          <i className="aviso-sync__ponto" aria-hidden="true" />
          <span>
            Sem conexão · {sincronizacao.pendentes} {sincronizacao.pendentes === 1 ? 'alteração guardada' : 'alterações guardadas'}.
            Enviaremos assim que a internet voltar.
          </span>
        </>
      ) : (
        <>
          <span>{aviso}</span>
          <button type="button" aria-label="Fechar aviso" onClick={onFecharAviso}>✕</button>
        </>
      )}
    </div>
  )
}

export default AvisoSincronizacao
