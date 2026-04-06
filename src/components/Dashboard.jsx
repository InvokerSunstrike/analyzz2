import { useEffect, useRef, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'

const DATA = [
  { week: '27окт–2ноя', sales: 16304, pay: 13530, logistics: 4514, storage: 488, transfer: 18532 },
  { week: '3–9ноя',     sales: 48181, pay: 48523, logistics: 7539, storage: 421, transfer: 56483 },
  { week: '10–16ноя',   sales: 79193, pay: 84597, logistics: 10120, storage: 364, transfer: 95080 },
  { week: '17–23ноя',   sales: 34875, pay: 33424, logistics: 6851, storage: 290, transfer: 40565 },
  { week: '24–30ноя',   sales: 170177, pay: 182960, logistics: 18086, storage: 215, transfer: 201261 },
  { week: '1–7дек',     sales: 42592, pay: 44796, logistics: 4984, storage: 161, transfer: 49941 },
  { week: '8–14дек',    sales: 59131, pay: 63632, logistics: 8535, storage: 108, transfer: 72275 },
  { week: '15–21дек',   sales: 74406, pay: 78321, logistics: 8080, storage: 74, transfer: 86476 },
  { week: '22–28дек',   sales: 106338, pay: 111150, logistics: 11029, storage: 33, transfer: 122212 },
  { week: '29–31дек',   sales: 62839, pay: 57315, logistics: 8887, storage: 5, transfer: 66207 },
]

const fmt = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(n))

function useCountUp(target, duration = 1400, delay = 0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf
    const start = performance.now() + delay
    const tick = (now) => {
      if (now < start) { raf = requestAnimationFrame(tick); return }
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(target * ease))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, delay])
  return val
}

function KPICard({ label, value, unit, sub, color, delay, icon }) {
  const animated = useCountUp(value, 1400, delay)
  const [vis, setVis] = useState(false)
  useEffect(() => { setTimeout(() => setVis(true), delay) }, [delay])

  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: 'var(--radius)',
      padding: '24px',
      boxShadow: 'var(--shadow)',
      border: '1px solid var(--border-light)',
      borderTop: `3px solid ${color}`,
      opacity: vis ? 1 : 0,
      transform: vis ? 'none' : 'translateY(16px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '20px', opacity: 0.7 }}>{icon}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 700, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {fmt(animated)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{unit}</span>
        {sub && <span style={{ fontSize: '11px', color, background: `${color}18`, padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>{sub}</span>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px 16px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px', fontWeight: 500 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: '13px', color: p.color, fontWeight: 500 }}>
          {p.name}: {fmt(p.value)} ₸
        </div>
      ))}
    </div>
  )
}

const PIE_COLORS = ['var(--olive-600)', 'var(--olive-400)', 'var(--olive-200)', 'var(--olive-100)']

