/**
 * Pill toggles for short option sets (work type, mode, availability, rating,
 * experience). `multiple` toggles values in an array, otherwise it behaves like
 * a radio group where re-clicking the active pill clears it.
 */
export default function ChipGroup({ options, value, values = [], onChange, multiple = false, disabled = false }) {
  const isActive = (optionValue) => (multiple ? values.includes(optionValue) : value === optionValue)

  function handleClick(optionValue) {
    if (multiple) {
      onChange(values.includes(optionValue) ? values.filter((v) => v !== optionValue) : [...values, optionValue])
    } else {
      onChange(value === optionValue ? '' : optionValue)
    }
  }

  return (
    <div className="chip-group" role="group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          aria-pressed={isActive(option.value)}
          className={`filter-chip${isActive(option.value) ? ' filter-chip--on' : ''}`}
          onClick={() => handleClick(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
