import { useState, useEffect } from 'react'

const STORAGE_KEY = 'phq_banner_dismissed'
const SCHEME     = 'pathwayhq://'

function isMobileBrowser() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

export default function OpenInAppBanner() {
  const [visible, setVisible]   = useState(false)
  const [tryingOpen, setTrying] = useState(false)

  useEffect(() => {
    if (!isMobileBrowser()) return
    if (sessionStorage.getItem(STORAGE_KEY)) return
    setVisible(true)
  }, [])

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  function openApp() {
    setTrying(true)
    window.location.href = SCHEME
    // If app not installed the redirect fails silently — reset state after delay
    setTimeout(() => setTrying(false), 2500)
  }

  if (!visible) return null

  return (
    <div style={styles.banner}>
      <img src="/icon.png" alt="PathwayHQ" style={styles.icon} />
      <div style={styles.info}>
        <span style={styles.name}>PathwayHQ</span>
        <span style={styles.sub}>Free · Open in the app</span>
      </div>
      <button onClick={openApp} disabled={tryingOpen} style={styles.openBtn}>
        {tryingOpen ? '…' : 'Open'}
      </button>
      <button onClick={dismiss} style={styles.closeBtn} aria-label="Dismiss">✕</button>
    </div>
  )
}

const styles = {
  banner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: 'rgba(15, 23, 42, 0.97)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minWidth: 0,
  },
  name: {
    color: '#f1f5f9',
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: '-0.2px',
  },
  sub: {
    color: '#64748b',
    fontSize: 12,
  },
  openBtn: {
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '7px 16px',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    flexShrink: 0,
    letterSpacing: '-0.2px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 16,
    cursor: 'pointer',
    padding: '4px 6px',
    flexShrink: 0,
    lineHeight: 1,
  },
}
