/** Maps TrainerFilters UI state to backend audienceFilter / query params. */
export function filtersToAudienceFilter(filters) {
  const [minExperience, maxExperience] = filters.experience
    ? filters.experience.split('-')
    : ['', '']

  const params = { source: 'admin' }
  if (filters.q?.trim()) params.q = filters.q.trim()
  if (filters.states?.length) params.state = filters.states.join(',')
  if (filters.cities?.length) params.city = filters.cities.join(',')
  if (filters.skills?.length) {
    params.skills = filters.skills.join(',')
    params.skillsMatch = filters.skillsMatch
  }
  if (filters.qualifications?.length) params.qualifications = filters.qualifications.join(',')
  if (filters.workTypes?.length) params.workTypes = filters.workTypes.join(',')
  if (filters.modes?.length) params.modes = filters.modes.join(',')
  if (filters.status?.length) params.status = filters.status.join(',')
  if (filters.minRating) params.minRating = filters.minRating
  if (minExperience) params.minExperience = minExperience
  if (maxExperience) params.maxExperience = maxExperience
  return params
}

export function toQueryParams(filters, page, pageSize, source = 'admin') {
  const audience = filtersToAudienceFilter(filters)
  return { ...audience, page, limit: pageSize, sort: filters.sort || 'newest', source }
}
