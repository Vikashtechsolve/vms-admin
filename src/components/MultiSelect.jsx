import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAnchoredPanel } from '../hooks/useAnchoredPanel.js'

/**
 * Multi-choice dropdown with search, used for skills, qualifications and cities.
 * Selected values stay pinned to the top of the list so long lists remain usable.
 */
export default function MultiSelect({
  values = [],
  onChange,
  options,
  placeholder = 'Any',
  searchPlaceholder = 'Type to search…',
  emptyMessage = 'No matches found',
  disabled = false,
  showCounts = true,
}) {
  const { open, setOpen, triggerRef, panelRef, panelStyle, ready } = useAnchoredPanel({ maxHeight: 340 })
  const [query, setQuery] = useState('')
  const searchRef = useRef(null)

  const selectedSet = useMemo(() => new Set(values), [values])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? options.filter((o) => o.label.toLowerCase().includes(q) || (o.group || '').toLowerCase().includes(q))
      : options
    return [...list].sort((a, b) => Number(selectedSet.has(b.value)) - Number(selectedSet.has(a.value)))
  }, [options, query, selectedSet])

  useEffect(() => {
    if (!open) return
    setQuery('')
    requestAnimationFrame(() => searchRef.current?.focus())
  }, [open])

  function toggle(value) {
    onChange(selectedSet.has(value) ? values.filter((v) => v !== value) : [...values, value])
  }

  const selectedLabels = options.filter((o) => selectedSet.has(o.value)).map((o) => o.label)
  const summary = selectedLabels.length === 0
    ? placeholder
    : selectedLabels.length === 1
      ? selectedLabels[0]
      : `${selectedLabels[0]} +${selectedLabels.length - 1}`

  return (
    <div
      className="ss-wrap"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.preventDefault()
          setOpen(false)
          triggerRef.current?.focus()
        }
      }}
    >
      <button
        type="button"
        ref={triggerRef}
        className={`ss-trigger${open ? ' ss-trigger--open' : ''}${selectedLabels.length ? '' : ' ss-trigger--empty'}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="ss-value">{summary}</span>
        {selectedLabels.length > 1 && <span className="ss-count">{selectedLabels.length}</span>}
        {selectedLabels.length > 0 && !disabled && (
          <span
            className="ss-clear"
            role="button"
            tabIndex={-1}
            aria-label="Clear selection"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
            onClick={(e) => { e.stopPropagation(); onChange([]) }}
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
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>

          <ul className="ss-list" role="listbox" aria-multiselectable="true">
            {filtered.length === 0 && <li className="ss-empty">{emptyMessage}</li>}
            {filtered.map((option) => {
              const checked = selectedSet.has(option.value)
              return (
                <li key={option.value}>
                  <div
                    role="option"
                    aria-selected={checked}
                    className={`ss-option ss-option--check${checked ? ' ss-option--selected' : ''}`}
                    onClick={() => toggle(option.value)}
                  >
                    <span className={`ss-checkbox${checked ? ' ss-checkbox--on' : ''}`} aria-hidden="true">
                      {checked && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                    <span className="ss-option-label">
                      {option.label}
                      {option.group && <small className="ss-option-group">{option.group}</small>}
                    </span>
                    {showCounts && option.count != null && <span className="ss-option-count">{option.count}</span>}
                  </div>
                </li>
              )
            })}
          </ul>

          {values.length > 0 && (
            <div className="ss-panel-footer">
              <span>{values.length} selected</span>
              <button type="button" onClick={() => onChange([])}>Clear</button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
