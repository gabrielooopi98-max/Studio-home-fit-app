const MENSAGENS = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar. Procure a mensagem que enviamos para sua caixa de entrada.',
  user_already_exists: 'Já existe uma conta com este e-mail. Tente entrar.',
  email_exists: 'Já existe uma conta com este e-mail. Tente entrar.',
  weak_password: 'Senha fraca. Use pelo menos 6 caracteres, misturando letras e números.',
  same_password: 'A nova senha precisa ser diferente da atual.',
  over_email_send_rate_limit: 'Muitos e-mails enviados. Aguarde alguns minutos e tente de novo.',
  over_request_rate_limit: 'Muitas tentativas seguidas. Aguarde um pouco e tente de novo.',
  email_address_invalid: 'Este e-mail não é válido.',
  signup_disabled: 'O cadastro de novas contas está desativado. Fale com a recepção.',
  session_not_found: 'Sua sessão expirou. Entre novamente.',
  user_not_found: 'Não encontramos uma conta com este e-mail.',
}

export function mensagemDeErroAuth(erro) {
  if (!erro) return ''
  if (MENSAGENS[erro.code]) return MENSAGENS[erro.code]
  if (erro.name === 'AuthRetryableFetchError' || erro.status === 0 || /fetch|network/i.test(erro.message)) {
    return 'Sem conexão com a internet. Verifique e tente de novo.'
  }
  return 'Algo deu errado. Tente novamente em instantes.'
}
