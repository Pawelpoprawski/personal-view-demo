import { useState } from 'react'

/** Note list + add form. onAdd(text) must resolve to the created note. */
export default function Notes({ notes, onAdd, compact = false }) {
  const [items, setItems] = useState(notes)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    try {
      const note = await onAdd(text.trim())
      setItems((xs) => [note, ...xs])
      setText('')
    } catch {
      window.alert('Could not save the note. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`notes ${compact ? 'notes-compact' : ''}`}>
      {items.map((n) => (
        <p key={n.id} className="note">
          <span className="note-date">{n.created}</span> {n.text}
        </p>
      ))}
      <form className="note-form" onSubmit={submit}>
        <input
          className="cell-input"
          placeholder="Add a note…"
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-outline" disabled={busy || !text.trim()}>Add note</button>
      </form>
    </div>
  )
}
