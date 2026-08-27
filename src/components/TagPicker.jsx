import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAnchoredPanel } from '../hooks/useAnchoredPanel.js'
import { createTrainerTag, getTrainerTags, searchTrainerTags } from '../services/api.js'

function normalizeQuery(value) {
  return String(value || '').trim().toLowerCase()
}

/** Mirrors backend alias key so "Mern" matches "MERN Stack". */
function tagAliasKey(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/\bstack\b/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function tagMatches(tag, query) {
  const q = normalizeQuery(query)
  if (!q) return true
  const qKey = tagAliasKey(query)
  return (
    tag.name.toLowerCase().includes(q) ||
    tag.slug.includes(q.replace(/\s+/g, '-')) ||
    (qKey && tagAliasKey(tag.name) === qKey) ||
    (tag.aliases || []).some((alias) => alias.toLowerCase().includes(q))
  )
}

function HighlightMatch({ text, query }) {
  const q = query.trim()
  if (!q) return text
  const lower = text.toLowerCase()
  const idx = lower.indexOf(q.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="tag-picker-mark">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

export default function TagPicker({
  value = [],
  onChange,
  disabled = false,
  label = 'Tags',
  hint = 'Search existing tags or create a new one. Duplicates like "Mern" and "MERN Stack" are merged.',
}) {
  const [query, setQuery] = useState('')
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const searchTimerRef = useRef(null)
  const { open, setOpen, triggerRef, panelRef, panelStyle, ready } = useAnchoredPanel({ maxHeight: 280 })

  const selectedSet = useMemo(() => new Set(value), [value])
  const catalogBySlug = useMemo(() => new Map(catalog.map((t) => [t.slug, t])), [catalog])

  const refreshCatalog = useCallback(async () => {
    try {
      const data = await getTrainerTags()
      if (Array.isArray(data)) setCatalog(data)
    } catch {
      /* keep existing catalog */
    }
  }, [])

  useEffect(() => {
    refreshCatalog()
  }, [refreshCatalog])

  useEffect(() => {
    if (!value.length) return
    searchTrainerTags('')
      .then((data) => {
        if (!Array.isArray(data)) return
        setCatalog((prev) => {
          const merged = new Map([...prev, ...data].map((t) => [t.slug, t]))
          return [...merged.values()]
        })
      })
      .catch(() => {})
  }, [value])

  const queryKey = tagAliasKey(query)
  const exactMatch = useMemo(
    () => catalog.find(
      (s) =>
        !selectedSet.has(s.slug) && (
          normalizeQuery(s.name) === normalizeQuery(query) ||
          normalizeQuery(s.slug) === normalizeQuery(query).replace(/\s+/g, '-') ||
          (queryKey && tagAliasKey(s.name) === queryKey)
        )
    ),
    [catalog, query, queryKey, selectedSet]
  )

  const suggestions = useMemo(() => {
    const matched = catalog
      .filter((tag) => !selectedSet.has(tag.slug) && tagMatches(tag, query))
      .sort((a, b) => (b.trainerCount || 0) - (a.trainerCount || 0) || a.name.localeCompare(b.name))
    if (!exactMatch) return matched
    return matched.filter((tag) => tag.slug !== exactMatch.slug)
  }, [catalog, query, selectedSet, exactMatch])

  const showCreate = !!query.trim() && !exactMatch
  const optionCount = suggestions.length + (exactMatch ? 1 : 0) + (showCreate ? 1 : 0)

  useEffect(() => {
    if (!open) return
    setActiveIndex(0)
  }, [open, query])

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex, suggestions.length, showCreate])

  useEffect(() => () => {
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current)
  }, [])

  function openPanel() {
    if (disabled) return
    setOpen(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function addSlug(slug) {
    if (!slug || selectedSet.has(slug)) return
    onChange([...value, slug])
    setQuery('')
    setError('')
    setActiveIndex(0)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function removeSlug(slug) {
    onChange(value.filter((s) => s !== slug))
  }

  function removeLast() {
    if (query.trim() || !value.length) return
    onChange(value.slice(0, -1))
  }

  async function handleCreate() {
    const name = query.trim()
    if (!name || creating) return
    setCreating(true)
    setError('')
    try {
      const tag = await createTrainerTag(name)
      setCatalog((prev) => {
        const merged = new Map([...prev, tag].map((t) => [t.slug, t]))
        return [...merged.values()]
      })
      addSlug(tag.slug)
    } catch (err) {
      const existing = err.response?.data?.existing
      if (existing?.slug) {
        setCatalog((prev) => {
          const merged = new Map([...prev, existing].map((t) => [t.slug, t]))
          return [...merged.values()]
        })
        addSlug(existing.slug)
        setError(`Using existing tag "${existing.name}"`)
      } else {
        setError(err.response?.data?.error || 'Could not create tag')
      }
    } finally {
      setCreating(false)
    }
  }

  function selectByIndex(index) {
    let cursor = 0
    if (exactMatch) {
      if (index === cursor) {
        addSlug(exactMatch.slug)
        return
      }
      cursor += 1
    }
    for (const tag of suggestions) {
      if (index === cursor) {
        addSlug(tag.slug)
        return
      }
      cursor += 1
    }
    if (showCreate && index === cursor) handleCreate()
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      if (open) {
        e.preventDefault()
        setOpen(false)
      }
      return
    }

    if (e.key === 'Backspace') {
      removeLast()
      return
    }

    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault()
      openPanel()
      return
    }

    if (!open) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, Math.max(optionCount - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (optionCount > 0) selectByIndex(activeIndex)
      else if (query.trim()) handleCreate()
    }
  }

  const selectedLabels = value.map((slug) => ({
    slug,
    name: catalogBySlug.get(slug)?.name || slug,
  }))

  let optionCursor = 0

  return (
    <div className="tag-picker">
      <span className="tag-picker-label">{label}</span>
      {hint && <p className="tag-picker-hint">{hint}</p>}

      <div
        ref={triggerRef}
        className={`tag-picker-combo${open ? ' tag-picker-combo--open' : ''}${disabled ? ' tag-picker-combo--disabled' : ''}`}
        onMouseDown={(e) => {
          if (disabled) return
          if (e.target.closest('.trainer-tag-chip-remove')) return
          e.preventDefault()
          openPanel()
        }}
      >
        {selectedLabels.map(({ slug, name }) => (
          <span key={slug} className="trainer-tag-chip">
            {name}
            {!disabled && (
              <button
                type="button"
                className="trainer-tag-chip-remove"
                onClick={(e) => {
                  e.stopPropagation()
                  removeSlug(slug)
                }}
                aria-label={`Remove ${name}`}
              >
                ×
              </button>
            )}
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          className="tag-picker-combo-input"
          value={query}
          disabled={disabled}
          placeholder={value.length ? 'Search or add tag…' : 'Type to search tags (AIML, MERN Stack, DSA…)'}
          onChange={(e) => {
            setQuery(e.target.value)
            setError('')
            if (!open) setOpen(true)
            const next = e.target.value
            if (next.trim()) setLoading(true)
            if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current)
            searchTimerRef.current = window.setTimeout(async () => {
              if (!next.trim()) {
                setLoading(false)
                return
              }
              try {
                const data = await searchTrainerTags(next)
                if (Array.isArray(data) && data.length) {
                  setCatalog((prev) => {
                    const merged = new Map([...prev, ...data].map((t) => [t.slug, t]))
                    return [...merged.values()]
                  })
                }
              } catch {
                /* local filter still works */
              } finally {
                setLoading(false)
              }
            }, 120)
          }}
          onFocus={() => !disabled && setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
        />

        {loading && <span className="tag-picker-combo-spinner" aria-hidden="true" />}
      </div>

      {error && <p className="tag-picker-error" role="alert">{error}</p>}

      {open && ready && createPortal(
        <div ref={panelRef} className="tag-picker-panel" style={panelStyle}>
          <ul className="tag-picker-list" ref={listRef} role="listbox">
            {!query.trim() && suggestions.length > 0 && (
              <li className="tag-picker-list-hint">Popular tags — pick one or keep typing</li>
            )}

            {query.trim() && suggestions.length === 0 && !exactMatch && !showCreate && (
              <li className="tag-picker-empty">No matching tags</li>
            )}

            {exactMatch && (() => {
              const idx = optionCursor++
              return (
                <li key={`exact-${exactMatch.slug}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={activeIndex === idx}
                    data-active={activeIndex === idx}
                    className={`tag-picker-suggestion${activeIndex === idx ? ' tag-picker-suggestion--active' : ''}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => addSlug(exactMatch.slug)}
                  >
                    <span className="tag-picker-suggestion-label">
                      <HighlightMatch text={exactMatch.name} query={query} />
                    </span>
                    <span className="tag-picker-suggestion-meta">Existing tag</span>
                  </button>
                </li>
              )
            })()}

            {suggestions.map((tag) => {
              const idx = optionCursor++
              return (
                <li key={tag.slug}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={activeIndex === idx}
                    data-active={activeIndex === idx}
                    className={`tag-picker-suggestion${activeIndex === idx ? ' tag-picker-suggestion--active' : ''}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => addSlug(tag.slug)}
                  >
                    <span className="tag-picker-suggestion-label">
                      <HighlightMatch text={tag.name} query={query} />
                    </span>
                    {tag.trainerCount > 0 && (
                      <span className="tag-picker-suggestion-meta">{tag.trainerCount} trainers</span>
                    )}
                  </button>
                </li>
              )
            })}

            {showCreate && (() => {
              const idx = optionCursor++
              return (
                <li key="create" className="tag-picker-create-row">
                  <button
                    type="button"
                    role="option"
                    aria-selected={activeIndex === idx}
                    data-active={activeIndex === idx}
                    className={`tag-picker-suggestion tag-picker-suggestion--create${activeIndex === idx ? ' tag-picker-suggestion--active' : ''}`}
                    disabled={creating}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={handleCreate}
                  >
                    <span className="tag-picker-suggestion-label">
                      {creating ? 'Creating…' : `Create "${query.trim()}"`}
                    </span>
                    <span className="tag-picker-suggestion-meta">New tag</span>
                  </button>
                </li>
              )
            })()}
          </ul>
        </div>,
        document.body
      )}
    </div>
  )
}
