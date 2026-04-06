import { useCallback, useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts'

const fmt = n => new Intl.NumberFormat('ru-RU').format(Math.round(Number(n)||0))
const fmtK = n => { const v = Math.round(n); return v >= 1000 ? `${(v/1000).toFixed(0)}к` : String(v) }
const fmtPct = n => `${Number(n).toFixed(1)}%`
const PIE = ['var(--olive)', 'var(--olive-mid)', 'var(--olive-light)', '#C8D09A']

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '10px 14px', boxShadow: 'var(--shadow)', fontSize: '12px' }}>
      <div style={{ color: 'var(--text-3)', marginBottom: '6px', fontWeight: 500 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{p.name}: {fmt(p.value)} ₸</div>)}
    </div>
  )
}

const IconFile = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9,15 12,12 15,15"/></svg>
const IconReset = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>

function parseWBReport(data) {
  if (!data || data.length < 2) return null
  const headers = data[0]
  const find = (...keys) => { for (const k of keys) { const i = headers.findIndex(h => h && String(h).includes(k)); if (i >= 0) return i } return -1 }
  const cols = {
    type: find('Тип отчета'), sales: find('Продажа'),
    transfer: find('К перечислению за товар'), logistics: find('Стоимость логистики'),
    storage: find('Стоимость хранения'), ops: find('Стоимость операций'),
    fines: find('Общая сумма штрафов'), other: find('Прочие удержания'),
    totalPay: find('Итого к оплате'), start: find('Дата начала'),
    end: find('Дата конца'), entity: find('Юридическое лицо'), currency: find('Валюта'),
  }
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
  const fmtPer = (s, e) => { try { const sd = new Date(s), ed = new Date(e); return `${sd.getDate()} ${months[sd.getMonth()]}–${ed.getDate()} ${months[ed.getMonth()]}` } catch { return String(s||'').slice(0,10) } }
  const rows = data.slice(1).filter(r => r && r[cols.type] === 'Основной').map(r => ({
    period: fmtPer(r[cols.start], r[cols.end]),
    sales: Number(r[cols.sales])||0, transfer: Number(r[cols.transfer])||0,
    logistics: Number(r[cols.logistics])||0, storage: Number(r[cols.storage])||0,
    ops: Number(r[cols.ops])||0, fines: Number(r[cols.fines])||0,
    other: Number(r[cols.other])||0, totalPay: Number(r[cols.totalPay])||0,
    currency: r[cols.currency]||'KZT',
  }))
  if (!rows.length) return null
  const sum = k => rows.reduce((s, r) => s + r[k], 0)
  return {
    rows, entity: data[1]?.[cols.entity] || '', currency: rows[0].currency,
    totals: { sales: sum('sales'), transfer: sum('transfer'), logistics: sum('logistics'), storage: sum('storage'), ops: sum('ops'), fines: sum('fines'), totalPay: sum('totalPay') }
  }
}

function MetricCard({ label, value, note, color = 'var(--olive)', delay = 0 }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { setTimeout(() => setVis(true), delay) }, [delay])
  return (
    <div style={{
      background: 'var(--white)', borderRadius: 'var(--r)', padding: '18px 20px',
      boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
      borderTop: `2px solid ${color}`,
      opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(10px)',
      transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
    }}>
      <div style={{ fontSize: '10.5px', color: 'var(--text-4)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '10px' }}>{label}</div>
      <div className="num" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
      {note && <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '5px' }}>{note}</div>}
    </div>
  )
}

