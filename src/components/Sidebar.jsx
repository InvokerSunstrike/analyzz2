import { useEffect, useState } from 'react'

const Logo = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
    <rect width="30" height="30" rx="8" fill="var(--olive)" />
    <path d="M7 20L11.5 10L15 17L18.5 10L23 20" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="22.5" cy="10" r="1.8" fill="var(--olive-light)" />
  </svg>
)

const NavIcon = ({ type, active }) => {
  const c = active ? 'var(--olive)' : 'var(--text-3)'
  const icons = {
    home: <><rect x="3" y="11" width="18" height="10" rx="1.5"/><path d="M1 11L15 2l14 9"/><rect x="10" y="16" width="5" height="5"/></>,
    chart: <><rect x="3" y="13" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="17" y="4" width="4" height="17" rx="1"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>,
    settings: <><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[type]}
    </svg>
  )
}

export default function Sidebar({ active, onNav }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { setTimeout(() => setVis(true), 40) }, [])

  const item = (id, label, icon, disabled) => {
    const isActive = active === id
    return (
      <button key={id} onClick={() => !disabled && onNav(id)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          width: '100%', padding: '9px 12px',
          background: isActive ? 'var(--olive-faint)' : 'transparent',
          border: 'none', borderRadius: 'var(--r-sm)',
          cursor: disabled ? 'default' : 'pointer',
          color: isActive ? 'var(--olive)' : disabled ? 'var(--text-4)' : 'var(--text-3)',
          fontSize: '13px', fontWeight: isActive ? '500' : '400',
          fontFamily: 'var(--font)',
          letterSpacing: '-0.01em',
          transition: 'all var(--t)',
          opacity: vis ? 1 : 0,
          transform: vis ? 'none' : 'translateX(-10px)',
          transitionDelay: `${100 + ['dashboard','wb','history','settings'].indexOf(id)*50}ms`,
        }}
        onMouseEnter={e => { if (!isActive && !disabled) e.currentTarget.style.background = 'var(--bg-2)' }}
        onMouseLeave={e => { if (!isActive && !disabled) e.currentTarget.style.background = 'transparent' }}
      >
        <NavIcon type={icon} active={isActive} />
        <span style={{ flex: 1 }}>{label}</span>
        {disabled && <span style={{ fontSize: '10px', background: 'var(--bg-2)', color: 'var(--text-4)', padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.02em' }}>Скоро</span>}
        {isActive && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--olive)', flexShrink: 0 }} />}
      </button>
    )
  }

  return (
    <aside style={{
      width: 'var(--sidebar-w)', minWidth: 'var(--sidebar-w)',
      height: '100vh', background: 'var(--white)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex', flexDirection: 'column',
      boxShadow: 'var(--shadow-xs)',
      opacity: vis ? 1 : 0,
      transition: 'opacity 0.4s ease',
    }}>
      <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Logo />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em' }}>AISeller</div>
            <div style={{ fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '1px' }}>Аналитика</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 12px 6px', fontWeight: 500 }}>Обзор</div>
        {item('dashboard', 'Дашборд', 'home')}
        <div style={{ fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '14px 12px 6px', fontWeight: 500 }}>Анализ</div>
        {item('wb', 'Отчёт Wildberries', 'chart')}
        {item('history', 'История анализов', 'clock', true)}
        <div style={{ fontSize: '10px', color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '14px 12px 6px', fontWeight: 500 }}>Система</div>
        {item('settings', 'Настройки', 'settings', true)}
      </nav>

      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--olive-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--olive)' }}>ИА</div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.01em' }}>ИП АКБАРИ</div>
            <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Wildberries KZ</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
