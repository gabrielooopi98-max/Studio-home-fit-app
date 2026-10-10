export const CHAVE_PERFIL = 'home-fit:perfil:v1'

export const PERFIL_PADRAO = { versao: 1, nome: '', metaSemanal: 3, pesos: [] }

export function validarPerfil(perfil) {
  if (
    !perfil || typeof perfil !== 'object' || perfil.versao !== 1 ||
    typeof perfil.nome !== 'string' || perfil.nome.length > 40 ||
    !Number.isInteger(perfil.metaSemanal) || perfil.metaSemanal < 1 || perfil.metaSemanal > 7 ||
    !Array.isArray(perfil.pesos) ||
    perfil.pesos.some((registro) =>
      !/^\d{4}-\d{2}-\d{2}$/.test(registro?.dia) ||
      !Number.isFinite(registro.kg) || registro.kg <= 0 || registro.kg > 400)
  ) {
    throw new Error('Perfil salvo inválido.')
  }
  return perfil
}

export function carregarPerfil(armazenamento) {
  const salvo = armazenamento.getItem(CHAVE_PERFIL)
  if (!salvo) return { ...PERFIL_PADRAO, pesos: [] }
  const perfil = validarPerfil(JSON.parse(salvo))
  // A academia abre 5 dias por semana, então metas antigas acima disso viram 5x.
  return { ...perfil, metaSemanal: Math.min(perfil.metaSemanal, 5) }
}

export function salvarPerfil(armazenamento, perfil) {
  armazenamento.setItem(CHAVE_PERFIL, JSON.stringify(validarPerfil(perfil)))
}

// Um registro por dia: pesar de novo no mesmo dia substitui o valor.
export function registrarPeso(perfil, dia, kg) {
  if (!Number.isFinite(kg) || kg <= 0 || kg > 400) {
    throw new Error('Informe um peso entre 1 e 400 kg.')
  }
  const pesos = [...perfil.pesos.filter((registro) => registro.dia !== dia), { dia, kg }]
    .sort((a, b) => a.dia.localeCompare(b.dia))
  return { ...perfil, pesos }
}

export function removerPeso(perfil, dia) {
  return { ...perfil, pesos: perfil.pesos.filter((registro) => registro.dia !== dia) }
}

export function variacaoDePeso(pesos) {
  if (pesos.length < 2) return null
  const primeiro = pesos[0]
  const ultimo = pesos[pesos.length - 1]
  return { desde: primeiro.dia, diferenca: Math.round((ultimo.kg - primeiro.kg) * 10) / 10 }
}
