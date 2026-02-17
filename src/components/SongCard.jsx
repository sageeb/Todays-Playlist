export default function SongCard({ song, checked, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
        checked
          ? 'bg-green-500/10 border border-green-500/30'
          : 'bg-white/5 border border-transparent hover:bg-white/8'
      }`}
    >
      {/* Checkbox */}
      <div className="pt-1 shrink-0">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            checked
              ? 'bg-green-500 border-green-500'
              : 'border-gray-600'
          }`}
        >
          {checked && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>

      {/* Album art */}
      {song.albumArt ? (
        <img
          src={song.albumArt}
          alt=""
          className="w-12 h-12 rounded-lg shrink-0 object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg shrink-0 bg-white/10 flex items-center justify-center text-lg">
          🎵
        </div>
      )}

      {/* Song info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{song.title}</p>
        <p className="text-xs text-gray-400 truncate">{song.artist}</p>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{song.reason}</p>
      </div>
    </div>
  )
}
