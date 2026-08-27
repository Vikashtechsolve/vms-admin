/** Reverse audienceFilter query params back into TrainerFilters UI state. */
export function audienceFilterToFilters(af = {}) {
  const filters = {
    q: af.q || '',
    states: af.state ? String(af.state).split(',').filter(Boolean) : [],
    cities: af.city ? String(af.city).split(',').filter(Boolean) : [],
    skills: af.skills ? String(af.skills).split(',').filter(Boolean) : [],
    skillsMatch: af.skillsMatch || 'any',
    tags: af.tags ? String(af.tags).split(',').filter(Boolean) : [],
    tagsMatch: af.tagsMatch || 'any',
    qualifications: af.qualifications ? String(af.qualifications).split(',').filter(Boolean) : [],
    workTypes: af.workTypes ? String(af.workTypes).split(',').filter(Boolean) : [],
    modes: af.modes ? String(af.modes).split(',').filter(Boolean) : [],
    status: af.status ? String(af.status).split(',').filter(Boolean) : [],
    minRating: af.minRating || '',
    experience: '',
    sort: 'newest',
  }

  if (af.minExperience != null || af.maxExperience != null) {
    const min = af.minExperience ?? ''
    const max = af.maxExperience ?? ''
    if (min === '10' && !max) filters.experience = '10-'
    else if (min && max) filters.experience = `${min}-${max}`
    else if (min) filters.experience = `${min}-`
  }

  return filters
}
