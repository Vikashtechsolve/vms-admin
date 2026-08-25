import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getCampaign,
  createCampaign,
  updateCampaign,
  getEmailLayouts,
  previewCampaignAudience,
  previewCampaignEmail,
  testSendCampaign,
  sendCampaign,
  getTrainers,
  getTrainerFilterOptions,
} from '../services/api.js'
import RichTextEditor from '../components/RichTextEditor.jsx'
import TrainerFilters, { EMPTY_FILTERS } from '../components/TrainerFilters.jsx'
import TrainerPagination, { readStoredPageSize, storePageSize } from '../components/TrainerPagination.jsx'
import CampaignToast from '../components/CampaignToast.jsx'
import { filtersToAudienceFilter, buildCampaignAudienceFilter, toQueryParams } from '../utils/trainerQueryParams.js'
import { audienceFilterToFilters } from '../utils/audienceFilterToFilters.js'
import {
  AUDIENCE_SOURCE_OPTIONS,
  audienceSourceLabel,
  parseAudienceSource,
  trainerSourceLabel,
} from '../utils/audienceSource.js'

const STEPS = [
  { id: 'content', label: 'Content', desc: 'Subject, body & layout' },
  { id: 'audience', label: 'Audience', desc: 'Who receives this' },
  { id: 'review', label: 'Review & Send', desc: 'Confirm and send' },
]

const SKIP_REASON_LABELS = {
  no_email: 'No email on record',
  opt_out: 'Opted out of email',
  unsubscribed: 'Unsubscribed',
  ineligible: 'Not eligible',
}

function StepIcon({ index, active, done }) {
  return (
    <span className={`compose-step-num ${active ? 'active' : ''} ${done ? 'done' : ''}`} aria-hidden="true">
      {done ? '✓' : index}
    </span>
  )
}

