import React from 'react'

const TypingIndicator = ({ username }) => {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <div className="flex items-center gap-1 bg-surface-elevated border border-surface-border px-4 py-3 rounded-2xl rounded-bl-sm">
        <span
          className="w-2 h-2 bg-gray-400 rounded-full"
          style={{ animation: 'pulseDot 1.4s ease-in-out 0s infinite' }}
        />
        <span
          className="w-2 h-2 bg-gray-400 rounded-full"
          style={{ animation: 'pulseDot 1.4s ease-in-out 0.2s infinite' }}
        />
        <span
          className="w-2 h-2 bg-gray-400 rounded-full"
          style={{ animation: 'pulseDot 1.4s ease-in-out 0.4s infinite' }}
        />
      </div>
      {username && (
        <span className="text-xs text-gray-500 mb-1">{username} is typing…</span>
      )}
    </div>
  )
}

export default TypingIndicator
