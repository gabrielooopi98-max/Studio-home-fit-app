import { Component } from 'react'
import TelaEstado from './auth/TelaEstado.jsx'

const CHAVE_RECARGA = 'home-fit:recarregou-apos-atualizacao'

// Depois de uma atualização do site, quem estava com o app aberto pode pedir um pedaço
// de código que já não existe. Nesse caso basta recarregar a página (uma vez só).
function ehVersaoAntiga(erro) {
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported/i
    .test(String(erro?.message ?? ''))
}

// Se algo quebrar na tela, mostra uma mensagem amigável em vez de uma página em branco.
class ErroInesperado extends Component {
  constructor(props) {
    super(props)
    this.state = { erro: null }
  }

  static getDerivedStateFromError(erro) {
    return { erro }
  }

  componentDidCatch(erro) {
    if (ehVersaoAntiga(erro)) {
      try {
        if (!window.sessionStorage.getItem(CHAVE_RECARGA)) {
          window.sessionStorage.setItem(CHAVE_RECARGA, '1')
          window.location.reload()
          return
        }
      } catch { /* sem acesso ao armazenamento: mostra a tela de erro */ }
    }
    console.error(erro)
  }

  render() {
    if (!this.state.erro) return this.props.children
    const antiga = ehVersaoAntiga(this.state.erro)
    return (
      <TelaEstado
        titulo={antiga ? 'App atualizado' : 'Algo deu errado'}
        texto={antiga
          ? 'Saiu uma versão nova do app. Recarregue para continuar.'
          : 'Não se preocupe: seus treinos e check-ins estão salvos. Recarregue a página para continuar.'}
        acao="Recarregar"
        onAcao={() => {
          try { window.sessionStorage.removeItem(CHAVE_RECARGA) } catch { /* ignora */ }
          window.location.reload()
        }}
      />
    )
  }
}

export default ErroInesperado
