import { useEffect, useRef } from 'react'

const ORIENTACOES = {
  Dumbbell_Bench_Press: [
    'Deite no banco com os pés apoiados e os halteres ao lado do peito.',
    'Empurre os halteres para cima com controle, sem bater um no outro.',
    'Retorne à posição inicial sem deixar os pesos caírem.',
  ],
  Bent_Over_Barbell_Row: [
    'Incline o tronco a partir do quadril, mantendo a coluna em posição neutra.',
    'Puxe a barra em direção ao abdômen, levando os cotovelos para trás.',
    'Desça a barra de forma controlada, sem usar impulso do tronco.',
  ],
  Barbell_Full_Squat: [
    'Ajuste a barra e a posição dos pés com a orientação do seu personal.',
    'Flexione quadris e joelhos com controle, mantendo os pés apoiados.',
    'Retorne à posição inicial usando uma amplitude adequada à sua mobilidade.',
  ],
  Dumbbell_Shoulder_Press: [
    'Posicione os halteres na altura dos ombros e mantenha o tronco estável.',
    'Empurre os pesos para cima sem arquear excessivamente a lombar.',
    'Retorne à altura dos ombros com controle.',
  ],
  Incline_Dumbbell_Press: [
    'Ajuste o banco entre 30° e 45° e apoie bem as costas.',
    'Empurre os halteres para cima alinhados com a parte alta do peito.',
    'Desça devagar até sentir o alongamento, sem perder a postura.',
  ],
  Cable_Crossover: [
    'Fique no centro do cross com um pé à frente e o tronco levemente inclinado.',
    'Traga as alças em arco à frente do peito, com os cotovelos levemente flexionados.',
    'Volte abrindo os braços com controle, sem deixar o peso puxar você.',
  ],
  Triceps_Pushdown: [
    'Segure a barra com os cotovelos colados ao corpo.',
    'Estenda os cotovelos até os braços ficarem retos, sem mover os ombros.',
    'Suba a barra devagar até a altura do peito.',
  ],
  'Dips_-_Triceps_Version': [
    'Apoie-se nas barras com os braços estendidos e o tronco reto.',
    'Desça flexionando os cotovelos para trás até cerca de 90°.',
    'Empurre o corpo de volta para cima. Use o gravitron se precisar de ajuda.',
  ],
  'Wide-Grip_Lat_Pulldown': [
    'Segure a barra com pegada aberta e prenda as coxas no apoio.',
    'Puxe a barra até a parte alta do peito, levando os cotovelos para baixo.',
    'Suba controlando o peso até estender os braços.',
  ],
  Seated_Cable_Rows: [
    'Sente com os joelhos levemente flexionados e a coluna neutra.',
    'Puxe o triângulo em direção ao abdômen, juntando as escápulas.',
    'Estenda os braços com controle, sem arredondar as costas.',
  ],
  Barbell_Curl: [
    'Em pé, segure a barra com as palmas para cima na largura dos ombros.',
    'Flexione os cotovelos levando a barra até o peito, sem balançar o tronco.',
    'Desça devagar até estender os braços.',
  ],
  Hammer_Curls: [
    'Segure os halteres com as palmas voltadas uma para a outra.',
    'Suba os pesos flexionando os cotovelos, mantendo-os junto ao corpo.',
    'Desça de forma controlada.',
  ],
  Leg_Press: [
    'Apoie as costas no encosto e os pés na plataforma na largura do quadril.',
    'Desça a plataforma flexionando os joelhos sem tirar o quadril do banco.',
    'Empurre de volta sem travar completamente os joelhos.',
  ],
  Leg_Extensions: [
    'Ajuste o encosto para o joelho ficar alinhado ao eixo da máquina.',
    'Estenda as pernas até ficarem quase retas e segure um instante.',
    'Desça devagar, sem deixar o peso bater.',
  ],
  Lying_Leg_Curls: [
    'Deite de bruços com o rolo logo acima dos calcanhares.',
    'Flexione os joelhos trazendo os calcanhares em direção ao glúteo.',
    'Volte devagar, sem tirar o quadril do banco.',
  ],
  Standing_Calf_Raises: [
    'Apoie a ponta dos pés na plataforma e os ombros sob as almofadas.',
    'Suba o máximo possível na ponta dos pés e segure um instante.',
    'Desça até alongar bem a panturrilha.',
  ],
  Side_Lateral_Raise: [
    'Em pé, segure os halteres ao lado do corpo com os cotovelos levemente flexionados.',
    'Eleve os braços pelas laterais até a altura dos ombros.',
    'Desça devagar, sem usar impulso.',
  ],
  Reverse_Flyes: [
    'Incline o tronco à frente com a coluna neutra e os halteres abaixo do peito.',
    'Abra os braços para os lados, apertando a parte de trás dos ombros.',
    'Volte devagar à posição inicial.',
  ],
  Barbell_Shrug: [
    'Segure a barra à frente das coxas com os braços estendidos.',
    'Eleve os ombros em direção às orelhas, sem dobrar os cotovelos.',
    'Desça controlando o movimento.',
  ],
  Crunches: [
    'Deite com os joelhos flexionados e as mãos ao lado da cabeça.',
    'Tire as escápulas do chão contraindo o abdômen, sem puxar o pescoço.',
    'Desça devagar, mantendo a tensão.',
  ],
  Barbell_Hip_Thrust: [
    'Apoie a parte alta das costas no banco e a barra sobre o quadril (use protetor).',
    'Empurre o quadril para cima até alinhar tronco e coxas, contraindo os glúteos.',
    'Desça com controle sem encostar o quadril no chão.',
  ],
  Romanian_Deadlift: [
    'Em pé, segure a barra com os joelhos levemente flexionados.',
    'Leve o quadril para trás descendo a barra rente às pernas, com a coluna neutra.',
    'Suba contraindo glúteos e posteriores.',
  ],
  Dumbbell_Lunges: [
    'Segure os halteres ao lado do corpo e dê um passo à frente.',
    'Desça até os dois joelhos ficarem próximos de 90°.',
    'Empurre com a perna da frente para voltar e alterne os lados.',
  ],
  Seated_Calf_Raise: [
    'Sente com a almofada sobre as coxas e a ponta dos pés na plataforma.',
    'Suba os calcanhares o máximo possível.',
    'Desça devagar até alongar a panturrilha.',
  ],
  Plank: [
    'Apoie antebraços e pontas dos pés no chão, com os cotovelos sob os ombros.',
    'Mantenha o corpo reto da cabeça aos calcanhares, contraindo abdômen e glúteos.',
    'Respire normalmente e segure pelo tempo indicado.',
  ],
}

