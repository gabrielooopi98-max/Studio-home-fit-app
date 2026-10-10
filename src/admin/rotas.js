// Endereços do painel no próprio link (#/alunos/123/treino): o "voltar" do navegador
// funciona e o F5 mantém a pessoa na mesma tela.
import { useEffect, useState } from 'react'

export const ABAS_ALUNO = ['geral', 'treino', 'evolucao', 'pedidos']

export function lerRota(hash) {
  const partes = String(hash ?? '').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
  const [pagina, id, aba] = partes
  if (pagina === 'alunos' && id) {
    return { pagina: 'aluno', id, aba: ABAS_ALUNO.includes(aba) ? aba : 'geral' }
  }
  if (pagina === 'alunos') return { pagina: 'alunos' }
  if (pagina === 'treinos' && id === 'enviar') return { pagina: 'enviar' }
  if (pagina === 'treinos' && id === 'modelos' && aba) return { pagina: 'editor-modelo', id: aba }
  if (pagina === 'treinos') return { pagina: 'treinos', aba: id === 'modelos' ? 'modelos' : 'fichas' }
  if (pagina === 'loja') return { pagina: 'loja' }
  if (pagina === 'equipe') return { pagina: 'equipe' }
  return { pagina: 'visao' }
}

export function linkDaRota(rota) {
  const cod = encodeURIComponent
  switch (rota.pagina) {
    case 'alunos': return '#/alunos'
    case 'aluno': return `#/alunos/${cod(rota.id)}${rota.aba && rota.aba !== 'geral' ? `/${rota.aba}` : ''}`
    case 'enviar': return '#/treinos/enviar'
    case 'treinos': return rota.aba === 'modelos' ? '#/treinos/modelos' : '#/treinos'
    case 'editor-modelo': return `#/treinos/modelos/${cod(rota.id)}`
    case 'loja': return '#/loja'
    case 'equipe': return '#/equipe'
    default: return '#/'
  }
}

export function useRota() {
  const [rota, setRota] = useState(() => lerRota(window.location.hash))
  useEffect(() => {
    const aoMudar = () => {
      setRota(lerRota(window.location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', aoMudar)
    return () => window.removeEventListener('hashchange', aoMudar)
  }, [])
  const ir = (destino) => {
    const link = linkDaRota(destino)
    if (window.location.hash === link) setRota(lerRota(link))
    else window.location.hash = link
  }
  return [rota, ir]
}
