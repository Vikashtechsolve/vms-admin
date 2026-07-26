import { useLocationOptions, citiesForState } from '../hooks/useLocationOptions.js'
import SearchableSelect from './SearchableSelect.jsx'

/**
 * State + city pickers backed by the shared canonical list, so every trainer
 * record stores the same spelling and location filtering stays reliable.
 */
export default function LocationSelect({ state, city, legacyLocation, onChange, disabled }) {
  const { states, loading } = useLocationOptions()
  const cities = citiesForState(states, state)
  const showLegacyHint = !city && !!legacyLocation?.trim()

  const stateOptions = states.map((s) => ({ value: s.state, label: s.state }))
  const cityOptions = cities.map((c) => ({ value: c, label: c }))

  function handleState(nextState) {
    const nextCities = citiesForState(states, nextState)
    onChange({ state: nextState, city: nextCities.includes(city) ? city : '' })
  }

  return (
    <>
      <label>
        <span>State</span>
        <SearchableSelect
          value={state || ''}
          onChange={handleState}
          options={stateOptions}
          placeholder={loading ? 'Loading states…' : 'Select state'}
          searchPlaceholder="Search state…"
          emptyMessage="No state found"
          disabled={disabled || loading}
          allowClear
        />
      </label>
      <label>
        <span>City</span>
        <SearchableSelect
          value={city || ''}
          onChange={(nextCity) => onChange({ state, city: nextCity })}
          options={cityOptions}
          placeholder={state ? 'Select city' : 'Select state first'}
          searchPlaceholder="Search city…"
          emptyMessage="No city found"
          disabled={disabled || loading || !state}
          allowClear
        />
        {showLegacyHint && (
          <span className="field-hint field-hint--checking">
            Saved as “{legacyLocation}” — pick a city to standardise it.
          </span>
        )}
      </label>
    </>
  )
}
