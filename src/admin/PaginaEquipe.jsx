import { useState } from 'react'
import { supabase } from '../dados/supabase.js'
import { normalizar } from '../utils/vitrine.js'
import CabecalhoPagina from './CabecalhoPagina.jsx'
import { Avatar } from './comum.jsx'
import { definirPapel } from './dadosAdmin.js'

const PAPEIS = {
  dono: { nome: 'Dono', texto: 'Tudo do painel, inclusive loja e equipe' },
  personal: { nome: 'Personal', texto: 'Alunos, treinos e modelos' },
}

function PaginaEquipe({ perfis, usuarioId, onDadosMudaram }) {
  const [busca, setBusca] = useState('')
  const [papelNovo, setPapelNovo] = useState('personal')
  const [ocupado, setOcupado] = useState(null)
  const [confirmando, setConfirmando] = useState(null)
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' })

  const equipe = perfis.filter(({ papel }) => papel === 'dono' || papel === 'personal')
    .sort((a, b) => (a.papel === b.papel ? a.nome.localeCompare(b.nome, 'pt-BR') : a.papel === 'dono' ? -1 : 1))
  const termo = normalizar(busca)
  const candidatos = termo.length >= 2
    ? perfis.filter(({ papel, nome, email }) => papel === 'aluno' && normalizar(`${nome} ${email}`).includes(termo)).slice(0, 6)
    : []

  async function mudar(pessoa, papel, sucesso) {
    setOcupado(pessoa.id)
    setMensagem({ tipo: '', texto: '' })
    try {
      await definirPapel(supabase, pessoa.id, papel)
      setMensagem({ tipo: 'ok', texto: sucesso })
      setBusca('')
      onDadosMudaram()
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: erro.message })
    } finally {
      setOcupado(null)
      setConfirmando(null)
    }
  }

  return (
    <section className="adm-equipe">
      <CabecalhoPagina
        migalhas={[{ nome: 'Equipe' }]}
        titulo="Equipe"
        descricao="Quem acessa o painel da academia. Só o dono pode mudar a equipe."
      />

      {mensagem.texto && (
        <p className={mensagem.tipo === 'erro' ? 'adm-erro adm-erro--bloco' : 'adm-nota'} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>
          {mensagem.texto}
        </p>
      )}

      <div className="adm-duas-colunas">
        <section className="adm-painel-card">
          <header className="adm-painel-card__topo"><div><h2>Equipe atual</h2><p>{equipe.length} {equipe.length === 1 ? 'pessoa' : 'pessoas'}</p></div></header>
          <ul className="adm-equipe__lista">
            {equipe.map((pessoa) => {
              const eu = pessoa.id === usuarioId
              return (
                <li key={pessoa.id}>
                  <span className="adm-pessoa adm-pessoa--estatica">
                    <Avatar nome={pessoa.nome || pessoa.email} />
                    <span><b>{pessoa.nome || 'Sem nome'}{eu && ' (você)'}</b><small>{pessoa.email}</small></span>
                  </span>
                  <span className={`adm-papel adm-papel--${pessoa.papel}`} title={PAPEIS[pessoa.papel].texto}>{PAPEIS[pessoa.papel].nome}</span>
                  {!eu && (
                    <span className="adm-equipe__acoes">
                      <button type="button" className="adm-link" disabled={ocupado === pessoa.id}
                        onClick={() => mudar(pessoa, pessoa.papel === 'dono' ? 'personal' : 'dono',
                          `${pessoa.nome || pessoa.email} agora é ${pessoa.papel === 'dono' ? 'personal' : 'dono'}.`)}>
                        Tornar {pessoa.papel === 'dono' ? 'personal' : 'dono'}
                      </button>
                      <button type="button" className={`adm-link adm-link--perigo${confirmando === pessoa.id ? ' confirmando' : ''}`}
                        disabled={ocupado === pessoa.id} onBlur={() => setConfirmando(null)}
                        onClick={() => (confirmando === pessoa.id
                          ? mudar(pessoa, 'aluno', `${pessoa.nome || pessoa.email} saiu da equipe e voltou a ser aluno.`)
                          : setConfirmando(pessoa.id))}>
                        {confirmando === pessoa.id ? 'Confirmar remoção' : 'Remover'}
                      </button>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        <section className="adm-painel-card">
          <header className="adm-painel-card__topo"><div><h2>Adicionar à equipe</h2><p>A pessoa precisa ter conta no app.</p></div></header>
          <div className="adm-segmento adm-segmento--largo" role="group" aria-label="Papel">
            {Object.entries(PAPEIS).map(([id, { nome }]) => (
              <button key={id} type="button" aria-pressed={papelNovo === id} onClick={() => setPapelNovo(id)}>{nome}</button>
            ))}
          </div>
          <p className="adm-ajuda">{PAPEIS[papelNovo].texto}.</p>
          <label className="adm-busca">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="visualmente-oculto">Buscar pessoa por nome ou e-mail</span>
            <input type="search" placeholder="Nome ou e-mail de quem já tem conta" value={busca} onChange={(event) => setBusca(event.target.value)} />
          </label>
          {termo.length >= 2 && (
            candidatos.length === 0
              ? <p className="adm-vazio">Ninguém encontrado. Confira o e-mail ou crie a conta (veja abaixo).</p>
              : (
                <ul className="adm-equipe__lista">
                  {candidatos.map((pessoa) => (
                    <li key={pessoa.id}>
                      <span className="adm-pessoa adm-pessoa--estatica">
                        <Avatar nome={pessoa.nome || pessoa.email} />
                        <span><b>{pessoa.nome || 'Sem nome'}</b><small>{pessoa.email}</small></span>
                      </span>
                      <button type="button" className="adm-botao adm-botao--pequeno" disabled={ocupado === pessoa.id}
                        onClick={() => mudar(pessoa, papelNovo, `${pessoa.nome || pessoa.email} agora é ${PAPEIS[papelNovo].nome.toLowerCase()} da academia.`)}>
                        Adicionar como {PAPEIS[papelNovo].nome.toLowerCase()}
                      </button>
                    </li>
                  ))}
                </ul>
              )
          )}
          <details className="adm-explica">
            <summary>Como criar a conta de alguém com senha definida</summary>
            <ol>
              <li>No Supabase, abra <b>Authentication → Users</b>.</li>
              <li>Clique em <b>Add user → Create new user</b>, preencha e-mail e senha e deixe marcado <b>Auto Confirm User</b>.</li>
              <li>Volte aqui, busque o e-mail e adicione à equipe.</li>
              <li>A pessoa entra no app com esse e-mail e senha (e pode trocar a senha em “Esqueci minha senha”).</li>
            </ol>
          </details>
        </section>
      </div>
    </section>
  )
}

export default PaginaEquipe
