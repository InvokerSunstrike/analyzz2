import { useCallback, useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'

const fmt = n => new Intl.NumberFormat('ru-RU').format(Math.round(Number(n) || 0))
const fmtPct = n => `${Number(n).toFixed(1)}%`

const OLIVE_PALETTE = ['var(--olive-600)', 'var(--olive-400)', 'var(--olive-200)', 'var(--olive-100)']

function parseWBReport(data) {
  if (!data || data.length < 2) return null

  const headers = data[0]
  const findCol = (...keys) => {
    for (const key of keys) {
      const i = headers.findIndex(h => h && String(h).toLowerCase().includes(key.toLowerCase()))
      if (i >= 0) return i
    }
    return -1
  }

  const cols = {
    id: findCol('№ отчета', 'отчет'),
    entity: findCol('Юридическое лицо'),
    dateStart: findCol('Дата начала'),
    dateEnd: findCol('Дата конца'),
    type: findCol('Тип отчета'),
    sales: findCol('Продажа'),
    transfer: findCol('К перечислению за товар'),
    discount: findCol('Согласованная скидка'),
    logistics: findCol('Стоимость логистики'),
    storage: findCol('Стоимость хранения'),
    ops: findCol('Стоимость операций'),
    other: findCol('Прочие удержания'),
    fines: findCol('Общая сумма штрафов'),
    totalPay: findCol('Итого к оплате'),
    currency: findCol('Валюта'),
  }

  const rows = data.slice(1).filter(r => r && r[cols.type] === 'Основной')

  const formatPeriod = (start, end) => {
    if (!start) return '—'
    const s = new Date(start)
    const e = new Date(end)
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
    if (isNaN(s.getTime())) return String(start).slice(0, 10)
    const sStr = `${s.getDate()} ${months[s.getMonth()]}`
    const eStr = `${e.getDate()} ${months[e.getMonth()]}`
    return `${sStr}–${eStr}`
  }

  const parsed = rows.map(r => ({
    period: formatPeriod(r[cols.dateStart], r[cols.dateEnd]),
    id: r[cols.id],
    entity: r[cols.entity],
    sales: Number(r[cols.sales]) || 0,
    transfer: Number(r[cols.transfer]) || 0,
    logistics: Number(r[cols.logistics]) || 0,
    storage: Number(r[cols.storage]) || 0,
    ops: Number(r[cols.ops]) || 0,
    fines: Number(r[cols.fines]) || 0,
    other: Number(r[cols.other]) || 0,
    totalPay: Number(r[cols.totalPay]) || 0,
    currency: r[cols.currency] || 'KZT',
  }))

  const totals = {
    sales: parsed.reduce((s, r) => s + r.sales, 0),
    transfer: parsed.reduce((s, r) => s + r.transfer, 0),
    logistics: parsed.reduce((s, r) => s + r.logistics, 0),
    storage: parsed.reduce((s, r) => s + r.storage, 0),
    ops: parsed.reduce((s, r) => s + r.ops, 0),
    fines: parsed.reduce((s, r) => s + r.fines, 0),
    totalPay: parsed.reduce((s, r) => s + r.totalPay, 0),
    entity: rows[0]?.[cols.entity] || '',
    currency: rows[0]?.[cols.currency] || 'KZT',
    weeks: parsed.length,
  }

  return { rows: parsed, totals }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px', fontWeight: 500 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: '13px', color: p.color, fontWeight: 500 }}>
          {p.name}: {fmt(p.value)} ₸
        </div>
      ))}
    </div>
  )
}

