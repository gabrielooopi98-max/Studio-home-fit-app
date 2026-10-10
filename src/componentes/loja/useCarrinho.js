import { useEffect, useState } from 'react'
import { validarCarrinhoSalvo } from '../../utils/carrinho.js'

// Carrinho de cada aluno guardado no aparelho, para não sumir ao fechar o app.
export function useCarrinho(usuarioId) {
  const chave = `home-fit:carrinho:${usuarioId}`
  const [itens, setItens] = useState(() => {
    try {
      return validarCarrinhoSalvo(JSON.parse(window.localStorage.getItem(chave) ?? '[]'))
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      if (itens.length) window.localStorage.setItem(chave, JSON.stringify(itens))
      else window.localStorage.removeItem(chave)
    } catch {
      // sem armazenamento: o carrinho vale só nesta sessão
    }
  }, [itens, chave])

  return [itens, setItens]
}
