import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getCampaign,
  createCampaign,
  updateCampaign,
  getEmailLayouts,
  getWhatsAppTemplates,
  getMessagingChannels,
  previewCampaignAudience,
  previewCampaignEmail,
  testSendCampaign,
  sendCampaign,
  getTrainers,
  getTrainerFilterOptions,
} from '../services/api.js'
import RichTextEditor from '../components/RichTextEditor.jsx'
import ChannelPicker from '../components/ChannelPicker.jsx'
import WhatsAppPreviewBubble from '../components/WhatsAppPreviewBubble.jsx'
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
  { id: 'content', label: 'Content', desc: 'Opening details & channels' },
  { id: 'audience', label: 'Audience', desc: 'Who receives this' },
  { id: 'review', label: 'Review & Send', desc: 'Confirm and send' },
]

const SKIP_REASON_LABELS = {
  no_email: 'No email on record',
  opt_out: 'Opted out of email',
  unsubscribed: 'Unsubscribed',
  no_phone: 'No valid phone number',
  whatsapp_opt_out: 'WhatsApp not enabled',
  whatsapp_unsubscribed: 'WhatsApp unsubscribed',
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
  const [channels, setChannels] = useState(['email'])
  const [channelConfig, setChannelConfig] = useState({ email: true, whatsapp: false })
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [layoutId, setLayoutId] = useState('')
  const [whatsappTemplateId, setWhatsappTemplateId] = useState('')
  const [waTemplates, setWaTemplates] = useState([])
  const [layouts, setLayouts] = useState([])
  const [layoutsLoading, setLayoutsLoading] = useState(true)
  const [selectionMode, setSelectionMode] = useState('filter')
  const [audienceSource, setAudienceSource] = useState('all')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [filterOptions, setFilterOptions] = useState({ skills: [], tags: [], qualifications: [], cities: [] })
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
  const [testPhone, setTestPhone] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [previewWhatsApp, setPreviewWhatsApp] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const audienceSeq = useRef(0)
  const trainerSeq = useRef(0)

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const usesEmail = channels.includes('email')
  const usesWhatsApp = channels.includes('whatsapp')

  const channelConfigLoaded = useRef(false)

  useEffect(() => {
    getMessagingChannels()
      .then((data) => {
        const map = {}
        for (const ch of data.channels || []) map[ch.id] = ch.configured
        setChannelConfig(map)
        if (!channelConfigLoaded.current) {
          channelConfigLoaded.current = true
          setChannels((prev) => {
            const valid = prev.filter((id) => map[id])
            if (valid.length) return valid
            if (map.email) return ['email']
            if (map.whatsapp) return ['whatsapp']
            return prev
          })
        }
      })
      .catch(() => {})

    getWhatsAppTemplates()
      .then((list) => {
        const items = Array.isArray(list) ? list : []
        setWaTemplates(items)
        const active = items.find((t) => t.isActive && t.status === 'approved')
        if (active) setWhatsappTemplateId((prev) => prev || active.id)
      })
      .catch(() => setWaTemplates([]))
  }, [])

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
        if (c.whatsappTemplateId) setWhatsappTemplateId(c.whatsappTemplateId)
        if (c.channels?.length) setChannels(c.channels)
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
    channels,
  }), [selectionMode, audienceSource, filters, selectedIds, excludedIds, channels])

  useEffect(() => {
    const seq = ++audienceSeq.current
    setAudienceLoading(true)
    const timer = setTimeout(() => {
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
    }, 350)
    return () => clearTimeout(timer)
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
    const pick = (t) => {
      if (!t) return false
      if (usesEmail && t.email?.trim()) return true
      if (usesWhatsApp && t.contact?.trim()) return true
      return false
    }
    const fromList = trainers.find(pick)?.id
    const fromSample = audienceSummary?.sample?.find(pick)?.id
    return fromList || fromSample || trainers[0]?.id || audienceSummary?.sample?.[0]?.id
  }, [trainers, audienceSummary, usesEmail, usesWhatsApp])

  function handleChannelsChange(next) {
    if (!next.length) return
    setChannels(next)
    setPreviewHtml('')
    setPreviewWhatsApp('')
    setError('')
  }

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
    layoutId: usesEmail ? layoutId : undefined,
    whatsappTemplateId: usesWhatsApp ? whatsappTemplateId : undefined,
    selectionMode,
    audienceFilter: buildCampaignAudienceFilter(filters, selectionMode, audienceSource),
    selectedTrainerIds: selectionMode === 'manual' ? [...selectedIds] : [],
    excludedTrainerIds: [...excludedIds],
    channels,
  })

  const validateContent = () => {
    if (!subject.trim()) return 'Opening title / subject is required'
    if (!bodyHtml.trim()) return 'Requirement details are required'
    if (usesEmail && !layoutId) return 'Select an email layout (or create one in Email Layouts)'
    if (usesWhatsApp && !whatsappTemplateId) return 'Select a WhatsApp template (sync in WhatsApp Templates)'
    if (channels.length === 0) return 'Select at least one delivery channel'
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
      const base = { trainerId: sampleTrainerId, subject, bodyHtml, layoutId, whatsappTemplateId }
      if (!isNew) base.campaignId = id

      if (usesEmail) {
        const result = await previewCampaignEmail({ ...base, channel: 'email' })
        setPreviewHtml(result.bodyHtml || '')
        setPreviewSubject(result.subject || subject)
      }
      if (usesWhatsApp) {
        const result = await previewCampaignEmail({ ...base, channel: 'whatsapp' })
        setPreviewWhatsApp(result.bodyPreview || '')
      }
      setError('')
    } catch (e) {
      setError(e.response?.data?.error || 'Preview failed')
    }
  }

  useEffect(() => {
    if (step !== 'review') return
    if (!sampleTrainerId) return
    const hasPreview = (usesEmail && previewHtml) || (usesWhatsApp && previewWhatsApp)
    if (hasPreview) return
    handlePreview()
  }, [step, sampleTrainerId, usesEmail, usesWhatsApp, previewHtml, previewWhatsApp]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTestSend = async (channel = 'email') => {
    const contentMsg = validateContent()
    if (contentMsg) return setError(contentMsg)
    if (channel === 'whatsapp' && !testPhone.trim()) return setError('Enter a test phone number')
    if (channel === 'email' && !testEmail.trim()) return setError('Enter a test email address')

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
      await testSendCampaign({
        campaignId,
        channel,
        testEmail: testEmail.trim(),
        testPhone: testPhone.trim(),
      })
      setToast(channel === 'whatsapp' ? 'Test WhatsApp sent' : 'Test email sent successfully')
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

    const emailEligible = audienceSummary?.channels?.email?.eligible ?? 0
    const waEligible = audienceSummary?.channels?.whatsapp?.eligible ?? 0
    const totalEligible = (usesEmail ? emailEligible : 0) + (usesWhatsApp ? waEligible : 0)
    if (totalEligible === 0) {
      return setError('No eligible recipients. Check audience filters, emails, phones, and WhatsApp opt-in.')
    }

    const parts = []
    if (usesEmail) parts.push(`${emailEligible} email`)
    if (usesWhatsApp) parts.push(`${waEligible} WhatsApp`)
    if (!window.confirm(`Send to ${parts.join(' + ')}?`)) return

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
  const waEligible = audienceSummary?.channels?.whatsapp?.eligible ?? 0
  const waSkipped = audienceSummary?.channels?.whatsapp?.skipped ?? 0
  const waSkipReasons = audienceSummary?.channels?.whatsapp?.skipReasons || {}
  const totalEligible = (usesEmail ? emailEligible : 0) + (usesWhatsApp ? waEligible : 0)
  const skipReasons = audienceSummary?.channels?.email?.skipReasons || {}
  const selectedLayout = layouts.find((l) => l.id === layoutId)
  const selectedWaTemplate = waTemplates.find((t) => t.id === whatsappTemplateId)

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
              Notify trainers about a new opening via email, WhatsApp, or both.
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
          <ChannelPicker value={channels} onChange={handleChannelsChange} configured={channelConfig} />

          <div className="compose-panel-grid">
            <div className="compose-panel-main comm-layout-form-fields">
              <h3 id="compose-content-heading" className="compose-section-title">Opening details</h3>

              <label>
                Opening title
                <input
                  className="compose-subject-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Urgent Java Trainer Requirement – Mumbai College"
                />
              </label>

              <label>
                Requirement details
                <span className="compose-field-hint">Used in email body and WhatsApp template variables</span>
              </label>
              <RichTextEditor key={id || 'new'} value={bodyHtml} onChange={setBodyHtml} />

              {usesEmail && (
                <>
                  {layoutsLoading ? (
                    <p className="compose-muted">Loading layouts…</p>
                  ) : layouts.length === 0 ? (
                    <div className="compose-alert compose-alert--warn">
                      No email layouts found.{' '}
                      <Link to="/email-layouts">Create a layout</Link> before sending email.
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
                </>
              )}

              {usesWhatsApp && (
                <div className="compose-wa-template-block">
                  {waTemplates.length === 0 ? (
                    <div className="compose-alert compose-alert--warn">
                      No WhatsApp templates.{' '}
                      <Link to="/whatsapp-templates">Sync templates from Meta</Link> first.
                    </div>
                  ) : (
                    <>
                      <label>
                        WhatsApp template
                        <select value={whatsappTemplateId} onChange={(e) => setWhatsappTemplateId(e.target.value)}>
                          {waTemplates.filter((t) => t.status === 'approved').map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}{t.isActive ? ' (active)' : ''}
                            </option>
                          ))}
                        </select>
                      </label>
                      {selectedWaTemplate && (
                        <div className="compose-wa-template-card">
                          <div className="compose-wa-template-card-head">
                            <strong>{selectedWaTemplate.name}</strong>
                            <span className={`wa-template-status wa-template-status--${selectedWaTemplate.status}`}>
                              {selectedWaTemplate.status}
                            </span>
                          </div>
                          <p className="compose-muted compose-wa-template-meta">
                            {selectedWaTemplate.language?.toUpperCase() || 'EN'} · Variables:{' '}
                            {(selectedWaTemplate.variableMapping || ['firstName', 'requirementTitle', 'requirementBody']).join(' → ')}
                          </p>
                          <WhatsAppPreviewBubble
                            text={selectedWaTemplate.bodyPreview}
                            compact
                          />
                        </div>
                      )}
                    </>
                  )}
                  <p className="compose-muted">
                    Meta only allows approved templates for bulk messages.{' '}
                    <Link to="/whatsapp-templates">Manage templates</Link>
                  </p>
                </div>
              )}

              <div className="compose-test-card">
                <h4>Test before sending</h4>
                <p>Send one message to yourself to verify content and merge tags.</p>
                {usesEmail && (
                  <div className="compose-test-row">
                    <input
                      placeholder="your@email.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                    <button type="button" className="btn btn-secondary" onClick={() => handleTestSend('email')} disabled={saving}>
                      Test email
                    </button>
                  </div>
                )}
                {usesWhatsApp && (
                  <div className="compose-test-row">
                    <input
                      placeholder="9876543210 (with country code if needed)"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                    />
                    <button type="button" className="btn btn-secondary" onClick={() => handleTestSend('whatsapp')} disabled={saving}>
                      Test WhatsApp
                    </button>
                  </div>
                )}
                <button type="button" className="btn btn-secondary compose-preview-btn" onClick={handlePreview}>
                  Preview
                </button>
              </div>
            </div>

            <aside className="compose-panel-side">
              <div className="compose-preview-card">
                <h4>Live preview</h4>
                {usesEmail && previewHtml && (
                  <>
                    <p className="compose-preview-subject">
                      <strong>Email subject:</strong> {previewSubject}
                    </p>
                    <div className="compose-preview-html" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </>
                )}
                {usesWhatsApp && previewWhatsApp && (
                  <div className="compose-wa-preview">
                    <p className="compose-preview-subject"><strong>WhatsApp</strong></p>
                    <WhatsAppPreviewBubble text={previewWhatsApp} compact />
                  </div>
                )}
                {!previewHtml && !previewWhatsApp && (
                  <p className="compose-muted">Click Preview to see how this looks for a sample trainer.</p>
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
            {usesEmail && (
              <div className="compose-stat compose-stat--success">
                <span>Will receive email</span>
                <strong>{audienceLoading ? '…' : emailEligible}</strong>
              </div>
            )}
            {usesWhatsApp && (
              <div className="compose-stat compose-stat--success compose-stat--whatsapp">
                <span>Will receive WhatsApp</span>
                <strong>{audienceLoading ? '…' : waEligible}</strong>
              </div>
            )}
            {(usesEmail || usesWhatsApp) && (
              <div className="compose-stat">
                <span>Skipped (combined)</span>
                <strong>
                  {audienceLoading
                    ? '…'
                    : (usesEmail ? emailSkipped : 0) + (usesWhatsApp ? waSkipped : 0)}
                </strong>
              </div>
            )}
          </div>

          {Object.keys(skipReasons).length > 0 && usesEmail && (
            <ul className="compose-skip-list">
              <li className="compose-skip-list-title">Email skips</li>
              {Object.entries(skipReasons).map(([reason, count]) => (
                <li key={reason}>
                  {SKIP_REASON_LABELS[reason] || reason}: <strong>{count}</strong>
                </li>
              ))}
            </ul>
          )}

          {Object.keys(waSkipReasons).length > 0 && usesWhatsApp && (
            <ul className="compose-skip-list compose-skip-list--wa">
              <li className="compose-skip-list-title">WhatsApp skips</li>
              {Object.entries(waSkipReasons).map(([reason, count]) => (
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

              <div className={`compose-trainer-list ${usesEmail && usesWhatsApp ? 'compose-trainer-list--dual' : ''}`}>
                <div className={`compose-trainer-list-header ${usesEmail && usesWhatsApp ? 'compose-trainer-list--dual' : ''}`}>
                  <span />
                  <span>Name</span>
                  <span>Source</span>
                  {usesEmail && <span>Email</span>}
                  {usesWhatsApp && <span>Phone</span>}
                  {!usesEmail && !usesWhatsApp && <span>Contact</span>}
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
                    const noEmail = usesEmail && !t.email?.trim()
                    const noPhone = usesWhatsApp && !t.contact?.trim()
                    const noWaOptIn = usesWhatsApp && !t.whatsappOptIn
                    const disabled =
                      selectionMode === 'manual' &&
                      ((usesEmail && noEmail) || (usesWhatsApp && (noPhone || noWaOptIn)))
                    return (
                      <label
                        key={t.id}
                        className={`compose-trainer-row ${usesEmail && usesWhatsApp ? 'compose-trainer-list--dual' : ''} ${excluded ? 'excluded' : ''} ${noEmail || noPhone || noWaOptIn ? 'no-email' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => selectionMode === 'manual' ? toggleSelect(t.id) : toggleExclude(t.id)}
                        />
                        <span className="compose-trainer-name">{t.name}</span>
                        <span>
                          <span className={`compose-source-badge compose-source-badge--${t.source === 'website' ? 'website' : 'admin'}`}>
                            {trainerSourceLabel(t.source)}
                          </span>
                        </span>
                        {usesEmail && (
                          <span className="compose-trainer-email">{t.email || 'No email'}</span>
                        )}
                        {usesWhatsApp && (
                          <span className="compose-trainer-email">
                            {t.contact || 'No phone'}
                            {t.contact && !t.whatsappOptIn && (
                              <small className="compose-wa-opt-hint"> · WA off</small>
                            )}
                          </span>
                        )}
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
              <h4>Campaign summary</h4>
              <dl className="compose-review-dl">
                <dt>Channels</dt>
                <dd>{channels.map((c) => (c === 'whatsapp' ? 'WhatsApp' : 'Email')).join(' + ') || '—'}</dd>
                <dt>Opening title</dt>
                <dd>{subject || '—'}</dd>
                {usesEmail && (
                  <>
                    <dt>Email layout</dt>
                    <dd>{selectedLayout?.name || '—'}</dd>
                  </>
                )}
                {usesWhatsApp && (
                  <>
                    <dt>WhatsApp template</dt>
                    <dd>{selectedWaTemplate?.name || '—'}</dd>
                  </>
                )}
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
              {usesEmail && (
                <p className="compose-review-channel-stat">
                  <strong>{audienceLoading ? '…' : emailEligible}</strong> email
                </p>
              )}
              {usesWhatsApp && (
                <p className="compose-review-channel-stat compose-review-channel-stat--wa">
                  <strong>{audienceLoading ? '…' : waEligible}</strong> WhatsApp
                </p>
              )}
              <p className="compose-muted">Messages will be queued and sent in the background</p>
              <button
                type="button"
                className="btn btn-primary compose-send-btn"
                onClick={handleSend}
                disabled={saving || audienceLoading || totalEligible === 0}
              >
                {saving ? 'Sending…' : 'Send campaign now'}
              </button>
            </div>
          </div>

          {(usesEmail && previewHtml) && (
            <div className="compose-preview-card compose-preview-card--full">
              <div className="compose-preview-card-head">
                <h4>Email preview</h4>
                <button type="button" className="compose-link-btn" onClick={handlePreview}>Refresh preview</button>
              </div>
              <div className="compose-preview-html" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          )}

          {(usesWhatsApp && previewWhatsApp) && (
            <div className="compose-preview-card compose-preview-card--full compose-wa-preview-card">
              <div className="compose-preview-card-head">
                <h4>WhatsApp preview</h4>
                <button type="button" className="compose-link-btn" onClick={handlePreview}>Refresh preview</button>
              </div>
              <WhatsAppPreviewBubble text={previewWhatsApp} />
            </div>
          )}

          {!previewHtml && !previewWhatsApp && (
            <p className="compose-muted">Generating preview…</p>
          )}
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
          {totalEligible > 0 && (
            <span className="compose-footer-badge">{totalEligible} recipients</span>
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
            disabled={saving || audienceLoading || totalEligible === 0}
          >
            {saving ? 'Sending…' : `Send campaign`}
          </button>
        )}
      </footer>
    </div>
  )
}