function DropZone({ onFile }) {
  const [drag, setDrag] = useState(false)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef()

  useEffect(() => { setTimeout(() => setMounted(true), 80) }, [])

  const handleDrop = useCallback(e => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile])

  const handleChange = e => {
    if (e.target.files[0]) onFile(e.target.files[0])
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100%', padding: '60px 40px',
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'none' : 'translateY(24px)',
      transition: 'all 0.5s ease',
    }}>
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 500 }}>
          Финансовый анализ
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '16px' }}>
          Анализ отчёта<br />Wildberries
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-3)', maxWidth: '460px', lineHeight: 1.6 }}>
          Загрузите еженедельный финансовый отчёт Wildberries в формате <strong>.xlsx</strong> для мгновенного анализа ключевых показателей
        </p>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        style={{
          width: '100%', maxWidth: '540px',
          border: `2px dashed ${drag ? 'var(--olive-600)' : 'var(--olive-200)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '56px 40px',
          textAlign: 'center',
          cursor: 'pointer',
          background: drag ? 'var(--olive-50)' : 'var(--white)',
          transition: 'all var(--transition)',
          boxShadow: drag ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        }}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleChange} />

        <div style={{
          width: 72, height: 72,
          background: drag ? 'var(--olive-100)' : 'var(--olive-50)',
          borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          transition: 'all var(--transition)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--olive-600)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <polyline points="9,15 12,12 15,15" />
          </svg>
        </div>

        <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.01em' }}>
          {drag ? 'Отпустите файл' : 'Перетащите файл сюда'}
        </div>
        <div style={{ fontSize: '13.5px', color: 'var(--text-3)', marginBottom: '24px' }}>
          или нажмите для выбора
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'var(--olive-700)', color: 'var(--white)',
          borderRadius: 'var(--radius-sm)', padding: '11px 28px',
          fontSize: '13.5px', fontWeight: 500, letterSpacing: '-0.01em',
          pointerEvents: 'none',
        }}>
          Выбрать файл .xlsx
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', marginTop: '36px' }}>
        {[
          { icon: '📊', text: 'Анализ продаж' },
          { icon: '🚚', text: 'Стоимость логистики' },
          { icon: '📈', text: 'Еженедельная динамика' },
          { icon: '💳', text: 'Расчёт выплат' },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-3)' }}>
            <span style={{ fontSize: '16px' }}>{f.icon}</span>
            {f.text}
          </div>
        ))}
      </div>
    </div>
  )
}

function Results({ result, onReset }) {
  const { rows, totals } = result
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), 80) }, [])

  const commissionPct = totals.transfer > 0 ? ((totals.logistics + totals.storage + totals.ops) / totals.transfer * 100) : 0
  const netMargin = totals.transfer > 0 ? (totals.totalPay / totals.transfer * 100) : 0

  const pieData = [
    { name: 'К выплате', value: Math.max(0, Math.round(totals.totalPay)) },
    { name: 'Логистика', value: Math.round(totals.logistics) },
    { name: 'Хранение', value: Math.round(totals.storage) },
    { name: 'Операции', value: Math.round(totals.ops) },
  ].filter(d => d.value > 0)

  const card = (label, value, unit, color, delay, note) => (
    <div style={{
      background: 'var(--white)',
      borderRadius: 'var(--radius)',
      padding: '22px',
      boxShadow: 'var(--shadow)',
      border: '1px solid var(--border-light)',
      borderTop: `3px solid ${color}`,
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'none' : 'translateY(16px)',
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '12px' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{unit}</span>
        {note && <span style={{ fontSize: '11px', color, background: `${color}18`, padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>{note}</span>}
      </div>
    </div>
  )

  return (
    <div style={{ padding: '36px 40px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginBottom: '36px',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 500 }}>
            Wildberries · {totals.entity}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 700, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.03em' }}>
            Результаты анализа
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '6px' }}>
            {totals.weeks} недельных отчётов · {totals.currency}
          </div>
        </div>
        <button
          onClick={onReset}
          style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '9px 18px',
            fontSize: '13px', color: 'var(--text-2)', cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--olive-50)'; e.currentTarget.style.borderColor = 'var(--olive-300)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          ← Загрузить другой файл
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {card('Продажи (Sellers price)', `${fmt(totals.sales)} ₸`, totals.currency, 'var(--olive-600)', 100)}
        {card('К перечислению', `${fmt(totals.transfer)} ₸`, totals.currency, 'var(--olive-500)', 180)}
        {card('Итого к выплате', `${fmt(totals.totalPay)} ₸`, totals.currency, 'var(--olive-400)', 260)}
        {card('Комиссия WB', fmtPct(commissionPct), 'от суммы перечисления', 'var(--olive-300)', 340)}
        {card('Чистая маржа', fmtPct(netMargin), 'выплата/перечисление', 'var(--olive-200)', 420)}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={{
          background: 'var(--white)', borderRadius: 'var(--radius)',
          padding: '28px 28px 20px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-light)',
          opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)',
          transition: 'all 0.6s ease 0.3s',
        }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 500 }}>Динамика</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Продажи и выплаты по неделям</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--olive-500)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--olive-500)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--olive-300)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--olive-300)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}к`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="sales" name="Продажи" stroke="var(--olive-600)" strokeWidth={2} fill="url(#g1)" dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="totalPay" name="К выплате" stroke="var(--olive-300)" strokeWidth={2} fill="url(#g2)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{
          background: 'var(--white)', borderRadius: 'var(--radius)',
          padding: '28px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-light)',
          opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)',
          transition: 'all 0.6s ease 0.4s',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 500 }}>Структура</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Распределение средств</div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                {pieData.map((_, i) => <Cell key={i} fill={OLIVE_PALETTE[i % OLIVE_PALETTE.length]} stroke="none" />)}
              </Pie>
              <Tooltip formatter={(v) => [`${fmt(v)} ₸`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: OLIVE_PALETTE[i % OLIVE_PALETTE.length], flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{d.name}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{fmt(d.value)} ₸</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar chart logistics */}
      <div style={{
        background: 'var(--white)', borderRadius: 'var(--radius)',
        padding: '28px 28px 20px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-light)',
        marginBottom: '24px',
        opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)',
        transition: 'all 0.6s ease 0.5s',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 500 }}>Детализация</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Логистика и Хранение</div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={22} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}к`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="logistics" name="Логистика" fill="var(--olive-500)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="storage" name="Хранение" fill="var(--olive-200)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--white)', borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)', border: '1px solid var(--border-light)',
        overflow: 'hidden',
        opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)',
        transition: 'all 0.6s ease 0.6s',
      }}>
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 500 }}>Таблица</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Детальные данные по неделям</div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', background: 'var(--olive-50)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)' }}>
            {rows.length} отчётов
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['Период', 'Продажи', 'К перечислению', 'К выплате', 'Логистика', 'Хранение', 'Маржа'].map(h => (
                  <th key={h} style={{ padding: '11px 18px', textAlign: h === 'Период' ? 'left' : 'right', fontSize: '10.5px', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500, borderBottom: '1px solid var(--border-light)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const margin = row.transfer > 0 ? (row.totalPay / row.transfer * 100).toFixed(1) : '—'
                const isPositive = row.totalPay >= 0
                return (
                  <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--olive-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 18px', fontSize: '13px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' }}>{row.period}</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', fontSize: '13.5px', color: 'var(--olive-700)', fontWeight: 600, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>{fmt(row.sales)} ₸</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{fmt(row.transfer)} ₸</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', fontSize: '13px', color: isPositive ? 'var(--olive-700)' : '#c0392b', fontWeight: 500, whiteSpace: 'nowrap' }}>{fmt(row.totalPay)} ₸</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', fontSize: '13px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{fmt(row.logistics)} ₸</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', fontSize: '13px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{fmt(row.storage)} ₸</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--olive-700)', background: 'var(--olive-50)', padding: '3px 10px', borderRadius: '20px' }}>
                        {margin}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--olive-50)', borderTop: '2px solid var(--border)' }}>
                <td style={{ padding: '13px 18px', fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Итого</td>
                <td style={{ padding: '13px 18px', textAlign: 'right', fontSize: '14px', color: 'var(--olive-700)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{fmt(totals.sales)} ₸</td>
                <td style={{ padding: '13px 18px', textAlign: 'right', fontSize: '14px', color: 'var(--text)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{fmt(totals.transfer)} ₸</td>
                <td style={{ padding: '13px 18px', textAlign: 'right', fontSize: '14px', color: 'var(--olive-700)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{fmt(totals.totalPay)} ₸</td>
                <td style={{ padding: '13px 18px', textAlign: 'right', fontSize: '14px', color: 'var(--text)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{fmt(totals.logistics)} ₸</td>
                <td style={{ padding: '13px 18px', textAlign: 'right', fontSize: '14px', color: 'var(--text)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{fmt(totals.storage)} ₸</td>
                <td style={{ padding: '13px 18px', textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--olive-700)', background: 'var(--olive-100)', padding: '4px 12px', borderRadius: '20px' }}>
                    {fmtPct(netMargin)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function WBAnalyzer() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFile = useCallback(async (file) => {
    setLoading(true)
    setError(null)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array', cellDates: true })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
      const parsed = parseWBReport(data)
      if (!parsed || parsed.rows.length === 0) {
        setError('Не удалось распознать формат файла. Убедитесь, что это еженедельный отчёт Wildberries.')
      } else {
        setResult(parsed)
      }
    } catch (e) {
      setError('Ошибка при чтении файла: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
      <div style={{ width: 48, height: 48, border: '3px solid var(--olive-100)', borderTop: '3px solid var(--olive-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: '14px', color: 'var(--text-3)' }}>Анализируем отчёт...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', padding: '40px' }}>
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius)', padding: '24px 32px', maxWidth: '500px', textAlign: 'center' }}>
        <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚠️</div>
        <div style={{ fontSize: '14px', color: '#991b1b', lineHeight: 1.6 }}>{error}</div>
      </div>
      <button onClick={() => setError(null)} style={{ background: 'var(--olive-700)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 24px', fontSize: '13.5px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
        Попробовать снова
      </button>
    </div>
  )

  if (result) return <Results result={result} onReset={() => setResult(null)} />
  return <DropZone onFile={handleFile} />
}
