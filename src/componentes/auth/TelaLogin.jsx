import { useState } from 'react'
import { mensagemDeErroAuth } from '../../dados/errosAuth.js'
import { supabase } from '../../dados/supabase.js'
import { formatarTelefone, somenteDigitos, telefoneValido } from '../../utils/telefone.js'
import './TelaLogin.css'

const TITULOS = {
  entrar: { titulo: 'Bem-vindo de volta', texto: 'Entre para continuar seus treinos.' },
  cadastro: { titulo: 'Crie sua conta', texto: 'Seus treinos, cargas e check-ins salvos em qualquer aparelho.' },
  recuperar: { titulo: 'Recuperar senha', texto: 'Informe seu e-mail e enviaremos um link para criar uma nova senha.' },
  'nova-senha': { titulo: 'Nova senha', texto: 'Escolha uma nova senha para sua conta.' },
}

function CampoSenha({ id, rotulo, valor, aoMudar, autoComplete }) {
  const [visivel, setVisivel] = useState(false)
  return (
    <label className="login-campo" htmlFor={id}>
      <span>{rotulo}</span>
      <span className="login-campo__senha">
        <input
          id={id}
          type={visivel ? 'text' : 'password'}
          autoComplete={autoComplete}
          minLength={6}
          required
          value={valor}
          onChange={(event) => aoMudar(event.target.value)}
        />
        <button
          type="button"
          aria-label={visivel ? 'Esconder senha' : 'Mostrar senha'}
          aria-pressed={visivel}
          onClick={() => setVisivel(!visivel)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            {visivel && <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
          </svg>
        </button>
      </span>
    </label>
  )
}

function TelaLogin({ modoInicial = 'entrar', onSenhaRedefinida }) {
  const [modo, setModo] = useState(modoInicial)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  function trocarModo(novo) {
    setModo(novo)
    setErro('')
    setSucesso('')
    setSenha('')
  }

  async function enviar(event) {
    event.preventDefault()
    if (enviando) return
    setEnviando(true)
    setErro('')
    setSucesso('')
    const emailLimpo = email.trim().toLowerCase()

    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email: emailLimpo, password: senha })
        if (error) throw error
      } else if (modo === 'cadastro') {
        if (!telefoneValido(telefone)) {
          setErro('Informe um WhatsApp válido com DDD, por exemplo (64) 99999-9999.')
          return
        }
        const { data, error } = await supabase.auth.signUp({
          email: emailLimpo,
          password: senha,
          options: {
            data: { nome: nome.trim(), telefone: somenteDigitos(telefone) },
            emailRedirectTo: window.location.origin,
          },
        })
        if (error) throw error
        // Com confirmação de e-mail ligada, um e-mail já cadastrado volta sem identidades.
        if (data.user && data.user.identities?.length === 0) throw Object.assign(new Error('E-mail já cadastrado'), { code: 'user_already_exists' })
        if (!data.session) {
          setSucesso(`Enviamos um link de confirmação para ${emailLimpo}. Abra o e-mail para ativar sua conta.`)
          setSenha('')
        }
      } else if (modo === 'recuperar') {
        const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, { redirectTo: window.location.origin })
        if (error) throw error
        setSucesso(`Se existir uma conta com ${emailLimpo}, você vai receber um link para criar uma nova senha.`)
      } else {
        const { error } = await supabase.auth.updateUser({ password: senha })
        if (error) throw error
        onSenhaRedefinida?.()
      }
    } catch (falha) {
      setErro(mensagemDeErroAuth(falha))
    } finally {
      setEnviando(false)
    }
  }

  const { titulo, texto } = TITULOS[modo]
  const textoBotao = {
    entrar: 'Entrar',
    cadastro: 'Criar conta',
    recuperar: 'Enviar link',
    'nova-senha': 'Salvar nova senha',
  }[modo]

  return (
    <main className="login">
      <div className="login__marca">
        <img src="/logo-academia/logo-homefit-branca.svg" alt="Home Fit" />
      </div>

      <section className="login__cartao" aria-labelledby="login-titulo">
        {(modo === 'entrar' || modo === 'cadastro') && (
          <div className="login__abas" role="tablist" aria-label="Acesso">
            <button type="button" role="tab" aria-selected={modo === 'entrar'} onClick={() => trocarModo('entrar')}>
              Entrar
            </button>
            <button type="button" role="tab" aria-selected={modo === 'cadastro'} onClick={() => trocarModo('cadastro')}>
              Criar conta
            </button>
            <i className={`login__abas-indicador${modo === 'cadastro' ? ' direita' : ''}`} aria-hidden="true" />
          </div>
        )}

        <h1 id="login-titulo">{titulo}</h1>
        <p className="login__texto">{texto}</p>

        <form className="login__form" onSubmit={enviar}>
          {modo === 'cadastro' && (
            <label className="login-campo" htmlFor="login-nome">
              <span>Como quer ser chamado?</span>
              <input
                id="login-nome"
                type="text"
                autoComplete="given-name"
                maxLength={40}
                required
                value={nome}
                onChange={(event) => setNome(event.target.value)}
              />
            </label>
          )}

          {modo === 'cadastro' && (
            <label className="login-campo" htmlFor="login-telefone">
              <span>WhatsApp</span>
              <input
                id="login-telefone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="(00) 00000-0000"
                required
                aria-describedby="login-telefone-dica"
                value={telefone}
                onChange={(event) => setTelefone(formatarTelefone(event.target.value))}
              />
              <small id="login-telefone-dica" className="login-campo__dica">
                Com DDD. A academia usa para avisos e contato.
              </small>
            </label>
          )}

          {modo !== 'nova-senha' && (
            <label className="login-campo" htmlFor="login-email">
              <span>E-mail</span>
              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          )}

          {modo !== 'recuperar' && (
            <CampoSenha
              id="login-senha"
              rotulo={modo === 'nova-senha' ? 'Nova senha' : 'Senha'}
              valor={senha}
              aoMudar={setSenha}
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
            />
          )}

          {modo === 'entrar' && (
            <button type="button" className="login__link login__link--direita" onClick={() => trocarModo('recuperar')}>
              Esqueci minha senha
            </button>
          )}

          {erro && <p className="login__mensagem login__mensagem--erro" role="alert">{erro}</p>}
          {sucesso && <p className="login__mensagem login__mensagem--sucesso" role="status">{sucesso}</p>}

          <button className="login__botao" type="submit" disabled={enviando}>
            {enviando ? <span className="login__spinner" aria-label="Enviando" /> : textoBotao}
          </button>
        </form>

        {modo === 'recuperar' && (
          <button type="button" className="login__link" onClick={() => trocarModo('entrar')}>
            ← Voltar para o login
          </button>
        )}
      </section>

      <p className="login__rodape">Studio Home Fit</p>
    </main>
  )
}

export default TelaLogin
