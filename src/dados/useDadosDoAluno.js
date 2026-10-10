import { useEffect, useRef, useState } from 'react'
import { CHAVE_MIGRACAO, lerDadosLocais, operacoesDeMigracao } from './migracao.js'
import { carregarDados, executarOperacao } from './repositorio.js'
import { aplicarOperacoes, criarFila } from './sincronizacao.js'
import { supabase } from './supabase.js'

function lerJson(chave) {
  try {
    return JSON.parse(window.localStorage.getItem(chave) ?? 'null')
  } catch {
    return null
  }
}

function salvarJson(chave, valor) {
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    // armazenamento indisponível: o cache é só uma conveniência
  }
}

export function useDadosDoAluno(usuarioId) {
  const [estado, setEstado] = useState({ carregando: true, erro: '', dados: null })
  const [sincronizacao, setSincronizacao] = useState({ estado: 'ocioso', pendentes: 0 })
  const [aviso, setAviso] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const filaRef = useRef(null)
  const chaveCache = `home-fit:cache:${usuarioId}`

  useEffect(() => {
    let ativo = true
    const fila = criarFila({
      armazenamento: window.localStorage,
      chave: `home-fit:fila:${usuarioId}`,
      executar: (operacao) => executarOperacao(supabase, usuarioId, operacao),
      aoMudar: (novo) => { if (ativo) setSincronizacao(novo) },
      aoErro: () => { if (ativo) setAviso('Uma alteração foi recusada pelo servidor e não foi salva.') },
      // Só envia depois de ler o servidor, para nenhuma alteração feita nesse meio-tempo sumir da tela.
      pausada: true,
    })
    filaRef.current = fila
    const aoVoltarInternet = () => fila.tentarAgora()
    window.addEventListener('online', aoVoltarInternet)

    async function iniciar() {
      // Abre na hora com a última cópia salva no aparelho e atualiza quando o servidor responder.
      const cache = lerJson(`home-fit:cache:${usuarioId}`)
      const temCache = Boolean(cache?.perfil && cache?.treinos && Array.isArray(cache?.checkins))
      if (temCache) {
        setEstado({ carregando: false, erro: '', dados: aplicarOperacoes(cache, fila.pendentes()) })
      }

      try {
        const servidor = await carregarDados(supabase, usuarioId)
        if (!ativo) return
        if (!window.localStorage.getItem(CHAVE_MIGRACAO)) {
          for (const operacao of operacoesDeMigracao(lerDadosLocais(window.localStorage), servidor)) {
            fila.enfileirar(operacao)
          }
          window.localStorage.setItem(CHAVE_MIGRACAO, usuarioId)
        }
        setEstado({ carregando: false, erro: '', dados: aplicarOperacoes(servidor, fila.pendentes()) })
      } catch {
        if (!ativo) return
        if (temCache) {
          setAviso('Sem conexão. Mostrando seus últimos dados salvos neste aparelho.')
        } else {
          setEstado({ carregando: false, erro: 'Não foi possível carregar seus dados. Verifique sua conexão.', dados: null })
        }
      }
      if (ativo) fila.retomar()
    }

    iniciar()
    return () => {
      ativo = false
      fila.destruir()
      window.removeEventListener('online', aoVoltarInternet)
    }
  }, [usuarioId, tentativa])

  useEffect(() => {
    if (estado.dados) salvarJson(chaveCache, estado.dados)
  }, [estado.dados, chaveCache])

  const dados = estado.dados

  function atualizarDados(transformar) {
    setEstado((anterior) => ({ ...anterior, dados: transformar(anterior.dados) }))
  }

  function registrarCheckin(dia) {
    if (!dados || dados.checkins.includes(dia)) return
    atualizarDados((atual) => ({ ...atual, checkins: [...new Set([...atual.checkins, dia])].sort() }))
    filaRef.current.enfileirar({ tipo: 'checkin', dia })
  }

  function atualizarPerfil(novo) {
    if (!dados) return
    const atual = dados.perfil
    if (novo.nome !== atual.nome || novo.metaSemanal !== atual.metaSemanal || novo.telefone !== atual.telefone) {
      filaRef.current.enfileirar({
        tipo: 'perfil', nome: novo.nome, metaSemanal: novo.metaSemanal, telefone: novo.telefone ?? '',
      })
    }
    const antes = new Map(atual.pesos.map(({ dia, kg }) => [dia, kg]))
    const depois = new Map(novo.pesos.map(({ dia, kg }) => [dia, kg]))
    for (const [dia, kg] of depois) {
      if (antes.get(dia) !== kg) filaRef.current.enfileirar({ tipo: 'peso', dia, kg })
    }
    for (const dia of antes.keys()) {
      if (!depois.has(dia)) filaRef.current.enfileirar({ tipo: 'peso', dia, kg: null })
    }
    atualizarDados((dadosAtuais) => ({ ...dadosAtuais, perfil: novo }))
  }

  function salvarTreino(treinos, dia) {
    if (!dados) return
    const sessao = treinos.sessoes[dia]
    if (sessao) filaRef.current.enfileirar({ tipo: 'sessao', dia, sessao })
    atualizarDados((atual) => ({ ...atual, treinos }))
  }

  return {
    carregando: estado.carregando,
    erro: estado.erro,
    dados,
    sincronizacao,
    aviso,
    fecharAviso: () => setAviso(''),
    tentarDeNovo: () => {
      setEstado({ carregando: true, erro: '', dados: null })
      setTentativa((valor) => valor + 1)
    },
    registrarCheckin,
    atualizarPerfil,
    salvarTreino,
  }
}
