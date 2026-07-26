import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const GAP = 6

/**
 * Positions a portalled dropdown against its trigger.
 * Rendering outside the DOM tree is what keeps panels from being clipped by the
 * scrollable trainer modal / filter card, so position has to be measured manually.
 */
export function useAnchoredPanel({ maxHeight = 320, minSpace = 240 } = {}) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState(null)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  const updateRect = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - r.bottom
    const dropUp = spaceBelow < minSpace && r.top > spaceBelow
    setRect({
      left: r.left,
      width: r.width,
      top: dropUp ? undefined : r.bottom + GAP,
      bottom: dropUp ? window.innerHeight - r.top + GAP : undefined,
      maxHeight: Math.min(maxHeight, (dropUp ? r.top : spaceBelow) - 16),
    })
  }, [maxHeight, minSpace])

  useLayoutEffect(() => {
    if (!open) return undefined
    updateRect()
    const onViewportChange = () => updateRect()
    window.addEventListener('resize', onViewportChange)
    window.addEventListener('scroll', onViewportChange, true)
    return () => {
      window.removeEventListener('resize', onViewportChange)
      window.removeEventListener('scroll', onViewportChange, true)
    }
  }, [open, updateRect])

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (e) => {
      if (triggerRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const panelStyle = rect && {
    left: rect.left,
    width: rect.width,
    top: rect.top,
    bottom: rect.bottom,
    maxHeight: rect.maxHeight,
  }

  return { open, setOpen, triggerRef, panelRef, panelStyle, ready: !!rect }
}
