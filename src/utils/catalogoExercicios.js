// Catálogo de exercícios em português usado pelo personal para montar fichas.
// O id é o do banco de imagens (free-exercise-db) e serve para buscar a foto.
// series / repeticoes / descanso são só o ponto de partida: o personal ajusta na ficha.

export const GRUPOS_MUSCULARES = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Trapézio', 'Pernas', 'Posterior', 'Glúteos', 'Panturrilha', 'Abdômen', 'Cardio',
]

const e = (id, nome, grupo, series = 3, repeticoes = '12', descanso = 60, unidade) =>
  ({ id, nome, grupo, series, repeticoes, descanso, ...(unidade ? { unidade } : {}) })

export const CATALOGO_EXERCICIOS = [
  // Peito
  e('Barbell_Bench_Press_-_Medium_Grip', 'Supino reto com barra', 'Peito', 4, '10', 90),
  e('Dumbbell_Bench_Press', 'Supino reto com halteres', 'Peito', 4, '10', 90),
  e('Barbell_Incline_Bench_Press_-_Medium_Grip', 'Supino inclinado com barra', 'Peito', 4, '10', 90),
  e('Incline_Dumbbell_Press', 'Supino inclinado com halteres', 'Peito', 3, '10', 90),
  e('Decline_Barbell_Bench_Press', 'Supino declinado com barra', 'Peito', 3, '10', 90),
  e('Smith_Machine_Bench_Press', 'Supino no Smith', 'Peito', 3, '10', 90),
  e('Machine_Bench_Press', 'Supino na máquina', 'Peito', 3, '12', 60),
  e('Dumbbell_Flyes', 'Crucifixo reto com halteres', 'Peito', 3, '12', 60),
  e('Incline_Dumbbell_Flyes', 'Crucifixo inclinado com halteres', 'Peito', 3, '12', 60),
  e('Butterfly', 'Voador (peck deck)', 'Peito', 3, '12', 60),
  e('Cable_Crossover', 'Crucifixo no cross over', 'Peito', 3, '12', 60),
  e('Pushups', 'Flexão de braço', 'Peito', 3, '15', 60),
  // Costas
  e('Wide-Grip_Lat_Pulldown', 'Puxada frontal aberta', 'Costas', 4, '10', 90),
  e('Close-Grip_Front_Lat_Pulldown', 'Puxada frontal fechada', 'Costas', 3, '12', 75),
  e('Pullups', 'Barra fixa', 'Costas', 3, '8', 90),
  e('Bent_Over_Barbell_Row', 'Remada curvada com barra', 'Costas', 4, '10', 90),
  e('Reverse_Grip_Bent-Over_Rows', 'Remada curvada supinada', 'Costas', 3, '10', 90),
  e('One-Arm_Dumbbell_Row', 'Remada unilateral com halter', 'Costas', 3, '12', 60),
  e('Seated_Cable_Rows', 'Remada baixa na polia', 'Costas', 3, '12', 75),
  e('T-Bar_Row_with_Handle', 'Remada cavalinho', 'Costas', 3, '10', 90),
  e('Straight-Arm_Pulldown', 'Pulldown com braços estendidos', 'Costas', 3, '12', 60),
  e('Barbell_Deadlift', 'Levantamento terra', 'Costas', 4, '8', 120),
  e('Hyperextensions_Back_Extensions', 'Hiperextensão lombar', 'Costas', 3, '15', 60),
  e('Superman', 'Superman', 'Costas', 3, '15', 45),
  // Ombros
  e('Dumbbell_Shoulder_Press', 'Desenvolvimento com halteres', 'Ombros', 3, '12', 60),
  e('Barbell_Shoulder_Press', 'Desenvolvimento com barra', 'Ombros', 3, '10', 90),
  e('Arnold_Dumbbell_Press', 'Desenvolvimento Arnold', 'Ombros', 3, '10', 75),
  e('Leverage_Shoulder_Press', 'Desenvolvimento na máquina', 'Ombros', 3, '12', 60),
  e('Side_Lateral_Raise', 'Elevação lateral', 'Ombros', 3, '12', 60),
  e('Cable_Seated_Lateral_Raise', 'Elevação lateral na polia', 'Ombros', 3, '12', 60),
  e('Front_Dumbbell_Raise', 'Elevação frontal', 'Ombros', 3, '12', 60),
  e('Reverse_Flyes', 'Crucifixo invertido', 'Ombros', 3, '12', 60),
  e('Dumbbell_Lying_Rear_Lateral_Raise', 'Crucifixo invertido deitado', 'Ombros', 3, '12', 60),
  e('Face_Pull', 'Face pull', 'Ombros', 3, '15', 60),
  e('Upright_Barbell_Row', 'Remada alta', 'Ombros', 3, '12', 60),
  // Trapézio
  e('Barbell_Shrug', 'Encolhimento com barra', 'Trapézio', 3, '12', 60),
  // Bíceps
  e('Barbell_Curl', 'Rosca direta com barra', 'Bíceps', 3, '10', 60),
  e('EZ-Bar_Curl', 'Rosca direta barra W', 'Bíceps', 3, '10', 60),
  e('Dumbbell_Bicep_Curl', 'Rosca alternada com halteres', 'Bíceps', 3, '12', 60),
  e('Hammer_Curls', 'Rosca martelo', 'Bíceps', 3, '12', 60),
  e('Cable_Hammer_Curls_-_Rope_Attachment', 'Rosca martelo na corda', 'Bíceps', 3, '12', 60),
  e('Preacher_Curl', 'Rosca Scott', 'Bíceps', 3, '10', 60),
  e('Concentration_Curls', 'Rosca concentrada', 'Bíceps', 3, '12', 45),
  // Tríceps
  e('Triceps_Pushdown', 'Tríceps na polia', 'Tríceps', 3, '12', 60),
  e('Triceps_Pushdown_-_Rope_Attachment', 'Tríceps corda', 'Tríceps', 3, '12', 60),
  e('EZ-Bar_Skullcrusher', 'Tríceps testa', 'Tríceps', 3, '10', 60),
  e('Lying_Triceps_Press', 'Tríceps testa deitado', 'Tríceps', 3, '10', 60),
  e('Standing_Dumbbell_Triceps_Extension', 'Tríceps francês', 'Tríceps', 3, '12', 60),
  e('Close-Grip_Barbell_Bench_Press', 'Supino fechado', 'Tríceps', 3, '10', 75),
  e('Dips_-_Triceps_Version', 'Mergulho nas paralelas', 'Tríceps', 3, '10', 75),
  e('Bench_Dips', 'Mergulho no banco', 'Tríceps', 3, '12', 60),
  // Pernas
  e('Barbell_Full_Squat', 'Agachamento livre com barra', 'Pernas', 4, '10', 120),
  e('Smith_Machine_Squat', 'Agachamento no Smith', 'Pernas', 4, '10', 90),
  e('Goblet_Squat', 'Agachamento goblet', 'Pernas', 3, '12', 75),
  e('Hack_Squat', 'Agachamento hack', 'Pernas', 4, '10', 90),
  e('Leg_Press', 'Leg press 45°', 'Pernas', 4, '12', 90),
  e('Leg_Extensions', 'Cadeira extensora', 'Pernas', 3, '12', 60),
  e('Dumbbell_Lunges', 'Afundo com halteres', 'Pernas', 3, '10', 75),
  e('Barbell_Lunge', 'Afundo com barra', 'Pernas', 3, '10', 75),
  e('Dumbbell_Step_Ups', 'Subida no banco', 'Pernas', 3, '10', 60),
  e('Thigh_Adductor', 'Cadeira adutora', 'Pernas', 3, '15', 45),
  // Posterior
  e('Lying_Leg_Curls', 'Mesa flexora', 'Posterior', 3, '12', 60),
  e('Seated_Leg_Curl', 'Cadeira flexora', 'Posterior', 3, '12', 60),
  e('Romanian_Deadlift', 'Stiff com barra', 'Posterior', 3, '10', 90),
  e('Stiff-Legged_Barbell_Deadlift', 'Stiff pernas estendidas', 'Posterior', 3, '10', 90),
  // Glúteos
  e('Barbell_Hip_Thrust', 'Elevação pélvica com barra', 'Glúteos', 4, '10', 90),
  e('Butt_Lift_Bridge', 'Ponte de glúteo', 'Glúteos', 3, '15', 45),
  e('Glute_Kickback', 'Coice na polia / glúteo 4 apoios', 'Glúteos', 3, '12', 45),
  e('Thigh_Abductor', 'Cadeira abdutora', 'Glúteos', 3, '15', 45),
  e('Sumo_Deadlift', 'Levantamento terra sumô', 'Glúteos', 3, '8', 120),
  // Panturrilha
  e('Standing_Calf_Raises', 'Panturrilha em pé', 'Panturrilha', 4, '15', 45),
  e('Seated_Calf_Raise', 'Panturrilha sentado', 'Panturrilha', 3, '15', 45),
  e('Calf_Press_On_The_Leg_Press_Machine', 'Panturrilha no leg press', 'Panturrilha', 3, '15', 45),
  // Abdômen
  e('Crunches', 'Abdominal supra', 'Abdômen', 3, '20', 45),
  e('Cable_Crunch', 'Abdominal na polia', 'Abdômen', 3, '15', 45),
  e('Hanging_Leg_Raise', 'Elevação de pernas na barra', 'Abdômen', 3, '12', 60),
  e('Flat_Bench_Lying_Leg_Raise', 'Elevação de pernas no banco', 'Abdômen', 3, '15', 45),
  e('Russian_Twist', 'Abdominal oblíquo (russian twist)', 'Abdômen', 3, '20', 45),
  e('Ab_Roller', 'Roda abdominal', 'Abdômen', 3, '10', 60),
  e('Plank', 'Prancha', 'Abdômen', 3, '30', 45, 'seg'),
  e('Side_Bridge', 'Prancha lateral', 'Abdômen', 3, '30', 45, 'seg'),
  e('Mountain_Climbers', 'Escalador', 'Abdômen', 3, '30', 45, 'seg'),
  // Cardio
  e('Running_Treadmill', 'Esteira', 'Cardio', 1, '20 min', 0),
  e('Bicycling_Stationary', 'Bicicleta ergométrica', 'Cardio', 1, '20 min', 0),
  e('Elliptical_Trainer', 'Elíptico', 'Cardio', 1, '20 min', 0),
  e('Rowing_Stationary', 'Remo ergômetro', 'Cardio', 1, '10 min', 0),
  e('Rope_Jumping', 'Pular corda', 'Cardio', 3, '1 min', 45),
  e('Box_Jump_Multiple_Response', 'Salto na caixa', 'Cardio', 3, '10', 60),
]

const PORID = new Map(CATALOGO_EXERCICIOS.map((exercicio) => [exercicio.id, exercicio]))

export function exercicioDoCatalogo(id) {
  return PORID.get(id) ?? null
}
