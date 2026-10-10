// Função da Vercel: o mesmo /api/exercises do servidor local, rodando sem servidor ligado.
import { buscarExercicios } from '../server/exercicios.js'

export default function handler(req, res) {
  const { status, corpo } = buscarExercicios(req.query)
  // A lista de exercícios quase nunca muda: a Vercel guarda a resposta por 1 dia.
  if (status === 200) res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
  res.status(status).json(corpo)
}
