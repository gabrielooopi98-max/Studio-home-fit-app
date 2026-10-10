// Telefone brasileiro com DDD, guardado só com números: 10 dígitos (fixo) ou 11 (celular).

export function somenteDigitos(texto) {
  return String(texto ?? '').replace(/\D/g, '').slice(0, 11)
}

// Máscara enquanto digita: (64) 99925-0218 ou (64) 3333-4444.
export function formatarTelefone(texto) {
  const digitos = somenteDigitos(texto)
  if (digitos.length <= 2) return digitos.length ? `(${digitos}` : ''
  const ddd = digitos.slice(0, 2)
  const resto = digitos.slice(2)
  if (resto.length <= 4) return `(${ddd}) ${resto}`
  const meio = digitos.length === 11 ? resto.slice(0, 5) : resto.slice(0, 4)
  return `(${ddd}) ${meio}-${resto.slice(meio.length)}`
}

export function telefoneValido(texto) {
  const digitos = somenteDigitos(texto)
  if (!/^[1-9][0-9]/.test(digitos)) return false
  if (digitos.length === 11) return digitos[2] === '9'
  return digitos.length === 10
}
