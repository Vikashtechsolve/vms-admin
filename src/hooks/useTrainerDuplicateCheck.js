import { useEffect, useRef, useState } from 'react'
import { checkTrainerAvailability } from '../services/api.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DEBOUNCE_MS = 450

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function trimContact(value) {
  return String(value || '').trim()
}

/**
 * Debounced duplicate check for email + mobile.
 * - One API call checks both changed fields together
 * - Skips unchanged values when editing
 * - Aborts stale in-flight requests
 */
export function useTrainerDuplicateCheck({ email, contact, baseline, excludeId, enabled }) {
  const [fieldState, setFieldState] = useState({
    email: { error: '', checking: false, available: null },
    contact: { error: '', checking: false, available: null },
  })

  const requestSeq = useRef(0)
  const abortRef = useRef(null)

  const normalizedEmail = normalizeEmail(email)
  const trimmedContact = trimContact(contact)
  const baseEmail = normalizeEmail(baseline?.email)
  const baseContact = trimContact(baseline?.contact)
  const emailChanged = normalizedEmail !== baseEmail
  const contactChanged = trimmedContact !== baseContact
  const emailCheckable = normalizedEmail && EMAIL_RE.test(normalizedEmail)
  const contactCheckable = trimmedContact.length > 0
  const needsEmailCheck = emailCheckable && emailChanged
  const needsContactCheck = contactCheckable && contactChanged

  useEffect(() => {
    if (!enabled) return undefined

    let emailError = ''
    if (normalizedEmail && !EMAIL_RE.test(normalizedEmail)) {
      emailError = 'Enter a valid email address.'
    }

    if (!needsEmailCheck && !needsContactCheck) {
      setFieldState({
        email: {
          error: emailError,
          checking: false,
          available: emailCheckable && !emailError ? true : null,
        },
        contact: {
          error: '',
          checking: false,
          available: contactCheckable ? true : null,
        },
      })
      return undefined
    }

    setFieldState((prev) => ({
      email: {
        error: emailError || (needsEmailCheck ? '' : prev.email.error),
        checking: needsEmailCheck,
        available: needsEmailCheck ? null : (emailCheckable && !emailError ? true : null),
      },
      contact: {
        error: needsContactCheck ? '' : prev.contact.error,
        checking: needsContactCheck,
        available: needsContactCheck ? null : (contactCheckable ? true : null),
      },
    }))

    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const seq = ++requestSeq.current

      const params = {}
      if (excludeId) params.excludeId = excludeId
      if (needsEmailCheck) params.email = normalizedEmail
      if (needsContactCheck) params.contact = trimmedContact

      try {
        const data = await checkTrainerAvailability(params, { signal: controller.signal })
        if (seq !== requestSeq.current || controller.signal.aborted) return

        setFieldState({
          email: {
            error: emailError || (needsEmailCheck && !data.email?.available ? data.email.message : ''),
            checking: false,
            available: needsEmailCheck ? !!data.email?.available && !emailError : (emailCheckable && !emailError ? true : null),
          },
          contact: {
            error: needsContactCheck && !data.contact?.available ? data.contact.message : '',
            checking: false,
            available: needsContactCheck ? !!data.contact?.available : (contactCheckable ? true : null),
          },
        })
      } catch (err) {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return
        if (seq !== requestSeq.current) return
        setFieldState((prev) => ({
          email: { ...prev.email, checking: false },
          contact: { ...prev.contact, checking: false },
        }))
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [
    enabled,
    normalizedEmail,
    trimmedContact,
    needsEmailCheck,
    needsContactCheck,
    excludeId,
  ])

  useEffect(() => () => abortRef.current?.abort(), [])

  const checking = fieldState.email.checking || fieldState.contact.checking
  const emailReady = !needsEmailCheck || fieldState.email.available === true
  const contactReady = !needsContactCheck || fieldState.contact.available === true
  const canSubmit =
    !checking &&
    !fieldState.email.error &&
    !fieldState.contact.error &&
    emailReady &&
    contactReady

  return { fieldState, checking, canSubmit }
}
