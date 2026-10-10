// Fotos e vídeos que o personal anexa aos exercícios.

export const TIPOS_IMAGEM = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
export const TIPOS_VIDEO = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' }
export const LIMITE_IMAGEM = 5 * 1024 * 1024
export const LIMITE_VIDEO = 50 * 1024 * 1024

// Confere o arquivo antes de enviar. Devolve a extensão ou lança um erro com texto para o personal.
export function conferirArquivo(arquivo, tipo) {
  const tipos = tipo === 'video' ? TIPOS_VIDEO : TIPOS_IMAGEM
  const extensao = tipos[arquivo?.type]
  if (!extensao) {
    throw new Error(tipo === 'video' ? 'Use um vídeo MP4, MOV ou WEBM.' : 'Use uma foto JPG, PNG ou WEBP.')
  }
  const limite = tipo === 'video' ? LIMITE_VIDEO : LIMITE_IMAGEM
  if (arquivo.size > limite) {
    throw new Error(tipo === 'video'
      ? 'O vídeo precisa ter até 50 MB. Grave um trecho mais curto ou cole um link do YouTube.'
      : 'A foto precisa ter até 5 MB.')
  }
  return extensao
}

export function linkValido(texto) {
  try {
    const url = new URL(String(texto ?? '').trim())
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function idDoYoutube(url) {
  const host = url.hostname.replace(/^www\.|^m\./, '')
  if (host === 'youtu.be') return url.pathname.slice(1).split('/')[0]
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.searchParams.get('v')) return url.searchParams.get('v')
    const [, tipo, id] = url.pathname.split('/')
    if (['shorts', 'embed', 'live'].includes(tipo)) return id
  }
  return null
}

// Como mostrar o vídeo: player do YouTube, player do próprio navegador ou só um link para abrir.
export function comoMostrarVideo(texto) {
  if (!linkValido(texto)) return null
  const url = new URL(texto.trim())
  const youtube = idDoYoutube(url)
  if (youtube && /^[\w-]{6,20}$/.test(youtube)) {
    return { tipo: 'youtube', url: `https://www.youtube-nocookie.com/embed/${youtube}` }
  }
  if (/\.(mp4|mov|webm)$/i.test(url.pathname)) return { tipo: 'arquivo', url: url.href }
  return { tipo: 'link', url: url.href }
}
