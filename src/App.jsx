import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import WBAnalyzer from './components/WBAnalyzer'

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar active={page} onNav={setPage} />
      <main style={{
        flex: 1,
        overflow: 'auto',
        background: 'var(--bg)',
        position: 'relative',
      }}>
        {page === 'dashboard' && <Dashboard />}
        {page === 'wb' && <WBAnalyzer />}
      </main>
    </div>
  )
}
