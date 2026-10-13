import { useEffect, useState } from 'react'
import { isFirebaseConfigured } from './firebase'
import Dashboard from './components/Dashboard'
import AdminDashboard from './components/AdminDashboard'
import Stats from './components/Stats'
import Navbar from './components/Navbar'
import Login from './components/Login'
import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Loader2 } from 'lucide-react'

function MainApp() {
  const [tab, setTab] = useState('dashboard')
  const { theme } = useApp()
  const { isAuthenticated, authLoading, user } = useAuth()

  // Sync body data-theme attribute whenever theme changes
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712] text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-cyan-400" size={36} />
          <span className="text-xs font-bold tracking-widest text-cyan-300 uppercase">A carregar VanShift…</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  const isExcel = theme === 'excel'

  return (
    <div className={`min-h-screen px-3 sm:px-4 py-4 sm:py-6 transition-colors duration-200 ${isExcel ? 'font-mono' : ''}`}>
      <Navbar activeTab={tab} onTabChange={setTab} />

      {!isFirebaseConfigured && (
        <div className="mx-auto mb-4 max-w-3xl rounded-2xl border border-amber-300/40 bg-amber-400/10 p-4 text-sm text-amber-200">
          Firebase isn't configured. Copy <code>.env.example</code> to <code>.env</code> and fill in your keys.
        </div>
      )}

      <main className="pb-12">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'stats' && <Stats user={user} />}
        {tab === 'admin' && <AdminDashboard />}
      </main>

      {/* Retro Excel 97 Vintage Status Bar */}
      {isExcel && (
        <footer className="fixed bottom-0 left-0 right-0 bg-[#d4d0c8] border-t-2 border-white px-3 py-1 flex items-center justify-between text-[11px] font-mono text-slate-800 z-40 select-none shadow-md">
          <div className="flex items-center gap-3">
            <span className="font-bold bg-white px-2 py-0.5 border border-slate-500">READY</span>
            <span className="opacity-75">AutoCalculate: SUM</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 border border-slate-400">CAPS</span>
            <span className="px-2 border border-slate-400 font-bold bg-slate-200">NUM</span>
            <span className="px-2 border border-slate-400">SCRL</span>
          </div>
        </footer>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthProvider>
  )
}
