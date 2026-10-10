import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import { buscarExercicios } from './exercicios.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

app.get('/api/exercises', (req, res) => {
  const { status, corpo } = buscarExercicios(req.query)
  return res.status(status).json(corpo)
})

app.use(express.static(path.join(projectRoot, 'dist')))
app.get('*path', (req, res) => {
  res.sendFile(path.join(projectRoot, 'dist', 'index.html'))
})

app.listen(port, () => {
  console.log(`Home Fit API em http://localhost:${port}`)
})
