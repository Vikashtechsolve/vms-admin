import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

function safeFileBase(name) {
  return String(name || 'resume').replace(/[^\w.\-]+/g, '_').slice(0, 60)
}

/** Detect real file type from magic bytes — Cloudinary raw URLs have no extension. */
function sniffFile(buffer) {
  const bytes = new Uint8Array(buffer.slice(0, 8))
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { kind: 'pdf', mime: 'application/pdf', ext: 'pdf' }
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { kind: 'image', mime: 'image/png', ext: 'png' }
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { kind: 'image', mime: 'image/jpeg', ext: 'jpg' }
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return { kind: 'image', mime: 'image/gif', ext: 'gif' }
  }
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return { kind: 'doc', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' }
  }
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    return { kind: 'doc', mime: 'application/msword', ext: 'doc' }
  }
  return { kind: 'file', mime: 'application/octet-stream', ext: 'bin' }
}

function formatBytes(n) {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/** Build a Cloudinary attachment URL when possible (used as download fallback). */
export function resumeDownloadUrl(url, filename = 'resume') {
  const value = String(url || '')
  if (!value) return ''
  if (!value.includes('res.cloudinary.com') || !value.includes('/upload/')) return value
  const safe = safeFileBase(filename)
  if (/\/fl_attachment(?::[^/]+)?\//.test(value)) return value
  return value.replace('/upload/', `/upload/fl_attachment:${safe}/`)
}

/** Trigger a real browser download from a blob URL. */
export function triggerBlobDownload(blobUrl, filename) {
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Fetch a resume and save it locally with a proper extension. */
export async function downloadResumeFile(url, trainerName = 'trainer') {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error('Download failed')
  const buffer = await res.arrayBuffer()
  const sniffed = sniffFile(buffer)
  const blob = new Blob([buffer], { type: sniffed.mime })
  const objectUrl = URL.createObjectURL(blob)
  const filename = `${safeFileBase(trainerName)}-resume.${sniffed.ext}`
  triggerBlobDownload(objectUrl, filename)
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000)
}

/**
 * Loads the resume into memory so we can preview it even when Cloudinary
 * serves it as application/octet-stream with Content-Disposition: attachment.
 */
export default function ResumePreviewModal({ url, trainerName = 'Trainer', onClose }) {
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null) // { objectUrl, kind, mime, ext, size }
  const [reloadKey, setReloadKey] = useState(0)
  const objectUrlRef = useRef('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus('loading')
      setError('')
      setPreview(null)
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = ''
      }

      try {
        const res = await fetch(url, { mode: 'cors', cache: 'force-cache' })
        if (!res.ok) throw new Error(`Could not load resume (${res.status})`)
        const buffer = await res.arrayBuffer()
        if (cancelled) return
        if (!buffer.byteLength) throw new Error('The resume file is empty')

        const sniffed = sniffFile(buffer)
        const blob = new Blob([buffer], { type: sniffed.mime })
        const objectUrl = URL.createObjectURL(blob)
        objectUrlRef.current = objectUrl
        setPreview({
          objectUrl,
          kind: sniffed.kind,
          mime: sniffed.mime,
          ext: sniffed.ext,
          size: buffer.byteLength,
        })
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setError(err?.message || 'Failed to load resume')
        setStatus('error')
      }
    }

    load()

    return () => {
      cancelled = true
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = ''
      }
    }
  }, [url, reloadKey])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const fileName = `${safeFileBase(trainerName)}-resume.${preview?.ext || 'pdf'}`
  const kindLabel = preview?.kind === 'pdf' ? 'PDF'
    : preview?.kind === 'image' ? 'Image'
      : preview?.kind === 'doc' ? 'Word'
        : 'File'

  function handleDownload() {
    if (preview?.objectUrl) {
      triggerBlobDownload(preview.objectUrl, fileName)
      return
    }
    downloadResumeFile(url, trainerName).catch(() => {
      window.open(resumeDownloadUrl(url, fileName), '_blank', 'noopener,noreferrer')
    })
  }

  function handleOpenTab() {
    if (!preview?.objectUrl) return
    window.open(preview.objectUrl, '_blank', 'noopener,noreferrer')
  }

  const modal = (
    <div className="resume-overlay" onClick={onClose} role="presentation">
      <div
        className="resume-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`${trainerName} resume`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="resume-dialog-head">
          <div className="resume-dialog-identity">
            <div className="resume-dialog-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="13" y2="17" />
              </svg>
            </div>
            <div className="resume-dialog-copy">
              <h3 className="resume-dialog-title">{trainerName}</h3>
              <p className="resume-dialog-meta">
                Resume
                {preview && (
                  <>
                    <span className="resume-dot">·</span>
                    <span className="resume-pill">{kindLabel}</span>
                    {preview.size > 0 && (
                      <>
                        <span className="resume-dot">·</span>
                        {formatBytes(preview.size)}
                      </>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="resume-dialog-actions">
            {status === 'ready' && preview?.kind === 'pdf' && (
              <button type="button" className="resume-btn resume-btn--secondary" onClick={handleOpenTab}>
                Open tab
              </button>
            )}
            <button
              type="button"
              className="resume-btn resume-btn--primary"
              onClick={handleDownload}
              disabled={status === 'loading'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
            <button type="button" className="resume-btn resume-btn--icon" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        <div className="resume-dialog-body">
          {status === 'loading' && (
            <div className="resume-state">
              <div className="resume-spinner" aria-hidden="true" />
              <p className="resume-state-title">Loading resume</p>
              <p className="resume-state-text">Fetching and preparing the file for preview…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="resume-state">
              <div className="resume-state-icon resume-state-icon--error" aria-hidden="true">!</div>
              <p className="resume-state-title">Couldn’t open preview</p>
              <p className="resume-state-text">{error || 'The file could not be loaded.'}</p>
              <div className="resume-state-actions">
                <button type="button" className="resume-btn resume-btn--primary" onClick={() => setReloadKey((k) => k + 1)}>
                  Try again
                </button>
                <button type="button" className="resume-btn resume-btn--secondary" onClick={handleDownload}>
                  Download instead
                </button>
              </div>
            </div>
          )}

          {status === 'ready' && preview?.kind === 'pdf' && (
            <embed
              key={preview.objectUrl}
              src={`${preview.objectUrl}#toolbar=1&navpanes=0`}
              type="application/pdf"
              className="resume-frame"
              title={`${trainerName} resume`}
            />
          )}

          {status === 'ready' && preview?.kind === 'image' && (
            <div className="resume-image-wrap">
              <img src={preview.objectUrl} alt={`${trainerName} resume`} className="resume-image" />
            </div>
          )}

          {status === 'ready' && (preview?.kind === 'doc' || preview?.kind === 'file') && (
            <div className="resume-state">
              <div className="resume-state-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="resume-state-title">In-browser preview isn’t available</p>
              <p className="resume-state-text">
                This is a {kindLabel.toLowerCase()} file. Download it to open on your device.
              </p>
              <div className="resume-state-actions">
                <button type="button" className="resume-btn resume-btn--primary" onClick={handleDownload}>
                  Download resume
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
