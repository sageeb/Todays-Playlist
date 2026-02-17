export default function FeedbackHistory({ feedback }) {
  if (!feedback || feedback.length === 0) return null

  return (
    <div className="mb-4 space-y-2">
      {feedback.map((item, i) => (
        <div
          key={i}
          className="bg-white/5 rounded-lg px-3 py-2 text-sm text-gray-400"
        >
          {item.text}
        </div>
      ))}
    </div>
  )
}
