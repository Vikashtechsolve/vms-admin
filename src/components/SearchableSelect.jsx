import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAnchoredPanel } from '../hooks/useAnchoredPanel.js'

function matches(option, query) {
  if (!query) return true
  const q = query.toLowerCase()
  return option.label.toLowerCase().includes(q) || (option.group || '').toLowerCase().includes(q)
}

/** Single-choice dropdown with type-to-filter search. */
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select',
  searchPlaceholder = 'Type to search…',
  emptyMessage = 'No matches found',
  disabled = false,
  allowClear = false,
  id,
}) {
  const { open, setOpen, triggerRef, panelRef, panelStyle, ready } = useAnchoredPanel()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const searchRef = useRef(null)
  const listRef = useRef(null)

  const selected = options.find((o) => o.value === value) || null
  const filtered = useMemo(() => options.filter((o) => matches(o, query)), [options, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    const index = options.findIndex((o) => o.value === value)
    setActiveIndex(index >= 0 ? index : 0)
    requestAnimationFrame(() => searchRef.current?.focus())
  }, [open, options, value])

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex, query])

  function commit(option) {
    onChange(option ? option.value : '')
    setOpen(false)
    triggerRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      if (open) {
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
      return
    }
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[activeIndex]) commit(filtered[activeIndex])
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  let lastGroup = null

  return (
    <div className="ss-wrap" onKeyDown={handleKeyDown}>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className={`ss-trigger${open ? ' ss-trigger--open' : ''}${selected ? '' : ' ss-trigger--empty'}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="ss-value">{selected ? selected.label : placeholder}</span>
        {allowClear && selected && !disabled && (
          <span
            className="ss-clear"
            role="button"
            tabIndex={-1}
            aria-label="Clear selection"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
            onClick={(e) => { e.stopPropagation(); commit(null) }}
          >
            ✕
          </span>
        )}
        <svg className="ss-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && ready && createPortal(
        <div ref={panelRef} className="ss-panel" style={panelStyle}>
          <div className="ss-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={query}
              placeholder={searchPlaceholder}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
              autoComplete="off"
            />
          </div>

          <ul className="ss-list" ref={listRef} role="listbox">
            {filtered.length === 0 && <li className="ss-empty">{emptyMessage}</li>}
            {filtered.map((option, i) => {
              const showGroup = option.group && option.group !== lastGroup
              lastGroup = option.group
              return (
                <li key={`${option.group || ''}-${option.value}`}>
                  {showGroup && <div className="ss-group">{option.group}</div>}
                  <div
                    role="option"
                    aria-selected={option.value === value}
                    data-active={i === activeIndex}
                    className={`ss-option${option.value === value ? ' ss-option--selected' : ''}${i === activeIndex ? ' ss-option--active' : ''}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => commit(option)}
                  >
                    <span>{option.label}</span>
                    {option.value === value && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>,
        document.body
      )}
    </div>
  )
}
