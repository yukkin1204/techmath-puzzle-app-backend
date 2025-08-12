import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Env = {
  ANSWERS: KVNamespace
  DISCORD_WEBHOOK_URL: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({
  origin: 'https://techmath-puzzle-app.vercel.app',
}))

const normalize = (str: string) =>
  str.toLowerCase().replace(/\s+/g, '').replace(/[Ａ-Ｚａ-ｚ０-９]/g, s =>String.fromCharCode(s.charCodeAt(0) - 0xFEE0))

app.post('/check-answer', async (c) => {
  try {
    const { penName, problemId, answer } = await c.req.json()

    if (!penName || !problemId || !answer) {
      return c.json({ success: false, message: 'ペンネーム、回答は必須です' }, 400)
    }

    const correctAnswer = await c.env.ANSWERS.get(problemId)
    if (!correctAnswer) {
      return c.json({ success: false, message: '無効な問題IDです' }, 404)
    }

    const isCorrect = normalize(correctAnswer) === normalize(answer)

    if (isCorrect) {
      const webhookUrl = c.env.DISCORD_WEBHOOK_URL
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `ペンネーム「${penName}」さんが問題ID「${problemId}」に正解しました！`
          }),
        })
      }
    }

    return c.json({ success: true, correct: isCorrect })
  } catch (err) {
    console.error(err)
    return c.json({ success: false, message: 'サーバーエラーが発生しました' }, 500)
  }
})

export default app