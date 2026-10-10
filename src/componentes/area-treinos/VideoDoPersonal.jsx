import Gaveta from '../Gaveta.jsx'
import { comoMostrarVideo } from '../../utils/midia.js'

// Vídeo que o personal anexou ao exercício: YouTube e arquivos tocam aqui mesmo; outros links abrem fora.
function VideoDoPersonal({ exercicio, onFechar }) {
  const video = exercicio ? comoMostrarVideo(exercicio.video) : null
  return (
    <Gaveta aberta={Boolean(exercicio)} titulo={exercicio ? `Vídeo · ${exercicio.nome}` : 'Vídeo'} onFechar={onFechar}>
      {video?.tipo === 'youtube' && (
        <div className="video-personal__quadro">
          <iframe src={video.url} title={`Vídeo de ${exercicio.nome}`} loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin" />
        </div>
      )}
      {video?.tipo === 'arquivo' && (
        <video className="video-personal__arquivo" src={video.url} controls autoPlay playsInline preload="metadata" />
      )}
      {video?.tipo === 'link' && (
        <div className="video-personal__link">
          <p>Seu personal mandou um vídeo em outro site.</p>
          <a className="treino-hoje__botao" href={video.url} target="_blank" rel="noopener noreferrer">Abrir vídeo</a>
        </div>
      )}
      {exercicio?.observacao && <p className="video-personal__recado">💬 {exercicio.observacao}</p>}
    </Gaveta>
  )
}

export default VideoDoPersonal
