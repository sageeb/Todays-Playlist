import { getDb } from './_lib/firebase-admin.js'
import { searchTrack, getSpotifyUserId } from './_lib/spotify.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing access token' })
  }

  const accessToken = authHeader.slice(7)

  try {
    // Get user ID for personalization
    const userId = await getSpotifyUserId(accessToken)

    // Get user's taste feedback from Firestore
    let tasteFeedback = []
    try {
      const db = getDb()
      const feedbackSnap = await db
        .collection('users')
        .doc(userId)
        .collection('tasteFeedback')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get()
      tasteFeedback = feedbackSnap.docs.map(doc => doc.data().text)
    } catch {
      // Firestore may not be configured yet — continue without feedback
    }

    // Build date context
    const today = new Date()
    const monthDay = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    const fullDate = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    // Build taste context
    const tasteContext = tasteFeedback.length > 0
      ? `\n\nUser taste preferences (incorporate these):\n${tasteFeedback.map(t => `- ${t}`).join('\n')}`
      : ''

    // Call Gemini with Google Search grounding
    const geminiApiKey = process.env.GEMINI_API_KEY
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Today is ${fullDate}. Generate a playlist of exactly 20 songs for today based on:

1. Songs or albums released on ${monthDay} in any year
2. Artists born on ${monthDay}
3. Artists who died on ${monthDay}
4. Significant historical events that happened on ${monthDay} (suggest songs related to those events)
5. Current events or trending topics today
6. Mix in some variety — different genres and decades

Use web search to find accurate "this day in music history" information for ${monthDay}.
${tasteContext}

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "songs": [
    {
      "title": "exact song title",
      "artist": "exact artist name",
      "reason": "brief explanation of why this song was chosen for today",
      "searchQuery": "song title artist name"
    }
  ]
}

Rules:
- Exactly 20 songs
- Use real, well-known songs that exist on Spotify
- Each reason should explain the connection to today's date
- searchQuery should be optimized for Spotify search
- Diverse mix of genres and eras
- Prioritize songs with strong connections to today's date`
            }]
          }],
          tools: [{
            google_search: {}
          }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 4096,
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('Gemini API error:', errText)
      return res.status(502).json({ error: 'Failed to generate suggestions' })
    }

    const geminiData = await geminiRes.json()

    // Extract text from Gemini response
    let responseText = ''
    for (const candidate of geminiData.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.text) {
          responseText += part.text
        }
      }
    }

    // Parse JSON from response (handle possible markdown code blocks)
    let parsed
    try {
      // Try direct parse first
      parsed = JSON.parse(responseText)
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim())
      } else {
        // Try finding JSON object in text
        const objMatch = responseText.match(/\{[\s\S]*\}/)
        if (objMatch) {
          parsed = JSON.parse(objMatch[0])
        } else {
          throw new Error('Could not parse Gemini response')
        }
      }
    }

    const suggestions = parsed.songs || []

    // Search Spotify for each suggestion (in parallel, batched)
    const enrichedSongs = await Promise.all(
      suggestions.map(async (song) => {
        const spotifyData = await searchTrack(song.searchQuery || `${song.title} ${song.artist}`, accessToken)
        return {
          title: song.title,
          artist: song.artist,
          reason: song.reason,
          ...(spotifyData || {}),
        }
      })
    )

    // Filter out songs that weren't found on Spotify
    const validSongs = enrichedSongs.filter(s => s.spotifyUri)

    res.json({ songs: validSongs })
  } catch (err) {
    console.error('Suggestions error:', err)
    res.status(500).json({ error: 'Failed to generate playlist suggestions' })
  }
}
