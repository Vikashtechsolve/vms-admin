import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, 3200)
    return () => clearTimeout(t)
  }, [message, onClose])

  if (!message) return null

  return (
    <div className={`campaign-toast campaign-toast--${type}`} role="status">
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Close">×</button>
    </div>
  )
}
