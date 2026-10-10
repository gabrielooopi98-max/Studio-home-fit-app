// Valores ficam em centavos (inteiros) para não haver erro de arredondamento.
const formato = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatarPreco(centavos) {
  // Intl separa "R$" do valor com espaço especial (NBSP); troca por espaço comum.
  return formato.format((centavos ?? 0) / 100).replace(/\s/g, ' ')
}

// "89,90", "89.90", "R$ 1.299,90" ou "90" → centavos. Inválido → null.
export function paraCentavos(texto) {
  const limpo = String(texto ?? '').replace(/[^\d,.]/g, '')
  if (!limpo) return null
  const ultimaVirgula = limpo.lastIndexOf(',')
  const ultimoPonto = limpo.lastIndexOf('.')
  const separador = Math.max(ultimaVirgula, ultimoPonto)
  let inteiro = limpo
  let decimais = ''
  // Só é separador decimal se tiver 1 ou 2 dígitos depois dele.
  if (separador >= 0 && limpo.length - separador - 1 <= 2) {
    inteiro = limpo.slice(0, separador)
    decimais = limpo.slice(separador + 1)
  }
  inteiro = inteiro.replace(/[,.]/g, '')
  if (!/^\d*$/.test(inteiro) || !/^\d{0,2}$/.test(decimais) || (!inteiro && !decimais)) return null
  return Number(inteiro || 0) * 100 + Number(decimais.padEnd(2, '0'))
}

export function centavosParaTexto(centavos) {
  if (centavos === null || centavos === undefined) return ''
  return (centavos / 100).toFixed(2).replace('.', ',')
}
