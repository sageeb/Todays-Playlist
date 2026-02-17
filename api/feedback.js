import { getDb } from './_lib/firebase-admin.js'
import { getSpotifyUserId } from './_lib/spotify.js'

export default async function handler(req, res) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing access token' })
  }

  const accessToken = authHeader.slice(7)

  try {
    const userId = await getSpotifyUserId(accessToken)
    const db = getDb()

    if (req.method === 'POST') {
      const { text } = req.body
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Feedback text is required' })
      }

      await db
        .collection('users')
        .doc(userId)
        .collection('tasteFeedback')
        .add({
          text: text.trim(),
          createdAt: new Date(),
        })

      return res.json({ success: true })
    }

    if (req.method === 'GET') {
      const snap = await db
        .collection('users')
        .doc(userId)
        .collection('tasteFeedback')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get()

      const feedback = snap.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      }))

      return res.json({ feedback })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Feedback error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}
