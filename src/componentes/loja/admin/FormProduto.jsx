import { useState } from 'react'
import Gaveta from '../../Gaveta.jsx'
import { CATEGORIAS, enviarFotoProduto, excluirProduto, salvarProduto } from '../../../dados/loja.js'
import { supabase } from '../../../dados/supabase.js'
import { formatarPreco, paraCentavos } from '../../../utils/dinheiro.js'
import { ATALHOS_DESCONTO, lerDesconto, precoComDesconto, precoParaFormulario, validarFormulario } from '../../../utils/produto.js'
import FotoProduto from '../FotoProduto.jsx'

function estadoInicial(produto) {
  return {
    nome: produto?.nome ?? '',
    marca: produto?.marca ?? '',
    categoria: produto?.categoria ?? 'proteinas',
    ...precoParaFormulario(produto),
    estoque: String(produto?.estoque ?? ''),
    descricao: produto?.descricao ?? '',
    imagem_url: produto?.imagem_url ?? '',
    ativo: produto?.ativo ?? true,
    destaque: produto?.destaque ?? false,
  }
}

function FormProduto({ produto, aberto, onFechar, onSalvo }) {
  const [campos, setCampos] = useState(() => estadoInicial(produto))
  // Preço como veio do banco: se o dono não mexer, nenhum centavo muda ao salvar.
  const [original] = useState(() => (produto ? { ...precoParaFormulario(produto), preco_centavos: produto.preco_centavos, preco_antigo_centavos: produto.preco_antigo_centavos } : null))
  const cheio = paraCentavos(campos.preco)
  const desconto = lerDesconto(campos.desconto)
  const precoFinal = cheio && desconto ? precoComDesconto(cheio, desconto) : null
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)
  const [erro, setErro] = useState('')

  const mudar = (campo) => (event) => {
    const valor = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setCampos((atuais) => ({ ...atuais, [campo]: valor }))
  }

  async function escolherFoto(event) {
    const arquivo = event.target.files?.[0]
    event.target.value = ''
    if (!arquivo) return
    setEnviandoFoto(true)
    setErro('')
    try {
      const url = await enviarFotoProduto(supabase, arquivo)
      setCampos((atuais) => ({ ...atuais, imagem_url: url }))
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setEnviandoFoto(false)
    }
  }

  async function salvar(event) {
    event.preventDefault()
    const { erro: invalido, produto: dados } = validarFormulario(campos, original)
    if (invalido) return setErro(invalido)
    setSalvando(true)
    setErro('')
    try {
      await salvarProduto(supabase, produto ? { id: produto.id, ...dados } : dados)
      onSalvo()
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    if (!confirmarExclusao) return setConfirmarExclusao(true)
    setSalvando(true)
    try {
      await excluirProduto(supabase, produto.id)
      onSalvo()
    } catch (falha) {
      setErro(falha.message)
      setConfirmarExclusao(false)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Gaveta
      aberta={aberto}
      titulo={produto ? 'Editar produto' : 'Novo produto'}
      onFechar={onFechar}
      rodape={(
        <div className="carrinho__botoes">
          {produto && (
            <button type="button" className={`botao-perigo${confirmarExclusao ? ' confirmando' : ''}`} onClick={excluir} disabled={salvando}>
              {confirmarExclusao ? 'Confirmar exclusão' : 'Excluir'}
            </button>
          )}
          <button type="submit" form="form-produto" className="botao-primario" disabled={salvando || enviandoFoto}>
            {salvando ? <span className="spinner" aria-label="Salvando" /> : 'Salvar produto'}
          </button>
        </div>
      )}
    >
      <form id="form-produto" className="form-produto" onSubmit={salvar} noValidate>
        <div className="form-produto__foto">
          <FotoProduto produto={{ imagem_url: campos.imagem_url, categoria: campos.categoria }} />
          <div>
            <label className="botao-secundario">
              {enviandoFoto ? 'Enviando…' : campos.imagem_url ? 'Trocar foto' : 'Adicionar foto'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={escolherFoto} disabled={enviandoFoto} hidden />
            </label>
            {campos.imagem_url && (
              <button type="button" className="botao-texto" onClick={() => setCampos((atuais) => ({ ...atuais, imagem_url: '' }))}>
                Remover foto
              </button>
            )}
            <small>JPG, PNG ou WEBP até 5 MB. Fundo claro e produto centralizado ficam melhores.</small>
          </div>
        </div>

        <label className="campo">
          <span>Nome</span>
          <input value={campos.nome} onChange={mudar('nome')} maxLength={80} required placeholder="Whey Protein 900g" />
        </label>
        <div className="form-produto__dupla">
          <label className="campo">
            <span>Marca</span>
            <input value={campos.marca} onChange={mudar('marca')} maxLength={40} placeholder="Growth" />
          </label>
          <label className="campo">
            <span>Categoria</span>
            <select value={campos.categoria} onChange={mudar('categoria')}>
              {CATEGORIAS.map(({ id, nome }) => <option key={id} value={id}>{nome}</option>)}
            </select>
          </label>
        </div>
        <div className="form-produto__dupla">
          <label className="campo">
            <span>Preço normal (R$)</span>
            <input value={campos.preco} onChange={mudar('preco')} inputMode="decimal" placeholder="139,90" required />
          </label>
          <label className="campo">
            <span>Desconto % (opcional)</span>
            <input value={campos.desconto} onChange={mudar('desconto')} inputMode="decimal" placeholder="0" />
          </label>
        </div>
        <div className="form-produto__desconto">
          <div className="form-produto__atalhos" role="group" aria-label="Atalhos de desconto">
            <button type="button" aria-pressed={!desconto} onClick={() => setCampos((atuais) => ({ ...atuais, desconto: '' }))}>
              Sem desconto
            </button>
            {ATALHOS_DESCONTO.map((valor) => (
              <button key={valor} type="button" aria-pressed={desconto === valor}
                onClick={() => setCampos((atuais) => ({ ...atuais, desconto: String(valor) }))}>
                {valor}%
              </button>
            ))}
          </div>
          {precoFinal !== null && desconto !== null && (
            <p className="form-produto__previa" role="status">
              Preço final: <b>{formatarPreco(precoFinal)}</b>
              <span> · economia de {formatarPreco(cheio - precoFinal)}</span>
            </p>
          )}
          {desconto === null && <p className="form-produto__previa form-produto__previa--erro">Digite só o número, por exemplo 10.</p>}
        </div>
        <label className="campo">
          <span>Estoque (unidades)</span>
          <input value={campos.estoque} onChange={mudar('estoque')} inputMode="numeric" placeholder="10" required />
        </label>
        <label className="campo">
          <span>Descrição</span>
          <textarea value={campos.descricao} onChange={mudar('descricao')} rows={3} maxLength={1000}
            placeholder="Sabor, tamanho, dose, modo de usar…" />
        </label>
        <label className="campo-check">
          <input type="checkbox" checked={campos.ativo} onChange={mudar('ativo')} />
          <span><b>À venda</b> — aparece na vitrine para os alunos</span>
        </label>
        <label className="campo-check">
          <input type="checkbox" checked={campos.destaque} onChange={mudar('destaque')} />
          <span><b>Destaque</b> — aparece primeiro na vitrine</span>
        </label>

        {erro && <p className="loja__erro" role="alert">{erro}</p>}
      </form>
    </Gaveta>
  )
}

export default FormProduto
