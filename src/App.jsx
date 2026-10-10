import { useEffect, useState } from 'react'
import AppAluno from './AppAluno.jsx'
import TelaEstado from './componentes/auth/TelaEstado.jsx'
import TelaLogin from './componentes/auth/TelaLogin.jsx'
import { supabase, supabaseConfigurado } from './dados/supabase.js'

// Decide o que mostrar: carregando, login, redefinição de senha ou o app do aluno.
function App() {
  const [sessao, setSessao] = useState(undefined)
  const [redefinindoSenha, setRedefinindoSenha] = useState(false)

  useEffect(() => {
    if (!supabaseConfigurado) return undefined

    supabase.auth.getSession().then(({ data }) => setSessao(data.session ?? null))
    // Não chamar o Supabase dentro deste callback: só atualizar o estado.
    const { data } = supabase.auth.onAuthStateChange((evento, novaSessao) => {
      setSessao(novaSessao ?? null)
      if (evento === 'PASSWORD_RECOVERY') setRedefinindoSenha(true)
      if (evento === 'SIGNED_OUT') setRedefinindoSenha(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (!supabaseConfigurado) {
    return (
      <TelaEstado
        titulo="Configuração pendente"
        texto="O app ainda não está conectado ao Supabase."
      >
        <p>
          Crie o arquivo <code>.env.local</code> com <code>VITE_SUPABASE_URL</code> e{' '}
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> e reinicie o servidor.
        </p>
      </TelaEstado>
    )
  }

  if (sessao === undefined) return <TelaEstado carregando />

  if (redefinindoSenha && sessao) {
    return <TelaLogin modoInicial="nova-senha" onSenhaRedefinida={() => setRedefinindoSenha(false)} />
  }

  if (!sessao) return <TelaLogin />

  return (
    <AppAluno
      key={sessao.user.id}
      usuario={sessao.user}
      onSair={() => {
        // A cópia offline sai junto; alterações ainda não enviadas ficam guardadas.
        try { window.localStorage.removeItem(`home-fit:cache:${sessao.user.id}`) } catch { /* sem acesso */ }
        supabase.auth.signOut({ scope: 'local' })
      }}
    />
  )
}

export default App
