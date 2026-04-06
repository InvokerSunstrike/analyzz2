import { useEffect, useState } from 'react'

const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="9" fill="var(--olive-700)" />
    <path d="M8 22 L13 10 L16 18 L19 10 L24 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="24" cy="10" r="2" fill="var(--olive-300)" />
  </svg>
)

const IconHome = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--olive-700)' : 'var(--text-3)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12L12 3l9 9" /><path d="M9 21V12h6v9" /><path d="M3 12v9h6M15 21v-9h6v9" />
    <path d="M5 21h14" />
  </svg>
)

const IconChart = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--olive-700)' : 'var(--text-3)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 16l3-4 3 3 3-6" />
    <circle cx="16" cy="9" r="1.2" fill={active ? 'var(--olive-700)' : 'var(--text-3)'} stroke="none" />
  </svg>
)

const IconHistory = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.45}}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
)

const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.45}}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
)

export default function Sidebar({ active, onNav }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  const navItem = (id, label, icon, disabled = false) => {
    const isActive = active === id
    return (
      <button
        key={id}
        onClick={() => !disabled && onNav(id)}
        style={{
          display: 'flex', alignItems: 'center', gap: '11px',
          width: '100%', padding: '10px 14px',
          background: isActive ? 'var(--olive-50)' : 'transparent',
          border: 'none',
          borderLeft: `3px solid ${isActive ? 'var(--olive-700)' : 'transparent'}`,
          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
          cursor: disabled ? 'default' : 'pointer',
          color: isActive ? 'var(--olive-800)' : disabled ? 'var(--text-3)' : 'var(--text-2)',
          fontSize: '13.5px',
          fontWeight: isActive ? '500' : '400',
          letterSpacing: '-0.01em',
          transition: 'all var(--transition)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateX(-8px)',
          transitionDelay: `${150 + ['dashboard','wb','history','settings'].indexOf(id) * 60}ms`,
        }}
        onMouseEnter={e => { if (!isActive && !disabled) { e.currentTarget.style.background = 'var(--olive-50)'; e.currentTarget.style.color = 'var(--text)' }}}
        onMouseLeave={e => { if (!isActive && !disabled) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = disabled ? 'var(--text-3)' : 'var(--text-2)' }}}
      >
        {icon}
        <span>{label}</span>
        {disabled && (
          <span style={{marginLeft:'auto',fontSize:'10px',color:'var(--text-3)',background:'var(--bg)',padding:'2px 7px',borderRadius:'20px',fontWeight:'500',letterSpacing:'0.02em'}}>
            Скоро
          </span>
        )}
      </button>
    )
  }

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      minWidth: 'var(--sidebar-w)',
      height: '100vh',
      background: 'var(--white)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-sm)',
      zIndex: 10,
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'none' : 'translateX(-16px)',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
    }}>
      {/* Logo */}
      <div style={{
        padding: '28px 20px 24px',
        borderBottom: '1px solid var(--border-light)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
          <Logo />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.02em' }}>AISeller</div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-3)', marginTop: '2px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Аналитика</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 17px 8px', fontWeight: 500 }}>
          Главная
        </div>
        {navItem('dashboard', 'Дашборд', <IconHome active={active==='dashboard'} />)}

        <div style={{ fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 17px 8px', fontWeight: 500 }}>
          Анализ
        </div>
        {navItem('wb', 'Отчёт Wildberries', <IconChart active={active==='wb'} />)}
        {navItem('history', 'История анализов', <IconHistory />, true)}

        <div style={{ fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 17px 8px', fontWeight: 500 }}>
          Система
        </div>
        {navItem('settings', 'Настройки', <IconSettings />, true)}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-light)',
        background: 'var(--bg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--olive-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 600, color: 'var(--olive-700)',
          }}>ИА</div>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text)' }}>ИП АКБАРИ</div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Wildberries KZ</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
