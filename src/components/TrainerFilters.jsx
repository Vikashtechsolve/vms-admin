import { useMemo, useState } from 'react'
import MultiSelect from './MultiSelect.jsx'
import ChipGroup from './ChipGroup.jsx'
import { useLocationOptions } from '../hooks/useLocationOptions.js'

export const EMPTY_FILTERS = {
  q: '',
  states: [],
  cities: [],
  skills: [],
  skillsMatch: 'any',
  qualifications: [],
  workTypes: [],
  modes: [],
  status: [],
  minRating: '',
  experience: '',
  sort: 'newest',
}

export const WORK_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
]

export const MODE_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
]

export const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'not_available', label: 'Not Available' },
  { value: 'unset', label: 'Not set' },
]

export const RATING_OPTIONS = [
  { value: '9', label: '9+' },
  { value: '8', label: '8+' },
  { value: '7', label: '7+' },
  { value: '6', label: '6+' },
  { value: '5', label: '5+' },
]

export const EXPERIENCE_OPTIONS = [
  { value: '0-2', label: '0–2 yrs' },
  { value: '2-5', label: '2–5 yrs' },
  { value: '5-10', label: '5–10 yrs' },
  { value: '10-', label: '10+ yrs' },
]

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'rating_desc', label: 'Rating: high to low' },
  { value: 'experience_desc', label: 'Experience: high to low' },
  { value: 'name_asc', label: 'Name: A to Z' },
]

/** Filters that narrow the list, ignoring search text and sort order. */
export function countActiveFilters(filters) {
  return (
    filters.states.length +
    filters.cities.length +
    filters.skills.length +
    filters.qualifications.length +
    filters.workTypes.length +
    filters.modes.length +
    filters.status.length +
    (filters.minRating ? 1 : 0) +
    (filters.experience ? 1 : 0)
  )
}

