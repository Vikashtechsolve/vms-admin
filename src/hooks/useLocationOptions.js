import { useEffect, useState } from 'react'
import { getLocationOptions } from '../services/api.js'

// The list never changes at runtime, so one fetch is shared by every mounted picker.
let cache = null
let inflight = null

function load() {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = getLocationOptions()
      .then((data) => {
        cache = Array.isArray(data?.states) ? data.states : []
        return cache
      })
      .catch(() => {
        inflight = null
        return []
      })
  }
  return inflight
}

export function useLocationOptions() {
  const [states, setStates] = useState(cache || [])
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    if (cache) return undefined
    let active = true
    load().then((list) => {
      if (!active) return
      setStates(list)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  return { states, loading }
}

export function citiesForState(states, stateName) {
  return states.find((s) => s.state === stateName)?.cities || []
}

/** Every city across all states, used for the trainer list filter. */
export function allCities(states) {
  return states.flatMap((s) => s.cities)
}