export default function CampaignCompose() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [step, setStep] = useState('content')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [layoutId, setLayoutId] = useState('')
  const [layouts, setLayouts] = useState([])
  const [layoutsLoading, setLayoutsLoading] = useState(true)
  const [selectionMode, setSelectionMode] = useState('filter')
  const [audienceSource, setAudienceSource] = useState('all')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [filterOptions, setFilterOptions] = useState({ skills: [], qualifications: [], cities: [] })
  const [excludedIds, setExcludedIds] = useState(new Set())
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [audienceSummary, setAudienceSummary] = useState(null)
  const [audienceLoading, setAudienceLoading] = useState(false)
  const [trainers, setTrainers] = useState([])
  const [trainersLoading, setTrainersLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(readStoredPageSize)
  const [listMeta, setListMeta] = useState({ total: 0, pages: 1 })
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const audienceSeq = useRef(0)
  const trainerSeq = useRef(0)

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  useEffect(() => {
    setLayoutsLoading(true)
    getEmailLayouts()
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setLayouts(list)
        const def = list.find((l) => l.isDefault) || list[0]
        if (def) setLayoutId((prev) => prev || def.id)
      })
      .catch(() => setLayouts([]))
      .finally(() => setLayoutsLoading(false))

    getTrainerFilterOptions(
      audienceSource === 'all' ? {} : { source: audienceSource }
    ).then(setFilterOptions).catch(() => {})
  }, [audienceSource])

  useEffect(() => {
    if (isNew) return
    setLoading(true)
    getCampaign(id)
      .then((c) => {
        if (c.status !== 'draft') {
          navigate(`/campaigns/${id}`)
          return
        }
        setSubject(c.subject || '')
        setBodyHtml(c.bodyHtml || '')
        if (c.layoutId) setLayoutId(c.layoutId)
        setSelectionMode(c.selectionMode || 'filter')
        if (c.audienceFilter) {
          setAudienceSource(parseAudienceSource(c.audienceFilter))
          if (c.selectionMode === 'filter') {
            setFilters(audienceFilterToFilters(c.audienceFilter))
          }
        }
        setExcludedIds(new Set((c.excludedTrainerIds || []).map(String)))
        setSelectedIds(new Set((c.selectedTrainerIds || []).map(String)))
      })
      .catch(() => setError('Failed to load campaign'))
      .finally(() => setLoading(false))
  }, [id, isNew, navigate])

  const audiencePayload = useCallback(() => ({
    selectionMode,
    audienceFilter: buildCampaignAudienceFilter(filters, selectionMode, audienceSource),
    selectedTrainerIds: selectionMode === 'manual' ? [...selectedIds] : [],
    excludedTrainerIds: [...excludedIds],
    channels: ['email'],
  }), [selectionMode, audienceSource, filters, selectedIds, excludedIds])

  useEffect(() => {
    const seq = ++audienceSeq.current
    setAudienceLoading(true)
    previewCampaignAudience(audiencePayload())
      .then((data) => {
        if (seq !== audienceSeq.current) return
        setAudienceSummary(data)
      })
      .catch(() => {
        if (seq !== audienceSeq.current) return
        setAudienceSummary(null)
      })
      .finally(() => {
        if (seq === audienceSeq.current) setAudienceLoading(false)
      })
  }, [audiencePayload])

  useEffect(() => {
    if (selectionMode === 'all') return
    const seq = ++trainerSeq.current
    setTrainersLoading(true)
    getTrainers(toQueryParams(filters, page, pageSize, audienceSource))
      .then((data) => {
        if (seq !== trainerSeq.current) return
        setTrainers(data.items || [])
        setListMeta({ total: data.total || 0, pages: data.pages || 1 })
      })
      .catch(() => {
        if (seq !== trainerSeq.current) return
        setTrainers([])
      })
      .finally(() => {
        if (seq === trainerSeq.current) setTrainersLoading(false)
      })
  }, [selectionMode, audienceSource, filters, page, pageSize])

  const sampleTrainerId = useMemo(() => {
    const fromList = trainers.find((t) => t.email?.trim())?.id
    const fromSample = audienceSummary?.sample?.find((s) => s.email?.trim())?.id
    return fromList || fromSample || trainers[0]?.id || audienceSummary?.sample?.[0]?.id
  }, [trainers, audienceSummary])

  const toggleExclude = (trainerId) => {
    const idStr = String(trainerId)
    setExcludedIds((prev) => {
      const next = new Set(prev)
      if (next.has(idStr)) next.delete(idStr)
      else next.add(idStr)
      return next
    })
  }

  const toggleSelect = (trainerId) => {
    const idStr = String(trainerId)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(idStr)) next.delete(idStr)
      else next.add(idStr)
      return next
    })
  }

  const selectAllOnPage = () => {
    if (selectionMode === 'manual') {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        trainers.forEach((t) => next.add(String(t.id)))
        return next
      })
    } else {
      setExcludedIds((prev) => {
        const next = new Set(prev)
        trainers.forEach((t) => next.delete(String(t.id)))
        return next
      })
    }
  }

  const deselectAllOnPage = () => {
    if (selectionMode === 'manual') {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        trainers.forEach((t) => next.delete(String(t.id)))
        return next
      })
    } else {
      setExcludedIds((prev) => {
        const next = new Set(prev)
        trainers.forEach((t) => next.add(String(t.id)))
        return next
      })
    }
  }

  const buildSavePayload = () => ({
    subject,
    bodyHtml,
    layoutId,
    selectionMode,
    audienceFilter: buildCampaignAudienceFilter(filters, selectionMode, audienceSource),
    selectedTrainerIds: selectionMode === 'manual' ? [...selectedIds] : [],
    excludedTrainerIds: [...excludedIds],
    channels: ['email'],
  })

  const validateContent = () => {
    if (!subject.trim()) return 'Subject line is required'
    if (!bodyHtml.trim()) return 'Email body is required'
    if (!layoutId) return 'Select an email layout (or create one in Email Layouts)'
    return ''
  }

  const validateAudience = () => {
    if (selectionMode === 'manual' && selectedIds.size === 0) {
      return 'Select at least one trainer for manual audience'
    }
    return ''
  }

  const goToStep = (nextStep) => {
    setError('')
    if (nextStep === 'audience' && step === 'content') {
      const msg = validateContent()
      if (msg) return setError(msg)
    }
    if (nextStep === 'review') {
      const contentMsg = validateContent()
      if (contentMsg) {
        setError(contentMsg)
        setStep('content')
        return
      }
      const audienceMsg = validateAudience()
      if (audienceMsg) {
        setError(audienceMsg)
        setStep('audience')
        return
      }
    }
    setStep(nextStep)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      if (isNew) {
        const created = await createCampaign(buildSavePayload())
        navigate(`/campaigns/${created.id}/edit`, { replace: true })
        setToast('Draft saved')
      } else {
        await updateCampaign(id, buildSavePayload())
        setToast('Draft saved')
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    const contentMsg = validateContent()
    if (contentMsg) return setError(contentMsg)
    if (!sampleTrainerId) return setError('No trainer available for preview')

    try {
      const payload = { trainerId: sampleTrainerId, subject, bodyHtml, layoutId }
      if (!isNew) payload.campaignId = id
      const result = await previewCampaignEmail(payload)
      setPreviewHtml(result.bodyHtml || '')
      setPreviewSubject(result.subject || subject)
      setError('')
    } catch (e) {
      setError(e.response?.data?.error || 'Preview failed')
    }
  }

  useEffect(() => {
    if (step !== 'review') return
    if (!sampleTrainerId || previewHtml) return
    handlePreview()
  }, [step, sampleTrainerId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTestSend = async () => {
    const contentMsg = validateContent()
    if (contentMsg) return setError(contentMsg)
    if (!testEmail.trim()) return setError('Enter a test email address')

    setSaving(true)
    setError('')
    try {
      let campaignId = id
      if (isNew) {
        const created = await createCampaign(buildSavePayload())
        campaignId = created.id
        navigate(`/campaigns/${created.id}/edit`, { replace: true })
      } else {
        await updateCampaign(id, buildSavePayload())
      }
      await testSendCampaign({ campaignId, testEmail: testEmail.trim() })
      setToast('Test email sent successfully')
    } catch (e) {
      setError(e.response?.data?.error || 'Test send failed')
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async () => {
    const contentMsg = validateContent()
    if (contentMsg) return setError(contentMsg)
    const audienceMsg = validateAudience()
    if (audienceMsg) return setError(audienceMsg)

    const eligible = audienceSummary?.channels?.email?.eligible ?? 0
    if (eligible === 0) return setError('No eligible recipients. Check audience filters and trainer emails.')

    if (!window.confirm(`Send to ${eligible} trainers?`)) return

    setSaving(true)
    setError('')
    try {
      if (isNew) {
        const created = await createCampaign(buildSavePayload())
        await sendCampaign(created.id)
        navigate(`/campaigns/${created.id}`)
      } else {
        await updateCampaign(id, buildSavePayload())
        await sendCampaign(id)
        navigate(`/campaigns/${id}`)
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Send failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="comm-page">
        <div className="comm-loading">
          <div className="comm-loading-spinner" />
          <p>Loading campaign…</p>
        </div>
      </div>
    )
  }

  const emailEligible = audienceSummary?.channels?.email?.eligible ?? 0
  const emailSkipped = audienceSummary?.channels?.email?.skipped ?? 0
  const skipReasons = audienceSummary?.channels?.email?.skipReasons || {}
  const selectedLayout = layouts.find((l) => l.id === layoutId)

  return (
    <div className="comm-page compose-page">
      <CampaignToast message={toast} onClose={() => setToast('')} />

      <header className="comm-page-header compose-header">
        <div className="comm-page-header-text">
          <div className="comm-page-icon comm-page-icon--campaign" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </div>
          <div>
            <h2 className="comm-page-title">{isNew ? 'New Campaign' : 'Edit Campaign'}</h2>
            <p className="comm-page-desc">
              Write your requirement email, choose trainers, then review and send.
            </p>
          </div>
        </div>
        <div className="compose-header-actions">
          <Link to="/campaigns" className="btn btn-secondary">Back</Link>
          <button type="button" className="btn btn-secondary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save draft'}
          </button>
        </div>
      </header>

      <nav className="compose-steps" aria-label="Campaign steps">
        {STEPS.map((s, i) => {
          const done = i < stepIndex
          const active = step === s.id
          return (
            <button
              key={s.id}
              type="button"
              className={`compose-step-tab ${active ? 'active' : ''} ${done ? 'done' : ''}`}
              onClick={() => goToStep(s.id)}
              aria-current={active ? 'step' : undefined}
            >
              <StepIcon index={i + 1} active={active} done={done} />
              <span className="compose-step-text">
                <strong>{s.label}</strong>
                <small>{s.desc}</small>
              </span>
            </button>
          )
        })}
      </nav>

      {error && (
        <div className="compose-alert compose-alert--error" role="alert">
          {error}
        </div>
      )}

      {step === 'content' && (
        <section className="compose-panel" aria-labelledby="compose-content-heading">
          <div className="compose-panel-grid">
            <div className="compose-panel-main comm-layout-form-fields">
              <h3 id="compose-content-heading" className="compose-section-title">Email content</h3>

              {layoutsLoading ? (
                <p className="compose-muted">Loading layouts…</p>
              ) : layouts.length === 0 ? (
                <div className="compose-alert compose-alert--warn">
                  No email layouts found.{' '}
                  <Link to="/email-layouts">Create a layout</Link> before sending.
                </div>
              ) : (
                <label>
                  Email layout
                  <select value={layoutId} onChange={(e) => setLayoutId(e.target.value)}>
                    {layouts.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}{l.isDefault ? ' (default)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Subject line
                <input
                  className="compose-subject-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Urgent Java Trainer Requirement – Mumbai College"
                />
              </label>

              <RichTextEditor key={id || 'new'} value={bodyHtml} onChange={setBodyHtml} />

              <div className="compose-test-card">
                <h4>Test before sending</h4>
                <p>Send one email to yourself to verify formatting and merge tags.</p>
                <div className="compose-test-row">
                  <input
                    placeholder="your@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <button type="button" className="btn btn-secondary" onClick={handleTestSend} disabled={saving}>
                    Send test
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handlePreview}>
                    Preview
                  </button>
                </div>
              </div>
            </div>

            <aside className="compose-panel-side">
              <div className="compose-preview-card">
                <h4>Live preview</h4>
                {previewHtml ? (
                  <>
                    <p className="compose-preview-subject">
                      <strong>Subject:</strong> {previewSubject}
                    </p>
                    <div className="compose-preview-html" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </>
                ) : (
                  <p className="compose-muted">Click Preview to see the email with a sample trainer.</p>
                )}
              </div>
            </aside>
          </div>
        </section>
      )}

      {step === 'audience' && (
        <section className="compose-panel" aria-labelledby="compose-audience-heading">
          <h3 id="compose-audience-heading" className="compose-section-title">Choose audience</h3>

          <div className="compose-source-scope">
            <div className="compose-source-scope-head">
              <strong>Trainer source</strong>
              <span>Choose who can be included in this campaign</span>
            </div>
            <div className="compose-source-scope-grid" role="radiogroup" aria-label="Trainer source">
              {AUDIENCE_SOURCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={audienceSource === option.value}
                  className={`compose-source-card ${audienceSource === option.value ? 'active' : ''}`}
                  onClick={() => {
                    setAudienceSource(option.value)
                    setPage(1)
                  }}
                >
                  <strong>{option.label}</strong>
                  <span>{option.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="compose-mode-grid">
            {[
              { id: 'all', title: 'All matching', desc: `Every ${audienceSourceLabel(audienceSource).toLowerCase()} trainer` },
              { id: 'filter', title: 'Filtered', desc: 'Skill, city, experience, rating…' },
              { id: 'manual', title: 'Manual', desc: 'Hand-pick from the list' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`compose-mode-card ${selectionMode === mode.id ? 'active' : ''}`}
                onClick={() => setSelectionMode(mode.id)}
              >
                <strong>{mode.title}</strong>
                <span>{mode.desc}</span>
              </button>
            ))}
          </div>

          {selectionMode === 'filter' && (
            <div className="compose-filters-wrap">
              <TrainerFilters
                filters={filters}
                onChange={(f) => { setFilters(f); setPage(1) }}
                options={filterOptions}
                resultCount={listMeta.total}
                loading={trainersLoading}
              />
            </div>
          )}

          <div className="compose-audience-stats">
            <div className="compose-stat">
              <span>Matched</span>
              <strong>{audienceLoading ? '…' : audienceSummary?.totalMatched ?? 0}</strong>
            </div>
            {audienceSource === 'all' && !audienceLoading && audienceSummary?.sourceBreakdown && (
              <>
                <div className="compose-stat">
                  <span>Admin added</span>
                  <strong>{audienceSummary.sourceBreakdown.admin ?? 0}</strong>
                </div>
                <div className="compose-stat">
                  <span>Website signups</span>
                  <strong>{audienceSummary.sourceBreakdown.website ?? 0}</strong>
                </div>
              </>
            )}
            <div className="compose-stat compose-stat--success">
              <span>Will receive email</span>
              <strong>{audienceLoading ? '…' : emailEligible}</strong>
            </div>
            <div className="compose-stat">
              <span>Skipped</span>
              <strong>{audienceLoading ? '…' : emailSkipped}</strong>
            </div>
          </div>

          {Object.keys(skipReasons).length > 0 && (
            <ul className="compose-skip-list">
              {Object.entries(skipReasons).map(([reason, count]) => (
                <li key={reason}>
                  {SKIP_REASON_LABELS[reason] || reason}: <strong>{count}</strong>
                </li>
              ))}
            </ul>
          )}

          {selectionMode !== 'all' && (
            <>
              <div className="compose-list-toolbar">
                <span>
                  {trainersLoading ? 'Loading trainers…' : `${listMeta.total.toLocaleString()} trainers in list`}
                </span>
                <div className="compose-list-toolbar-actions">
                  <button type="button" className="compose-link-btn" onClick={selectAllOnPage}>Select page</button>
                  <button type="button" className="compose-link-btn" onClick={deselectAllOnPage}>Deselect page</button>
                </div>
              </div>

              <div className="compose-trainer-list">
                <div className="compose-trainer-list-header">
                  <span />
                  <span>Name</span>
                  <span>Source</span>
                  <span>Email</span>
                  <span>City</span>
                </div>
                {trainersLoading && trainers.length === 0 ? (
                  <div className="compose-list-empty">Loading trainers…</div>
                ) : trainers.length === 0 ? (
                  <div className="compose-list-empty">No trainers match these filters.</div>
                ) : (
                  trainers.map((t) => {
                    const idStr = String(t.id)
                    const excluded = excludedIds.has(idStr)
                    const checked = selectionMode === 'manual' ? selectedIds.has(idStr) : !excluded
                    const noEmail = !t.email?.trim()
                    return (
                      <label
                        key={t.id}
                        className={`compose-trainer-row ${excluded ? 'excluded' : ''} ${noEmail ? 'no-email' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={noEmail && selectionMode === 'manual'}
                          onChange={() => selectionMode === 'manual' ? toggleSelect(t.id) : toggleExclude(t.id)}
                        />
                        <span className="compose-trainer-name">{t.name}</span>
                        <span>
                          <span className={`compose-source-badge compose-source-badge--${t.source === 'website' ? 'website' : 'admin'}`}>
                            {trainerSourceLabel(t.source)}
                          </span>
                        </span>
                        <span className="compose-trainer-email">{t.email || 'No email'}</span>
                        <span className="compose-trainer-city">{t.city || '—'}</span>
                      </label>
                    )
                  })
                )}
                <TrainerPagination
                  page={page}
                  pages={listMeta.pages}
                  total={listMeta.total}
                  pageSize={pageSize}
                  loading={trainersLoading}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    storePageSize(size)
                    setPageSize(size)
                    setPage(1)
                  }}
                />
              </div>
            </>
          )}
        </section>
      )}

      {step === 'review' && (
        <section className="compose-panel" aria-labelledby="compose-review-heading">
          <h3 id="compose-review-heading" className="compose-section-title">Review & send</h3>

          <div className="compose-review-grid">
            <div className="compose-review-card">
              <h4>Email summary</h4>
              <dl className="compose-review-dl">
                <dt>Subject</dt>
                <dd>{subject || '—'}</dd>
                <dt>Layout</dt>
                <dd>{selectedLayout?.name || '—'}</dd>
                <dt>Audience</dt>
                <dd>
                  {selectionMode === 'all'
                    ? `All matching — ${audienceSourceLabel(audienceSource)}`
                    : selectionMode === 'filter'
                      ? `Filtered — ${audienceSourceLabel(audienceSource)}`
                      : `Manual (${selectedIds.size} selected) — ${audienceSourceLabel(audienceSource)}`}
                </dd>
                {audienceSource === 'all' && audienceSummary?.sourceBreakdown && (
                  <>
                    <dt>By source</dt>
                    <dd>
                      {audienceSummary.sourceBreakdown.admin ?? 0} admin · {audienceSummary.sourceBreakdown.website ?? 0} website
                    </dd>
                  </>
                )}
                <dt>Matched trainers</dt>
                <dd>{audienceSummary?.totalMatched ?? 0}</dd>
              </dl>
            </div>

            <div className="compose-review-card compose-review-card--highlight">
              <h4>Ready to send</h4>
              <p className="compose-review-big">{audienceLoading ? '…' : emailEligible}</p>
              <p>trainers will receive this email</p>
              {emailSkipped > 0 && (
                <p className="compose-muted">
                  {emailSkipped} skipped (no email, unsubscribed, or opted out)
                </p>
              )}
              <button
                type="button"
                className="btn btn-primary compose-send-btn"
                onClick={handleSend}
                disabled={saving || audienceLoading || emailEligible === 0}
              >
                {saving ? 'Sending…' : 'Send campaign now'}
              </button>
            </div>
          </div>

          <div className="compose-preview-card compose-preview-card--full">
            <div className="compose-preview-card-head">
              <h4>Email preview</h4>
              <button type="button" className="compose-link-btn" onClick={handlePreview}>Refresh preview</button>
            </div>
            {previewHtml ? (
              <div className="compose-preview-html" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : (
              <p className="compose-muted">Generating preview…</p>
            )}
          </div>
        </section>
      )}

      <footer className="compose-footer">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={stepIndex === 0}
          onClick={() => goToStep(STEPS[stepIndex - 1].id)}
        >
          Back
        </button>
        <div className="compose-footer-meta">
          Step {stepIndex + 1} of {STEPS.length}
          {emailEligible > 0 && (
            <span className="compose-footer-badge">{emailEligible} recipients</span>
          )}
        </div>
        {stepIndex < STEPS.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={() => goToStep(STEPS[stepIndex + 1].id)}>
            Continue to {STEPS[stepIndex + 1].label}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSend}
            disabled={saving || audienceLoading || emailEligible === 0}
          >
            {saving ? 'Sending…' : `Send to ${emailEligible} trainers`}
          </button>
        )}
      </footer>
    </div>
  )
}