const ORIENTACAO_PADRAO = [
  'Faça o movimento com controle e amplitude confortável.',
  'Peça ao professor para ajustar a carga e a execução.',
]

function DetalhesExercicio({ exercicio, acionadorRef, onFechar }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const acionador = acionadorRef.current
    dialog.showModal()
    return () => {
      dialog.close()
      if (acionador?.isConnected) acionador.focus()
    }
  }, [acionadorRef])

  return (
    <dialog
      className="treino-detalhes"
      ref={dialogRef}
      aria-labelledby="treino-detalhes-titulo"
      onCancel={(event) => {
        event.preventDefault()
        onFechar()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onFechar()
        }
      }}
    >
      <header>
        <span>{exercicio.grupo}</span>
        <button type="button" onClick={onFechar} autoFocus aria-label="Fechar detalhes">✕</button>
      </header>
      <h2 id="treino-detalhes-titulo">{exercicio.nome}</h2>
      <img
        src={exercicio.imagem}
        alt={`Demonstração de ${exercicio.nome}`}
        onError={(event) => {
          event.currentTarget.hidden = true
          event.currentTarget.nextElementSibling.hidden = false
        }}
      />
      <p hidden>Imagem indisponível.</p>
      <p>{exercicio.series} séries · {exercicio.repeticoes} {exercicio.unidade === 'seg' ? 'segundos' : 'repetições'} · {exercicio.descanso}s de descanso</p>
      <h3>Como executar</h3>
      <ol>{(ORIENTACOES[exercicio.id] ?? ORIENTACAO_PADRAO).map((passo) => <li key={passo}>{passo}</li>)}</ol>
      <small>Orientações gerais para os exercícios de exemplo. Siga os ajustes do seu personal e interrompa se sentir dor.</small>
    </dialog>
  )
}

export default DetalhesExercicio
