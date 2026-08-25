export const AUDIENCE_SOURCE_OPTIONS = [
  { value: 'all', label: 'Everyone', desc: 'Admin records + website registrations' },
  { value: 'admin', label: 'Admin added', desc: 'Profiles created in admin panel' },
  { value: 'website', label: 'Website signups', desc: 'Trainers who registered online' },
]

export function audienceSourceLabel(source = 'all') {
  return AUDIENCE_SOURCE_OPTIONS.find((o) => o.value === source)?.label || 'Everyone'
}

/** Read saved campaign audienceFilter.source; legacy admin-only saves map to "all". */
export function parseAudienceSource(audienceFilter = {}) {
  const source = String(audienceFilter?.source || '').trim()
  if (source === 'website' || source === 'admin') return source
  return 'all'
}

export function applyAudienceSource(audienceFilter = {}, audienceSource = 'all') {
  const next = { ...audienceFilter }
  if (audienceSource === 'all') delete next.source
  else next.source = audienceSource
  return next
}

export function trainerSourceLabel(source) {
  return source === 'website' ? 'Website' : 'Admin'
}
