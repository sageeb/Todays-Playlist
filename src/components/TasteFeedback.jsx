import { useState } from 'react'

export default function TasteFeedback({ onSubmit }) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return

    setSubmitting(true)
    await onSubmit(text.trim())
    setText('')
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="e.g. I love jazz, no country please..."
        disabled={submitting}
        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors"
      />
      <button
        type="submit"
        disabled={submitting || !text.trim()}
        className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
      >
        {submitting ? '...' : 'Save'}
      </button>
    </form>
  )
}
