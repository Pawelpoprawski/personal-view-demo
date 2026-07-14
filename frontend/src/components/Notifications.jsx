import { useEffect, useRef, useState } from 'react'
import { fetchNotifications, markNotificationsRead } from '../api.js'

const KIND_ICONS = { opportunity: '◆', compliance: '■', market: '▲', engagement: '●', news: '▪' }

export default function Notifications({ onOpenClient }) {
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    fetchNotifications().then(setData).catch(() => {})
  }, [])

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next && data?.unread > 0) {
      try {
        await markNotificationsRead()
        setData((d) => ({ items: d.items.map((n) => ({ ...n, read: true })), unread: 0 }))
      } catch { /* leave unread */ }
    }
  }

  return (
    <div className="notif" ref={boxRef}>
      <button type="button" className="notif-bell" onClick={toggle} aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {data?.unread > 0 && <span className="notif-badge">{data.unread}</span>}
      </button>
      {open && data && (
        <div className="notif-list">
          {data.items.map((n) => (
            <div key={n.id} className={`notif-item ${n.read ? '' : 'notif-unread'}`}>
              <span className={`notif-kind notif-${n.kind}`}>{KIND_ICONS[n.kind] ?? '•'}</span>
              <div>
                <div className="notif-text">{n.text}</div>
                <div className="notif-meta">
                  {n.date}
                  {n.client_id && (
                    <>
                      {' · '}
                      <button type="button" className="client-link"
                              onClick={() => { setOpen(false); onOpenClient(n.client_id, '') }}>
                        View client
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
