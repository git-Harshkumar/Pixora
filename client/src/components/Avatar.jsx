import React from 'react'

const Avatar = ({ src, username, size = 'md', className = '' }) => {
  const sizes = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  }

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : '??'

  if (src) {
    return (
      <img
        src={src}
        alt={username}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-surface-border shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-brand-600 flex items-center justify-center font-bold text-white shrink-0 ${className}`}
    >
      {initials}
    </div>
  )
}

export default Avatar
