import Header from '../Header.jsx'
import { chaveDoDia } from '../../utils/checkins.js'
import { dataCurta, fichaDoDia } from '../../utils/ficha.js'
import CardsTreinos from './CardsTreinos.jsx'

function AreaTreinos({ treinos, fichas, onSalvarTreino, onTreinoConcluido }) {
  // Com ficha do personal valendo hoje, o banner mostra o nome dela e o recado geral.
  const ficha = fichaDoDia(fichas, chaveDoDia(new Date()))
  const descricao = ficha
    ? `Válida até ${dataCurta(ficha.fim)}.${ficha.observacoes ? ` ${ficha.observacoes}` : ''}`
    : 'Marque suas séries, registre as cargas e bata seus recordes.'

  return (
    <>
      <Header
        titulo={ficha ? ficha.titulo : 'Bora treinar'}
        saudacao=""
        contexto={ficha ? 'Ficha do seu personal' : 'Área de treino'}
        descricao={descricao}
        fichas={fichas}
      />
      <CardsTreinos
        treinos={treinos}
        fichas={fichas}
        onSalvarTreino={onSalvarTreino}
        onTreinoConcluido={onTreinoConcluido}
      />
    </>
  )
}

export default AreaTreinos
