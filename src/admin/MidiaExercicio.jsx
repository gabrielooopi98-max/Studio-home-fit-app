import { useId, useState } from 'react'
import { supabase } from '../dados/supabase.js'
import { TIPOS_IMAGEM, TIPOS_VIDEO, comoMostrarVideo, linkValido } from '../utils/midia.js'
import { enviarMidiaTreino } from './dadosAdmin.js'

const ACEITA_IMAGEM = Object.keys(TIPOS_IMAGEM).join(',')
const ACEITA_VIDEO = Object.keys(TIPOS_VIDEO).join(',')

function textoDoLink(url) {
  const { tipo } = comoMostrarVideo(url) ?? {}
  if (tipo === 'youtube') return 'Vídeo do YouTube'
  if (tipo === 'arquivo') return 'Vídeo enviado'
  try {
    return `Link: ${new URL(url).hostname.replace(/^www\./, '')}`
  } catch {
    return 'Link do vídeo'
  }
}

// Foto e vídeo de um exercício: o personal envia do celular/computador ou cola um link.
function MidiaExercicio({ item, onMudar }) {
  const id = useId()
  const [enviando, setEnviando] = useState(null)
  const [erro, setErro] = useState('')
  const [link, setLink] = useState('')

  async function enviar(evento, tipo) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!arquivo) return
    setErro('')
    setEnviando(tipo)
    try {
      const url = await enviarMidiaTreino(supabase, arquivo, tipo)
      onMudar(tipo === 'video' ? { video: url } : { imagem: url })
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setEnviando(null)
    }
  }

  function usarLink() {
    if (!linkValido(link)) return setErro('Cole o link completo do vídeo, começando com https://')
    setErro('')
    onMudar({ video: link.trim() })
    setLink('')
  }

  const video = item.video ? comoMostrarVideo(item.video) : null

  return (
    <div className="adm-midia" role="group" aria-label={`Foto e vídeo de ${item.nome}`}>
      <div className="adm-midia__bloco">
        <span className="adm-midia__titulo">Foto</span>
        {item.imagem ? (
          <div className="adm-midia__previa">
            <img src={item.imagem} alt={`Foto de ${item.nome}`} loading="lazy" />
            <span className="adm-midia__acoes">
              <label className="adm-link">
                Trocar
                <input type="file" accept={ACEITA_IMAGEM} className="visualmente-oculto" onChange={(evento) => enviar(evento, 'imagem')} />
              </label>
              <button type="button" className="adm-link adm-link--perigo" onClick={() => onMudar({ imagem: '' })}>Remover</button>
            </span>
          </div>
        ) : (
          <label className={`adm-midia__enviar${enviando === 'imagem' ? ' enviando' : ''}`}>
            <span aria-hidden="true">📷</span>
            {enviando === 'imagem' ? 'Enviando foto…' : 'Adicionar foto'}
            <input type="file" accept={ACEITA_IMAGEM} className="visualmente-oculto" disabled={Boolean(enviando)}
              onChange={(evento) => enviar(evento, 'imagem')} />
          </label>
        )}
      </div>

      <div className="adm-midia__bloco">
        <span className="adm-midia__titulo">Vídeo</span>
        {item.video ? (
          <div className="adm-midia__previa adm-midia__previa--video">
            {video?.tipo === 'arquivo'
              ? <video src={item.video} controls preload="metadata" playsInline />
              : <a href={item.video} target="_blank" rel="noopener noreferrer" className="adm-midia__link">▶ {textoDoLink(item.video)}</a>}
            <span className="adm-midia__acoes">
              <button type="button" className="adm-link adm-link--perigo" onClick={() => onMudar({ video: '' })}>Remover</button>
            </span>
          </div>
        ) : (
          <>
            <label className={`adm-midia__enviar${enviando === 'video' ? ' enviando' : ''}`}>
              <span aria-hidden="true">🎬</span>
              {enviando === 'video' ? 'Enviando vídeo… pode levar um pouco' : 'Enviar vídeo (até 50 MB)'}
              <input type="file" accept={ACEITA_VIDEO} className="visualmente-oculto" disabled={Boolean(enviando)}
                onChange={(evento) => enviar(evento, 'video')} />
            </label>
            <div className="adm-midia__colar">
              <label htmlFor={`${id}-link`} className="visualmente-oculto">Ou cole o link do vídeo</label>
              <input id={`${id}-link`} type="url" inputMode="url" placeholder="ou cole um link (YouTube, Instagram…)"
                value={link} onChange={(evento) => setLink(evento.target.value)}
                onKeyDown={(evento) => { if (evento.key === 'Enter') { evento.preventDefault(); usarLink() } }} />
              <button type="button" className="adm-botao adm-botao--pequeno adm-botao--secundario" disabled={!link.trim()} onClick={usarLink}>
                Usar
              </button>
            </div>
          </>
        )}
      </div>

      {erro && <p className="adm-midia__erro" role="alert">{erro}</p>}
    </div>
  )
}

export default MidiaExercicio
