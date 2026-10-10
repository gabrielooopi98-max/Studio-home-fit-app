// Fila de sincronização: a tela muda na hora e as gravações vão para o Supabase em
// segundo plano. Se a internet cair, as alterações ficam guardadas no aparelho e são
// reenviadas sozinhas quando a conexão volta. Alterações seguidas na mesma coisa
// (ex.: várias séries do mesmo treino) viram uma única gravação com o estado mais novo.

export function chaveDaOperacao(operacao) {
  return operacao.tipo === 'perfil' ? 'perfil' : `${operacao.tipo}:${operacao.dia}`
}

// Aplica alterações ainda não enviadas sobre os dados vindos do servidor.
export function aplicarOperacoes(dados, operacoes) {
  let { perfil, checkins, treinos } = dados
  for (const operacao of operacoes) {
    if (operacao.tipo === 'perfil') {
      perfil = { ...perfil, nome: operacao.nome, metaSemanal: operacao.metaSemanal }
      if (operacao.telefone !== undefined) perfil.telefone = operacao.telefone
    } else if (operacao.tipo === 'checkin') {
      if (!checkins.includes(operacao.dia)) checkins = [...checkins, operacao.dia].sort()
    } else if (operacao.tipo === 'peso') {
      const outros = perfil.pesos.filter(({ dia }) => dia !== operacao.dia)
      const pesos = operacao.kg === null ? outros : [...outros, { dia: operacao.dia, kg: operacao.kg }]
      perfil = { ...perfil, pesos: pesos.sort((a, b) => a.dia.localeCompare(b.dia)) }
    } else if (operacao.tipo === 'sessao') {
      // Um treino já finalizado no servidor vale mais que uma alteração antiga do aparelho.
      if (!treinos.sessoes[operacao.dia]?.fim) {
        treinos = { ...treinos, sessoes: { ...treinos.sessoes, [operacao.dia]: operacao.sessao } }
      }
    }
  }
  return { ...dados, perfil, checkins, treinos, fichas: dados.fichas ?? [] }
}

// Com pausada: true a fila guarda tudo mas só começa a enviar depois de retomar().
export function criarFila({
  armazenamento, chave, executar, aoMudar = () => {}, aoErro = () => {}, atraso = 400, pausada = false,
}) {
  const pendentes = new Map()
  let temporizador = null
  let processando = false
  let repetir = false
  let falhasSeguidas = 0
  let estado = 'ocioso'
  let emPausa = pausada

  try {
    const salvas = JSON.parse(armazenamento.getItem(chave) ?? '[]')
    if (Array.isArray(salvas)) {
      for (const operacao of salvas) pendentes.set(chaveDaOperacao(operacao), operacao)
    }
  } catch {
    // fila corrompida: começa vazia
  }

  function persistir() {
    try {
      if (pendentes.size) armazenamento.setItem(chave, JSON.stringify([...pendentes.values()]))
      else armazenamento.removeItem(chave)
    } catch {
      // sem espaço ou sem acesso ao armazenamento: segue só em memória
    }
  }

  function avisar(novoEstado) {
    estado = novoEstado
    aoMudar({ estado, pendentes: pendentes.size })
  }

  function agendar(ms) {
    clearTimeout(temporizador)
    temporizador = setTimeout(processar, ms)
  }

  async function processar() {
    if (emPausa) return
    if (processando) {
      repetir = true
      return
    }
    if (!pendentes.size) return avisar('ocioso')
    processando = true
    avisar(estado === 'offline' ? 'offline' : 'salvando')

    for (const [chaveOperacao, operacao] of [...pendentes]) {
      try {
        await executar(operacao)
        if (pendentes.get(chaveOperacao) === operacao) pendentes.delete(chaveOperacao)
        persistir()
      } catch (erro) {
        if (erro?.retentavel) {
          falhasSeguidas++
          processando = false
          repetir = false
          avisar('offline')
          agendar(Math.min(30000, 1000 * 2 ** falhasSeguidas))
          return
        }
        // Erro definitivo (dado recusado pelo servidor): descarta para não travar a fila.
        if (pendentes.get(chaveOperacao) === operacao) pendentes.delete(chaveOperacao)
        persistir()
        aoErro(erro, operacao)
      }
    }

    falhasSeguidas = 0
    processando = false
    if (repetir || pendentes.size) {
      repetir = false
      if (pendentes.size) return agendar(0)
    }
    avisar('ocioso')
  }

  return {
    enfileirar(operacao) {
      pendentes.set(chaveDaOperacao(operacao), operacao)
      persistir()
      if (estado !== 'offline') avisar('salvando')
      agendar(atraso)
    },
    pendentes: () => [...pendentes.values()],
    tentarAgora: () => agendar(0),
    retomar() {
      emPausa = false
      agendar(0)
    },
    destruir: () => clearTimeout(temporizador),
  }
}