export default function Dashboard() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), 100) }, [])

  const totalSales = DATA.reduce((s, d) => s + d.sales, 0)
  const totalPay = DATA.reduce((s, d) => s + d.pay, 0)
  const totalLogistics = DATA.reduce((s, d) => s + d.logistics, 0)
  const totalStorage = DATA.reduce((s, d) => s + d.storage, 0)
  const avgCommission = ((totalLogistics + totalStorage) / DATA.reduce((s, d) => s + d.transfer, 0) * 100).toFixed(1)

  const pieData = [
    { name: 'К выплате', value: Math.round(totalPay) },
    { name: 'Логистика', value: Math.round(totalLogistics) },
    { name: 'Хранение', value: Math.round(totalStorage) },
  ]

  const now = new Date()
  const dateStr = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '36px 40px', minHeight: '100%' }}>
      {/* Header */}
      <div style={{
        marginBottom: '40px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateY(-12px)',
        transition: 'all 0.5s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 500 }}>
              Обзор аккаунта
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 700, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.03em' }}>
              Дашборд
            </h1>
            <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '6px' }}>
              Период: 27 октября — 31 декабря 2025 · {dateStr}
            </div>
          </div>
          <div style={{
            background: 'var(--olive-700)',
            color: 'var(--white)',
            borderRadius: 'var(--radius)',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'default',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--olive-300)', display: 'inline-block' }}></span>
            Wildberries KZ
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <KPICard label="Продажи" value={totalSales} unit="₸ · KZT" sub="+10 нед." color="var(--olive-600)" delay={100} icon="📈" />
        <KPICard label="К выплате" value={totalPay} unit="₸ · KZT" sub="Чистая" color="var(--olive-400)" delay={200} icon="💳" />
        <KPICard label="Логистика" value={totalLogistics} unit="₸ · KZT" sub={`${avgCommission}%`} color="var(--olive-300)" delay={300} icon="🚚" />
        <KPICard label="Хранение" value={totalStorage} unit="₸ · KZT" sub="Снижение" color="var(--olive-200)" delay={400} icon="📦" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Area Chart */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius)',
          padding: '28px 28px 20px',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border-light)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateY(20px)',
          transition: 'all 0.6s ease 0.3s',
        }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 500 }}>Недельная динамика</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Продажи и Выплаты</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--olive-500)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--olive-500)" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradPay" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--olive-300)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--olive-300)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}к`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="sales" name="Продажи" stroke="var(--olive-600)" strokeWidth={2} fill="url(#gradSales)" dot={false} activeDot={{ r: 4, fill: 'var(--olive-600)' }} />
              <Area type="monotone" dataKey="pay" name="К выплате" stroke="var(--olive-300)" strokeWidth={2} fill="url(#gradPay)" dot={false} activeDot={{ r: 4, fill: 'var(--olive-300)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius)',
          padding: '28px',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--border-light)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateY(20px)',
          transition: 'all 0.6s ease 0.4s',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 500 }}>Структура</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Распределение средств</div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />)}
              </Pie>
              <Tooltip formatter={(v) => [`${fmt(v)} ₸`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i], flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{d.name}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: '14px' }}>{fmt(d.value)} ₸</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar chart - logistics */}
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius)',
        padding: '28px 28px 20px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-light)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateY(20px)',
        transition: 'all 0.6s ease 0.5s',
        marginBottom: '24px',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 500 }}>Детализация</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Стоимость логистики по неделям</div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}к`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="logistics" name="Логистика" radius={[4, 4, 0, 0]}>
              {DATA.map((_, i) => <Cell key={i} fill={`rgba(107,130,54,${0.45 + (i/DATA.length)*0.55})`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-light)',
        overflow: 'hidden',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateY(20px)',
        transition: 'all 0.6s ease 0.6s',
      }}>
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 500 }}>Отчёты</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Еженедельные данные</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg)' }}>
              {['Период', 'Продажи', 'К выплате', 'Логистика', 'Хранение', 'Маржа'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: h === 'Период' ? 'left' : 'right', fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500, borderBottom: '1px solid var(--border-light)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DATA.map((row, i) => {
              const margin = row.transfer > 0 ? ((row.pay / row.transfer) * 100).toFixed(1) : '—'
              return (
                <tr key={i} style={{ borderBottom: i < DATA.length - 1 ? '1px solid var(--border-light)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--olive-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '13px 20px', fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{row.week}</td>
                  <td style={{ padding: '13px 20px', textAlign: 'right', fontSize: '13px', color: 'var(--olive-700)', fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: '14px' }}>{fmt(row.sales)} ₸</td>
                  <td style={{ padding: '13px 20px', textAlign: 'right', fontSize: '13px', color: 'var(--text)' }}>{fmt(row.pay)} ₸</td>
                  <td style={{ padding: '13px 20px', textAlign: 'right', fontSize: '13px', color: 'var(--text-2)' }}>{fmt(row.logistics)} ₸</td>
                  <td style={{ padding: '13px 20px', textAlign: 'right', fontSize: '13px', color: 'var(--text-2)' }}>{fmt(row.storage)} ₸</td>
                  <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--olive-700)', background: 'var(--olive-50)', padding: '3px 10px', borderRadius: '20px' }}>
                      {margin}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