export default function TrainerFilters({ filters, onChange, options, loading, resultCount }) {
  const [expanded, setExpanded] = useState(false)
  const { states: allStates } = useLocationOptions()

  const activeCount = countActiveFilters(filters)

  const set = (patch) => onChange({ ...filters, ...patch })

  // Only states that actually have trainers, ordered by the canonical list first
  // so the panel still works if the location list fails to load.
  const stateOptions = useMemo(() => {
    const counts = new Map()
    ;(options.cities || []).forEach((c) => {
      counts.set(c.state, (counts.get(c.state) || 0) + c.count)
    })
    const canonical = allStates.map((s) => s.state).filter((s) => counts.has(s))
    const extras = [...counts.keys()].filter((s) => !canonical.includes(s)).sort()
    return [...canonical, ...extras].map((state) => ({ value: state, label: state, count: counts.get(state) }))
  }, [allStates, options.cities])

  // Cities narrow to the chosen states so the two location filters stay coherent.
  const cityOptions = useMemo(() => {
    const list = options.cities || []
    const scoped = filters.states.length ? list.filter((c) => filters.states.includes(c.state)) : list
    return scoped.map((c) => ({ value: c.value, label: c.label, group: c.state, count: c.count }))
  }, [options.cities, filters.states])

  function handleStates(nextStates) {
    const allowed = new Set(
      (options.cities || []).filter((c) => !nextStates.length || nextStates.includes(c.state)).map((c) => c.value)
    )
    set({ states: nextStates, cities: filters.cities.filter((c) => allowed.has(c)) })
  }

  const activeChips = [
    ...filters.states.map((v) => ({ key: `state-${v}`, label: v, clear: () => handleStates(filters.states.filter((s) => s !== v)) })),
    ...filters.cities.map((v) => ({ key: `city-${v}`, label: v, clear: () => set({ cities: filters.cities.filter((c) => c !== v) }) })),
    ...filters.skills.map((v) => ({
      key: `skill-${v}`,
      label: options.skills?.find((s) => s.value === v)?.label || v,
      clear: () => set({ skills: filters.skills.filter((s) => s !== v) }),
    })),
    ...filters.qualifications.map((v) => ({
      key: `qual-${v}`,
      label: options.qualifications?.find((s) => s.value === v)?.label || v,
      clear: () => set({ qualifications: filters.qualifications.filter((s) => s !== v) }),
    })),
    ...filters.workTypes.map((v) => ({
      key: `work-${v}`,
      label: WORK_TYPE_OPTIONS.find((o) => o.value === v)?.label || v,
      clear: () => set({ workTypes: filters.workTypes.filter((s) => s !== v) }),
    })),
    ...filters.modes.map((v) => ({
      key: `mode-${v}`,
      label: MODE_OPTIONS.find((o) => o.value === v)?.label || v,
      clear: () => set({ modes: filters.modes.filter((s) => s !== v) }),
    })),
    ...filters.status.map((v) => ({
      key: `status-${v}`,
      label: STATUS_OPTIONS.find((o) => o.value === v)?.label || v,
      clear: () => set({ status: filters.status.filter((s) => s !== v) }),
    })),
    ...(filters.minRating ? [{ key: 'rating', label: `Rating ${filters.minRating}+`, clear: () => set({ minRating: '' }) }] : []),
    ...(filters.experience
      ? [{
          key: 'experience',
          label: EXPERIENCE_OPTIONS.find((o) => o.value === filters.experience)?.label || filters.experience,
          clear: () => set({ experience: '' }),
        }]
      : []),
  ]

  return (
    <section className="trainer-filters">
      <div className="trainer-filters-bar">
        <div className="trainer-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search by name, email, mobile, city or skill…"
            aria-label="Search trainers"
          />
        </div>

        <label className="trainer-sort">
          <span>Sort</span>
          <select value={filters.sort} onChange={(e) => set({ sort: e.target.value })}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={`trainer-filters-toggle${expanded ? ' trainer-filters-toggle--open' : ''}`}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="7" y1="12" x2="17" y2="12" />
            <line x1="10" y1="17" x2="14" y2="17" />
          </svg>
          Filters
          {activeCount > 0 && <span className="trainer-filters-badge">{activeCount}</span>}
        </button>
      </div>

      {(activeChips.length > 0 || filters.q) && (
        <div className="trainer-active-filters">
          <span className="trainer-active-count">
            {loading ? 'Searching…' : `${resultCount} match${resultCount === 1 ? '' : 'es'}`}
          </span>
          {activeChips.map((chip) => (
            <button key={chip.key} type="button" className="active-chip" onClick={chip.clear}>
              {chip.label}
              <span aria-hidden="true">✕</span>
            </button>
          ))}
          <button type="button" className="trainer-clear-all" onClick={() => onChange({ ...EMPTY_FILTERS, sort: filters.sort })}>
            Clear all
          </button>
        </div>
      )}

      {expanded && (
        <div className="trainer-filters-panel">
          <div className="filter-field">
            <span className="filter-label">State</span>
            <MultiSelect values={filters.states} onChange={handleStates} options={stateOptions} placeholder="Any state" searchPlaceholder="Search state…" />
          </div>

          <div className="filter-field">
            <span className="filter-label">City</span>
            <MultiSelect
              values={filters.cities}
              onChange={(cities) => set({ cities })}
              options={cityOptions}
              placeholder="Any city"
              searchPlaceholder="Search city…"
              emptyMessage="No city for this state"
            />
          </div>

          <div className="filter-field">
            <span className="filter-label">
              Skills
              <label className="filter-inline-toggle">
                <input
                  type="checkbox"
                  checked={filters.skillsMatch === 'all'}
                  onChange={(e) => set({ skillsMatch: e.target.checked ? 'all' : 'any' })}
                />
                Match all
              </label>
            </span>
            <MultiSelect
              values={filters.skills}
              onChange={(skills) => set({ skills })}
              options={options.skills || []}
              placeholder="Any skill"
              searchPlaceholder="Search skill…"
            />
          </div>

          <div className="filter-field">
            <span className="filter-label">Qualification</span>
            <MultiSelect
              values={filters.qualifications}
              onChange={(qualifications) => set({ qualifications })}
              options={options.qualifications || []}
              placeholder="Any qualification"
              searchPlaceholder="Search qualification…"
            />
          </div>

          <div className="filter-field">
            <span className="filter-label">Work type</span>
            <ChipGroup multiple options={WORK_TYPE_OPTIONS} values={filters.workTypes} onChange={(workTypes) => set({ workTypes })} />
          </div>

          <div className="filter-field">
            <span className="filter-label">Mode</span>
            <ChipGroup multiple options={MODE_OPTIONS} values={filters.modes} onChange={(modes) => set({ modes })} />
          </div>

          <div className="filter-field">
            <span className="filter-label">Availability</span>
            <ChipGroup multiple options={STATUS_OPTIONS} values={filters.status} onChange={(status) => set({ status })} />
          </div>

          <div className="filter-field">
            <span className="filter-label">Minimum rating</span>
            <ChipGroup options={RATING_OPTIONS} value={filters.minRating} onChange={(minRating) => set({ minRating })} />
          </div>

          <div className="filter-field">
            <span className="filter-label">Experience</span>
            <ChipGroup options={EXPERIENCE_OPTIONS} value={filters.experience} onChange={(experience) => set({ experience })} />
          </div>
        </div>
      )}
    </section>
  )
}
