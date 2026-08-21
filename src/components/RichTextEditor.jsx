import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import JoditEditor from 'jodit-react'
import 'jodit/es2021/jodit.min.css'

const MERGE_TAGS = [
  { tag: '{{trainerName}}', label: 'Name' },
  { tag: '{{firstName}}', label: 'First name' },
  { tag: '{{city}}', label: 'City' },
  { tag: '{{state}}', label: 'State' },
  { tag: '{{skills}}', label: 'Skills' },
]

/** Strip empty editor noise but keep real HTML (tables, pre, inline styles). */
export function normalizeEditorHtml(html) {
  const trimmed = (html || '').trim()
  if (!trimmed) return ''
  if (trimmed === '<p><br></p>' || trimmed === '<p></p>' || trimmed === '<br>') return ''
  return trimmed
}

export default function RichTextEditor({ value, onChange, label = 'Email body' }) {
  const editorRef = useRef(null)
  const skipNextSync = useRef(false)
  const [editorValue, setEditorValue] = useState(value || '')

  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false
      return
    }
    const next = value || ''
    if (next !== editorValue) setEditorValue(next)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const emitChange = useCallback((html) => {
    const normalized = normalizeEditorHtml(html)
    skipNextSync.current = true
    setEditorValue(html)
    onChange(normalized)
  }, [onChange])

  const config = useMemo(() => ({
    readonly: false,
    toolbarSticky: false,
    height: 360,
    minHeight: 280,
    maxHeight: 520,
    statusbar: false,
    spellcheck: true,
    iframe: false,
    enter: 'P',
    defaultActionOnPaste: 'insert_as_html',
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    processPasteHTML: true,
    beautifyHTML: false,
    nl2brInPlainText: false,
    pasteFromWordRemoveFontStyles: false,
    pasteFromWordKeepFormatting: true,
    cleanHTML: {
      fillEmptyParagraph: false,
      removeEmptyElements: false,
      replaceNBSP: false,
      allowTags: {
        a: { href: true, target: true, rel: true, style: true, class: true },
        b: { style: true, class: true },
        strong: { style: true, class: true },
        i: { style: true, class: true },
        em: { style: true, class: true },
        u: { style: true, class: true },
        s: { style: true, class: true },
        strike: { style: true, class: true },
        del: { style: true, class: true },
        span: { style: true, class: true, id: true },
        p: { style: true, class: true, id: true },
        div: { style: true, class: true, id: true },
        br: true,
        hr: { style: true, class: true },
        h1: { style: true, class: true },
        h2: { style: true, class: true },
        h3: { style: true, class: true },
        h4: { style: true, class: true },
        h5: { style: true, class: true },
        h6: { style: true, class: true },
        ul: { style: true, class: true },
        ol: { style: true, class: true },
        li: { style: true, class: true },
        blockquote: { style: true, class: true, cite: true },
        pre: { style: true, class: true },
        code: { style: true, class: true },
        table: { style: true, class: true, border: true, cellpadding: true, cellspacing: true, width: true },
        thead: { style: true, class: true },
        tbody: { style: true, class: true },
        tfoot: { style: true, class: true },
        tr: { style: true, class: true },
        td: { style: true, class: true, colspan: true, rowspan: true, width: true, height: true },
        th: { style: true, class: true, colspan: true, rowspan: true, width: true, height: true },
        img: { src: true, alt: true, width: true, height: true, style: true, class: true },
        font: { color: true, face: true, size: true, style: true },
        sub: { style: true, class: true },
        sup: { style: true, class: true },
      },
    },
    placeholder: 'Write or paste your email — formatting from Gmail, Outlook, Docs, code blocks, and tables is preserved.',
    buttons: [
      'undo',
      'redo',
      '|',
      'paragraph',
      'font',
      'fontsize',
      'brush',
      'eraser',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'superscript',
      'subscript',
      '|',
      'ul',
      'ol',
      'outdent',
      'indent',
      '|',
      'align',
      '|',
      'link',
      'hr',
      'table',
      'symbol',
      '|',
      'fullsize',
      'source',
    ],
    controls: {
      paragraph: {
        list: {
          p: 'Normal',
          h1: 'Heading 1',
          h2: 'Heading 2',
          h3: 'Heading 3',
          h4: 'Heading 4',
          blockquote: 'Quote',
          pre: 'Code block',
        },
      },
      font: {
        list: {
          'Arial,Helvetica,sans-serif': 'Arial',
          'Georgia,serif': 'Georgia',
          'Impact,Charcoal,sans-serif': 'Impact',
          'Tahoma,Geneva,sans-serif': 'Tahoma',
          "'Times New Roman',Times,serif": 'Times New Roman',
          'Verdana,Geneva,sans-serif': 'Verdana',
          "'Courier New',Courier,monospace": 'Courier New',
          "'Lucida Console',Monaco,monospace": 'Monospace',
        },
      },
    },
    style: {
      font: '14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#0f172a',
    },
  }), [])

  const insertTag = (tag) => {
    const inst = editorRef.current
    if (!inst?.s) return
    inst.s.insertHTML(tag)
    emitChange(inst.value)
  }

  return (
    <div className="campaign-editor compose-editor compose-jodit-root">
      <label className="compose-field-label">{label}</label>

      <div className="compose-jodit-merge">
        <span className="compose-jodit-merge-label">Merge tags</span>
        <div className="compose-jodit-merge-chips">
          {MERGE_TAGS.map(({ tag, label: lbl }) => (
            <button key={tag} type="button" className="campaign-tag-chip" onClick={() => insertTag(tag)}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="compose-jodit-shell">
        <JoditEditor
          ref={editorRef}
          value={editorValue}
          config={config}
          onBlur={(html) => emitChange(html)}
          onChange={(html) => emitChange(html)}
        />
      </div>

      <p className="compose-jodit-hint">
        Paste from Gmail, Outlook, Google Docs, websites, or code editors — colors, fonts, lists, tables, and code blocks stay intact.
        Use the <strong>source</strong> button in the toolbar for raw HTML.
      </p>
    </div>
  )
}
