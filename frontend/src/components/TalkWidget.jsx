import { useEffect, useState } from 'react'
import { talk } from '../api.js'

/** Talk2GFIW assistant — opened from the "Talk to UGiP" button in the header. */
export default function TalkWidget({ context }) {
  const [open, setOpen] = useState(false)
  const [thread, setThread] = useState([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const openTalk = () => setOpen(true)
    window.addEventListener('insights:open-talk', openTalk)
    return () => window.removeEventListener('insights:open-talk', openTalk)
  }, [])

  async function ask(e) {
    e.preventDefault()
    const question = q.trim()
    if (!question) return
    setBusy(true)
    setQ('')
    setThread((t) => [...t, { who: 'you', text: question }])
    try {
      const { answer } = await talk(context ? `${context}: ${question}` : question)
      setThread((t) => [...t, { who: 'gfiw', text: answer }])
    } catch {
      setThread((t) => [...t, { who: 'gfiw', text: 'Something went wrong — ask again.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {open && (
        <div className="talk-widget">
          <div className="talk-widget-head">
            <span>Talk2GFIW</span>
            <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>
          <div className="talk-widget-body">
            {thread.length === 0 && (
              <p className="talk-hint">
                Ask about a client by name, or about your AUM, pipeline and engagement.
              </p>
            )}
            {thread.map((m, i) => (
              <p key={i} className={m.who === 'you' ? 'talk-you' : 'talk-answer'}>
                {m.who === 'you' ? 'You: ' : ''}{m.text}
              </p>
            ))}
          </div>
          <form className="note-form talk-widget-form" onSubmit={ask}>
            <input
              className="cell-input"
              placeholder={context ? `Ask about ${context}…` : 'Ask Talk2GFIW…'}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="submit" className="btn-outline" disabled={busy || !q.trim()}>Ask</button>
          </form>
        </div>
      )}
    </>
  )
}