function DropZone({ onFile }) {
  const [drag, setDrag] = useState(false)
  const [vis, setVis] = useState(false)
  const inputRef = useRef()
  useEffect(() => { setTimeout(() => setVis(true), 60) }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '48px 40px', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(20px)', transition: 'all 0.5s ease' }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '10.5px', color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 500 }}>Анализ отчётов</div>
        <h1 style={{ fontSize: '40px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: '14px' }}>
          Финансовый анализ<br />Wildberries
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-3)', maxWidth: '420px', lineHeight: 1.65 }}>
          Загрузите еженедельный финансовый отчёт в формате <strong>.xlsx</strong> — получите полный разбор: продажи, выплаты, комиссии, маржинальность
        </p>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]) }}
        onClick={() => inputRef.current.click()}
        style={{
          width: '100%', maxWidth: '500px',
          border: `1.5px dashed ${drag ? 'var(--olive)' : 'var(--border)'}`,
          borderRadius: 'var(--r-lg)', padding: '48px 36px',
          textAlign: 'center', cursor: 'pointer',
          background: drag ? 'var(--olive-ghost)' : 'var(--white)',
          transition: 'all var(--t)',
          boxShadow: drag ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        }}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => onFile(e.target.files[0])} />
        <div style={{ width: 60, height: 60, background: 'var(--olive-ghost)', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', transition: 'background var(--t)', ...(drag && { background: 'var(--olive-faint)' }) }}>
          <IconFile />
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          {drag ? 'Отпустите файл' : 'Перетащите .xlsx файл'}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-4)', marginBottom: '22px' }}>или нажмите для выбора</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'var(--olive)', color: 'white', borderRadius: 'var(--r-sm)', padding: '10px 24px', fontSize: '13px', fontWeight: 500, pointerEvents: 'none' }}>
          Выбрать файл
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', maxWidth: '500px', width: '100%', marginTop: '28px' }}>
        {[['Продажи', 'По неделям'], ['Комиссия WB', 'Точный расчёт'], ['Маржа', 'Чистая прибыль'], ['Динамика', 'Тренды роста']].map(([t, s], i) => (
          <div key={i} style={{ background: 'var(--white)', borderRadius: 'var(--r-sm)', padding: '12px', border: '1px solid var(--border-light)', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', letterSpacing: '-0.01em' }}>{t}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Results({ result, onReset }) {
  const { rows, totals, entity, currency } = result
  const [vis, setVis] = useState(false)
  useEffect(() => { setTimeout(() => setVis(true), 60) }, [])

  const commPct = totals.transfer > 0 ? (totals.logistics + totals.storage + totals.ops) / totals.transfer * 100 : 0
  const margin = totals.transfer > 0 ? totals.totalPay / totals.transfer * 100 : 0
  const avgWeeklySales = totals.sales / rows.length
  const bestWeek = rows.reduce((b, r) => r.sales > (b?.sales || 0) ? r : b, null)
  const worstWeek = rows.reduce((w, r) => r.sales < (w?.sales ?? Infinity) ? r : w, null)

  const forecast = rows.length >= 3 ? (() => {
    const last3 = rows.slice(-3).map(r => r.sales)
    return Math.max(0, Math.round((last3[1] - last3[0] + last3[2] - last3[1]) / 2 + last3[2]))
  })() : null

  const pieData = [
    { name: 'К выплате', value: Math.max(0, Math.round(totals.totalPay)) },
    { name: 'Логистика', value: Math.round(totals.logistics) },
    { name: 'Хранение', value: Math.round(totals.storage) },
    { name: 'Операции', value: Math.round(totals.ops) },
  ].filter(d => d.value > 0)

  const healthScore = Math.min(100, Math.max(0, Math.round(margin * 0.6 + (commPct < 20 ? 30 : commPct < 30 ? 15 : 0) + (rows.length >= 8 ? 10 : 5))))

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', opacity: vis ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        <div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 500 }}>Wildberries · {entity}</div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1 }}>Результаты анализа</h1>
          <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: '5px' }}>{rows.length} недель · {currency}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Health Score */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-sm)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Здоровье бизнеса</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <div className="num" style={{ fontSize: '20px', fontWeight: 700, color: healthScore >= 60 ? 'var(--olive)' : '#B45309', letterSpacing: '-0.03em' }}>{healthScore}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>/100</div>
              </div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${healthScore >= 60 ? 'var(--olive)' : '#D97706'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: healthScore >= 60 ? 'var(--olive)' : '#D97706', fontWeight: 700 }}>
              {healthScore >= 70 ? '↑' : healthScore >= 50 ? '→' : '↓'}
            </div>
          </div>
          <button onClick={onReset}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '9px 16px', fontSize: '13px', color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all var(--t)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--olive)'; e.currentTarget.style.borderColor = 'var(--olive)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <IconReset /> Новый файл
          </button>
        </div>
      </div>

      {/* Main KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <MetricCard label="Продажи" value={`${fmt(totals.sales)} ₸`} note={currency} color="var(--olive)" delay={60} />
        <MetricCard label="К перечислению" value={`${fmt(totals.transfer)} ₸`} note="WB → Поставщик" color="var(--olive-mid)" delay={120} />
        <MetricCard label="Итого выплата" value={`${fmt(totals.totalPay)} ₸`} note="На счёт" color="var(--olive)" delay={180} />
        <MetricCard label="Комиссия WB" value={fmtPct(commPct)} note="от перечисления" color={commPct > 25 ? '#D97706' : 'var(--olive-mid)'} delay={240} />
        <MetricCard label="Чистая маржа" value={fmtPct(margin)} note="выплата/оборот" color="var(--olive-light)" delay={300} />
      </div>

      {/* Insights row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px', opacity: vis ? 1 : 0, transition: 'opacity 0.5s ease 0.2s' }}>
        {[
          { label: 'Лучшая неделя', value: bestWeek?.period, sub: `${fmt(bestWeek?.sales||0)} ₸`, type: 'positive' },
          { label: 'Худшая неделя', value: worstWeek?.period, sub: `${fmt(worstWeek?.sales||0)} ₸`, type: 'neutral' },
          { label: 'Ср. продажи / нед.', value: `${fmt(avgWeeklySales)} ₸`, sub: `за ${rows.length} нед.`, type: 'neutral' },
          { label: 'Прогноз след. нед.', value: forecast ? `${fmt(forecast)} ₸` : '—', sub: 'линейный тренд', type: forecast && forecast > avgWeeklySales ? 'positive' : 'neutral' },
        ].map((ins, i) => (
          <div key={i} style={{ background: ins.type === 'positive' ? 'var(--olive-ghost)' : 'var(--white)', border: `1px solid ${ins.type === 'positive' ? 'var(--border)' : 'var(--border-light)'}`, borderRadius: 'var(--r-sm)', padding: '14px 16px' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{ins.label}</div>
            <div className="num" style={{ fontSize: '14px', fontWeight: 600, color: ins.type === 'positive' ? 'var(--olive)' : 'var(--text)', letterSpacing: '-0.02em' }}>{ins.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '3px' }}>{ins.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '14px', marginBottom: '14px', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(14px)', transition: 'all 0.5s ease 0.25s' }}>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--r)', padding: '22px 22px 14px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: '3px' }}>Динамика</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Продажи и выплаты по неделям</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--olive)" stopOpacity={0.15}/><stop offset="95%" stopColor="var(--olive)" stopOpacity={0}/></linearGradient>
                <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--olive-light)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--olive-light)" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false}/>
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--text-4)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-4)' }} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
              <Tooltip content={<Tip />}/>
              <Area type="monotone" dataKey="sales" name="Продажи" stroke="var(--olive)" strokeWidth={2} fill="url(#ga)" dot={false} activeDot={{ r: 3 }}/>
              <Area type="monotone" dataKey="totalPay" name="К выплате" stroke="var(--olive-light)" strokeWidth={2} fill="url(#gb)" dot={false} activeDot={{ r: 3 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--r)', padding: '22px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: '3px' }}>Структура</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Распределение средств</div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} stroke="none"/>)}
              </Pie>
              <Tooltip formatter={v => [`${fmt(v)} ₸`, '']}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: PIE[i % PIE.length] }}/>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{d.name}</span>
                </div>
                <span className="num" style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.03em' }}>{fmt(d.value)} ₸</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--r)', padding: '22px 22px 14px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', marginBottom: '14px', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(14px)', transition: 'all 0.5s ease 0.35s' }}>
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '10.5px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: '3px' }}>Затраты</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Логистика и Хранение по неделям</div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={18} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false}/>
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--text-4)' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-4)' }} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
            <Tooltip content={<Tip />}/>
            <Bar dataKey="logistics" name="Логистика" fill="var(--olive)" radius={[3, 3, 0, 0]}/>
            <Bar dataKey="storage" name="Хранение" fill="var(--olive-light)" radius={[3, 3, 0, 0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', overflow: 'hidden', opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(14px)', transition: 'all 0.5s ease 0.45s' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: '3px' }}>Детализация</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>Данные по неделям</div>
          </div>
          <span style={{ fontSize: '11px', background: 'var(--olive-ghost)', color: 'var(--olive)', padding: '4px 12px', borderRadius: '20px', fontWeight: 500 }}>{rows.length} отчётов</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['Период', 'Продажи', 'К перечислению', 'К выплате', 'Логистика', 'Хранение', 'Маржа'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Период' ? 'left' : 'right', fontSize: '10.5px', color: 'var(--text-4)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 500, borderBottom: '1px solid var(--border-light)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const mar = row.transfer > 0 ? (row.totalPay / row.transfer * 100).toFixed(1) : '—'
                const isBest = row.period === bestWeek?.period
                return (
                  <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border-light)' : 'none', background: isBest ? 'var(--olive-ghost)' : 'transparent', transition: 'background var(--t)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = isBest ? 'var(--olive-ghost)' : 'transparent'}
                  >
                    <td style={{ padding: '11px 16px', fontSize: '12.5px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isBest && <span style={{ fontSize: '9px', background: 'var(--olive)', color: 'white', padding: '1px 6px', borderRadius: '10px', fontWeight: 500 }}>ЛУЧ</span>}
                        {row.period}
                      </div>
                    </td>
                    <td className="num" style={{ padding: '11px 16px', textAlign: 'right', fontSize: '13px', color: 'var(--olive)', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(row.sales)} ₸</td>
                    <td className="num" style={{ padding: '11px 16px', textAlign: 'right', fontSize: '12.5px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{fmt(row.transfer)} ₸</td>
                    <td className="num" style={{ padding: '11px 16px', textAlign: 'right', fontSize: '12.5px', color: row.totalPay >= 0 ? 'var(--text)' : '#B91C1C', fontWeight: 500, whiteSpace: 'nowrap' }}>{fmt(row.totalPay)} ₸</td>
                    <td className="num" style={{ padding: '11px 16px', textAlign: 'right', fontSize: '12.5px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{fmt(row.logistics)} ₸</td>
                    <td className="num" style={{ padding: '11px 16px', textAlign: 'right', fontSize: '12.5px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{fmt(row.storage)} ₸</td>
                    <td style={{ padding: '11px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--olive)', background: 'var(--olive-ghost)', padding: '2px 9px', borderRadius: '20px' }}>{mar}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--olive-ghost)', borderTop: '1.5px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Итого</td>
                <td className="num" style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: 'var(--olive)', fontWeight: 700 }}>{fmt(totals.sales)} ₸</td>
                <td className="num" style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13.5px', color: 'var(--text)', fontWeight: 700 }}>{fmt(totals.transfer)} ₸</td>
                <td className="num" style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13.5px', color: 'var(--olive)', fontWeight: 700 }}>{fmt(totals.totalPay)} ₸</td>
                <td className="num" style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13.5px', color: 'var(--text)', fontWeight: 700 }}>{fmt(totals.logistics)} ₸</td>
                <td className="num" style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13.5px', color: 'var(--text)', fontWeight: 700 }}>{fmt(totals.storage)} ₸</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--olive)', background: 'var(--olive-faint)', padding: '3px 10px', borderRadius: '20px' }}>
                    {totals.transfer > 0 ? fmtPct(totals.totalPay / totals.transfer * 100) : '—'}
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
    if (!file) return
    setLoading(true); setError(null)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array', cellDates: true })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
      const parsed = parseWBReport(data)
      if (!parsed) setError('Не удалось распознать формат. Убедитесь, что это еженедельный отчёт Wildberries.')
      else setResult(parsed)
    } catch (e) { setError('Ошибка чтения файла: ' + e.message) }
    finally { setLoading(false) }
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '14px' }}>
      <div style={{ width: 36, height: 36, border: '2.5px solid var(--olive-faint)', borderTop: '2.5px solid var(--olive)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
      <div style={{ fontSize: '13px', color: 'var(--text-4)' }}>Анализируем отчёт...</div>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', padding: '40px' }}>
      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--r)', padding: '24px 32px', maxWidth: '480px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#991B1B', lineHeight: 1.6 }}>{error}</div>
      </div>
      <button onClick={() => setError(null)} style={{ background: 'var(--olive)', color: 'white', border: 'none', borderRadius: 'var(--r-sm)', padding: '10px 24px', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font)' }}>Попробовать снова</button>
    </div>
  )

  if (result) return <Results result={result} onReset={() => setResult(null)} />
  return <DropZone onFile={handleFile} />
}
