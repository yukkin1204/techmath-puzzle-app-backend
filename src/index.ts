import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Env = {
  ANSWERS: KVNamespace
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({
  origin: 'https://techmath-puzzle-app.vercel.app',
}))

app.post('/check-answer', async (c) => {
  const { penName, problemId, answer } = await c.req.json()

  if (!penName || !problemId || !answer) {
    return c.json({ success: false, message: 'ペンネーム、問題ID、回答は必須です' }, 400)
  }

  const correctAnswer = await c.env.ANSWERS.get(problemId)
  if (!correctAnswer) {
    return c.json({ success: false, message: '無効な問題IDです' }, 400)
  }

  const isCorrect = correctAnswer.toLowerCase() === answer.toLowerCase()

  return c.json({ success: true, correct: isCorrect })
})

export default app