import { useEffect, useRef, useState, useCallback } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts'
import * as XLSX from 'xlsx'

const RAW = [
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

const fmt = n => new Intl.NumberFormat('ru-RU').format(Math.round(Number(n)||0))
const fmtK = n => { const v = Math.round(n); return v >= 1000 ? `${(v/1000).toFixed(0)}к` : String(v) }

function useCountUp(target, duration = 1200, delay = 0) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf
    const start = performance.now() + delay
    const tick = now => {
      if (now < start) { raf = requestAnimationFrame(tick); return }
      const p = Math.min((now - start) / duration, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(target * e))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, delay])
  return val
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '10px 14px', boxShadow: 'var(--shadow)', fontSize: '12px' }}>
      <div style={{ color: 'var(--text-3)', marginBottom: '6px', fontWeight: 500 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{p.name}: {fmt(p.value)} ₸</div>)}
    </div>
  )
}

const IconUp = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 9L6 3l4 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
const IconDown = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3L6 9l4-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
const IconUpload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
const IconInfo = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>

function KPICard({ label, value, unit, trend, trendVal, color, delay, metricKey, selected, onSelect, data, dataKey }) {
  const animated = useCountUp(value, 1200, delay)
  const [vis, setVis] = useState(false)
  const isSelected = selected === metricKey
  useEffect(() => { setTimeout(() => setVis(true), delay) }, [delay])

  const positive = trendVal >= 0

  return (
    <div
      onClick={() => onSelect(isSelected ? null : metricKey)}
      style={{
        background: 'var(--white)',
        borderRadius: 'var(--r)',
        padding: '20px',
        boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        border: `1px solid ${isSelected ? color : 'var(--border-light)'}`,
        borderTop: `2px solid ${color}`,
        opacity: vis ? 1 : 0,
        transform: vis ? 'none' : 'translateY(12px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms, box-shadow var(--t), border-color var(--t)`,
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.boxShadow = 'var(--shadow)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500 }}>{label}</span>
        {trendVal !== undefined && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 500, color: positive ? '#2D6A2F' : '#B91C1C', background: positive ? '#F0FBF0' : '#FEF2F2', padding: '2px 7px', borderRadius: '20px' }}>
            {positive ? <IconUp /> : <IconDown />}{Math.abs(trendVal)}%
          </span>
        )}
      </div>
      <div className="num" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.04em' }}>
        {fmt(animated)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{unit}</span>
        <span style={{ fontSize: '10px', color: isSelected ? color : 'var(--text-4)', fontWeight: 500 }}>
          {isSelected ? 'Нажмите ещё раз' : 'Подробнее →'}
        </span>
      </div>
      {isSelected && data && (
        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-light)', animation: 'expand 0.25s ease' }}>
          <ResponsiveContainer width="100%" height={70}>
            <LineChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: -30 }}>
              <YAxis tick={false} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.8} dot={false} activeDot={{ r: 3, fill: color }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function parseWBFile(data) {
  if (!data || data.length < 2) return null
  const headers = data[0]
  const find = (...keys) => { for (const k of keys) { const i = headers.findIndex(h => h && String(h).includes(k)); if (i >= 0) return i } return -1 }
  const cols = { type: find('Тип отчета'), sales: find('Продажа'), transfer: find('К перечислению'), logistics: find('Стоимость логистики'), storage: find('Стоимость хранения'), totalPay: find('Итого к оплате'), start: find('Дата начала'), end: find('Дата конца') }
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
  const fmt2 = (s, e) => { try { const sd = new Date(s), ed = new Date(e); return `${sd.getDate()}${months[sd.getMonth()]}–${ed.getDate()}${months[ed.getMonth()]}` } catch { return String(s||'').slice(0,10) } }
  return data.slice(1).filter(r => r[cols.type] === 'Основной').map(r => ({
    week: fmt2(r[cols.start], r[cols.end]),
    sales: Number(r[cols.sales])||0,
    transfer: Number(r[cols.transfer])||0,
    logistics: Number(r[cols.logistics])||0,
    storage: Number(r[cols.storage])||0,
    pay: Number(r[cols.totalPay])||0,
  }))
}

export default function Dashboard() {
  const [vis, setVis] = useState(false)
  const [selected, setSelected] = useState(null)
  const [data, setData] = useState(RAW)
  const [fileName, setFileName] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()
  const dropRef = useRef()

  useEffect(() => { setTimeout(() => setVis(true), 80) }, [])

  const handleFile = useCallback(async (file) => {
    if (!file) return
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array', cellDates: true })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
    const parsed = parseWBFile(rows)
    if (parsed && parsed.length > 0) { setData(parsed); setFileName(file.name) }
  }, [])

  const onDrop = useCallback(e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }, [handleFile])

  const totalSales = data.reduce((s, r) => s + r.sales, 0)
  const totalPay = data.reduce((s, r) => s + r.pay, 0)
  const totalLogistics = data.reduce((s, r) => s + r.logistics, 0)
  const totalStorage = data.reduce((s, r) => s + r.storage, 0)
  const totalTransfer = data.reduce((s, r) => s + r.transfer, 0)
  const commPct = totalTransfer > 0 ? (totalLogistics + totalStorage) / totalTransfer * 100 : 0

  const last2 = data.slice(-2)
  const trend = (key) => last2.length === 2 && last2[0][key] > 0 ? Math.round((last2[1][key] - last2[0][key]) / last2[0][key] * 100) : null

  const bestWeek = data.reduce((best, r) => r.sales > (best?.sales || 0) ? r : best, null)

  const insights = [
    { label: 'Лучшая неделя', value: bestWeek?.week, type: 'positive' },
    { label: 'Ср. маржа', value: totalTransfer > 0 ? `${(totalPay/totalTransfer*100).toFixed(1)}%` : '—', type: 'neutral' },
    { label: 'Комиссия WB', value: `${commPct.toFixed(1)}%`, type: commPct > 20 ? 'warn' : 'positive' },
    { label: 'Недель в анализе', value: String(data.length), type: 'neutral' },
  ]

  const pieData = [
    { name: 'К выплате', value: Math.max(0, Math.round(totalPay)) },
    { name: 'Логистика', value: Math.round(totalLogistics) },
    { name: 'Хранение', value: Math.round(totalStorage) },
  ]
  const PIE = ['var(--olive)', 'var(--olive-mid)', 'var(--olive-light)']

  const now = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '32px 36px', minHeight: '100%' }}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {dragOver && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(78,96,32,0.08)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: 'var(--white)', borderRadius: 'var(--r-lg)', padding: '40px 56px', border: '2px dashed var(--olive)', fontSize: '15px', color: 'var(--olive)', fontWeight: 500 }}>
            Отпустите файл для загрузки
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(-10px)', transition: 'all 0.5s ease' }}>
        <div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 500 }}>Дашборд · {now}</div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {fileName ? `Отчёт: ${fileName.replace('.xlsx','').replace('.xls','')}` : 'Обзор продаж'}
          </h1>
          <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: '5px' }}>
            Перетащите .xlsx отчёт WB прямо на страницу для обновления данных
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          <button onClick={() => inputRef.current.click()}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '9px 16px', fontSize: '13px', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 500, transition: 'all var(--t)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--olive)'; e.currentTarget.style.color = 'var(--olive)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
          >
            <IconUpload /> Загрузить отчёт
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--olive)', color: 'var(--white)', borderRadius: 'var(--r-sm)', padding: '9px 16px', fontSize: '12.5px', fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#A8D87B', display: 'inline-block', animation: 'pulse 2s ease infinite' }} />
            Wildberries KZ
          </div>
        </div>
      </div>

      {/* Insights strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px',
        marginBottom: '20px',
        opacity: vis ? 1 : 0, transition: 'opacity 0.5s ease 0.1s',
      }}>
        {insights.map((ins, i) => (
          <div key={i} style={{
            background: ins.type === 'positive' ? 'var(--olive-ghost)' : ins.type === 'warn' ? '#FFFBEB' : 'var(--white)',
            border: `1px solid ${ins.type === 'positive' ? 'var(--border)' : ins.type === 'warn' ? '#FDE68A' : 'var(--border-light)'}`,
            borderRadius: 'var(--r-sm)', padding: '11px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 500 }}>{ins.label}</span>
            <span className="num" style={{ fontSize: '13px', fontWeight: 600, color: ins.type === 'positive' ? 'var(--olive)' : ins.type === 'warn' ? '#92400E' : 'var(--text)', letterSpacing: '-0.02em' }}>{ins.value}</span>
          </div>
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        <KPICard label="Продажи" value={totalSales} unit="₸ · KZT" trendVal={trend('sales')} color="var(--olive)" delay={80} metricKey="sales" selected={selected} onSelect={setSelected} data={data} dataKey="sales" />
        <KPICard label="К выплате" value={totalPay} unit="Чистыми на счёт" trendVal={trend('pay')} color="var(--olive-mid)" delay={160} metricKey="pay" selected={selected} onSelect={setSelected} data={data} dataKey="pay" />
        <KPICard label="Логистика" value={totalLogistics} unit={`${commPct.toFixed(1)}% от оборота`} trendVal={trend('logistics')} color="#7A6520" delay={240} metricKey="logistics" selected={selected} onSelect={setSelected} data={data} dataKey="logistics" />
        <KPICard label="Хранение" value={totalStorage} unit="₸ · KZT" trendVal={trend('storage')} color="var(--olive-light)" delay={320} metricKey="storage" selected={selected} onSelect={setSelected} data={data} dataKey="storage" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '14px', marginBottom: '14px', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(16px)', transition: 'all 0.6s ease 0.25s' }}>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--r)', padding: '24px 24px 16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: '3px' }}>Динамика</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Продажи и выплаты</div>
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--text-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: 8, height: 2, background: 'var(--olive)', display: 'inline-block', borderRadius: 2 }} />Продажи</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: 8, height: 2, background: 'var(--olive-light)', display: 'inline-block', borderRadius: 2 }} />Выплаты</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--olive)" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="var(--olive)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--olive-light)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--olive-light)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false}/>
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-4)', fontFamily: 'var(--font)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-4)' }} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
              <Tooltip content={<Tip />}/>
              <Area type="monotone" dataKey="sales" name="Продажи" stroke="var(--olive)" strokeWidth={2} fill="url(#g1)" dot={false} activeDot={{ r: 3, fill: 'var(--olive)' }}/>
              <Area type="monotone" dataKey="pay" name="К выплате" stroke="var(--olive-light)" strokeWidth={2} fill="url(#g2)" dot={false} activeDot={{ r: 3 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'var(--white)', borderRadius: 'var(--r)', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: '3px' }}>Структура</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Распределение средств</div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={64} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE[i]} stroke="none"/>)}
              </Pie>
              <Tooltip formatter={v => [`${fmt(v)} ₸`, '']}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '4px' }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: PIE[i] }}/>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{d.name}</span>
                </div>
                <span className="num" style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.03em' }}>{fmt(d.value)} ₸</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--r)', padding: '24px 24px 16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', marginBottom: '14px', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(16px)', transition: 'all 0.6s ease 0.35s' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: '3px' }}>Затраты</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Логистика и хранение по неделям</div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={20} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false}/>
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-4)' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-4)' }} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
            <Tooltip content={<Tip />}/>
            <Bar dataKey="logistics" name="Логистика" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={`rgba(78,96,32,${0.4 + i/data.length*0.6})`}/>)}
            </Bar>
            <Bar dataKey="storage" name="Хранение" fill="var(--olive-light)" radius={[3, 3, 0, 0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', overflow: 'hidden', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(16px)', transition: 'all 0.6s ease 0.45s' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: '3px' }}>Отчёты</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Еженедельные данные</div>
          </div>
          <span style={{ fontSize: '11px', background: 'var(--olive-ghost)', color: 'var(--olive)', padding: '4px 12px', borderRadius: '20px', fontWeight: 500 }}>{data.length} недель</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg)' }}>
              {['Период', 'Продажи', 'К перечислению', 'К выплате', 'Логистика', 'Маржа %'].map(h => (
                <th key={h} style={{ padding: '10px 18px', textAlign: h === 'Период' ? 'left' : 'right', fontSize: '10.5px', color: 'var(--text-4)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500, borderBottom: '1px solid var(--border-light)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const margin = row.transfer > 0 ? (row.pay / row.transfer * 100).toFixed(1) : '—'
              const isBest = row.week === bestWeek?.week
              return (
                <tr key={i} style={{ borderBottom: i < data.length - 1 ? '1px solid var(--border-light)' : 'none', background: isBest ? 'var(--olive-ghost)' : 'transparent', transition: 'background var(--t)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = isBest ? 'var(--olive-ghost)' : 'transparent'}
                >
                  <td style={{ padding: '11px 18px', fontSize: '12.5px', color: 'var(--text)', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      {isBest && <span style={{ fontSize: '9px', background: 'var(--olive)', color: 'white', padding: '1px 6px', borderRadius: '10px', fontWeight: 500, letterSpacing: '0.04em' }}>ЛУЧ</span>}
                      {row.week}
                    </div>
                  </td>
                  <td className="num" style={{ padding: '11px 18px', textAlign: 'right', fontSize: '13px', color: 'var(--olive)', fontWeight: 600 }}>{fmt(row.sales)} ₸</td>
                  <td className="num" style={{ padding: '11px 18px', textAlign: 'right', fontSize: '12.5px', color: 'var(--text-2)' }}>{fmt(row.transfer)} ₸</td>
                  <td className="num" style={{ padding: '11px 18px', textAlign: 'right', fontSize: '12.5px', color: row.pay >= 0 ? 'var(--text)' : '#B91C1C', fontWeight: 500 }}>{fmt(row.pay)} ₸</td>
                  <td className="num" style={{ padding: '11px 18px', textAlign: 'right', fontSize: '12.5px', color: 'var(--text-3)' }}>{fmt(row.logistics)} ₸</td>
                  <td style={{ padding: '11px 18px', textAlign: 'right' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--olive)', background: 'var(--olive-ghost)', padding: '3px 9px', borderRadius: '20px' }}>{margin}%</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--olive-ghost)', borderTop: '1.5px solid var(--border)' }}>
              <td style={{ padding: '12px 18px', fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Итого</td>
              <td className="num" style={{ padding: '12px 18px', textAlign: 'right', fontSize: '13.5px', color: 'var(--olive)', fontWeight: 700 }}>{fmt(totalSales)} ₸</td>
              <td className="num" style={{ padding: '12px 18px', textAlign: 'right', fontSize: '13px', color: 'var(--text)', fontWeight: 700 }}>{fmt(totalTransfer)} ₸</td>
              <td className="num" style={{ padding: '12px 18px', textAlign: 'right', fontSize: '13px', color: 'var(--olive)', fontWeight: 700 }}>{fmt(totalPay)} ₸</td>
              <td className="num" style={{ padding: '12px 18px', textAlign: 'right', fontSize: '13px', color: 'var(--text)', fontWeight: 700 }}>{fmt(totalLogistics)} ₸</td>
              <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--olive)', background: 'var(--olive-faint)', padding: '3px 10px', borderRadius: '20px' }}>
                  {totalTransfer > 0 ? `${(totalPay/totalTransfer*100).toFixed(1)}%` : '—'}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
