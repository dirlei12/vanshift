import { useState, useEffect } from 'react'
import { Truck, Lock, User, Key, ArrowRight, Loader2, AlertCircle, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchAllSchedules } from '../lib/schedule'
import { useApp } from '../context/AppContext'

export default function Login({ onLoginSuccess }) {
  const { loginAdmin, loginDriver, isDriverMode } = useAuth()
  const { theme, setDriver } = useApp()
  const isExcel = theme === 'excel'

  const [mode, setMode] = useState('driver') // 'driver' | 'admin'
  const [driverName, setDriverName] = useState(() => localStorage.getItem('vanshift:driver') || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [knownDrivers, setKnownDrivers] = useState([])

  useEffect(() => {
    fetchAllSchedules()
      .then((schedules) => {
        const names = [...new Set(schedules.flatMap((s) => s.rows?.map((r) => r.driver) || []))]
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
        setKnownDrivers(names)
      })
      .catch(() => {})
  }, [])

  const handleDriverSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!driverName.trim()) {
      setError('Por favor, informe ou selecione o seu nome de motorista.')
      return
    }
    try {
      loginDriver(driverName)
      setDriver(driverName.trim())
      if (onLoginSuccess) onLoginSuccess()
    } catch (err) {
      setError(err.message || 'Erro ao entrar.')
    }
  }

  const handleAdminSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await loginAdmin(email, password)
      if (onLoginSuccess) onLoginSuccess()
    } catch (err) {
      setError('Credenciais inválidas. Verifique o seu e-mail e palavra-passe.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Neon Glow Orbs (Low-Light Cyberpunk) */}
      {!isExcel && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[100px]" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-600/15 rounded-full blur-[100px]" />
        </div>
      )}

      <div
        className={`rise relative w-full max-w-md rounded-3xl p-6 sm:p-8 backdrop-blur-xl transition-all shadow-2xl ${
          isExcel
            ? 'bg-[#ece9d8] border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-mono text-slate-900'
            : 'bg-slate-950/85 border border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.22)] text-slate-100'
        }`}
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div
            className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl transition ${
              isExcel
                ? 'bg-emerald-800 text-white border-2 border-emerald-950'
                : 'bg-slate-900 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
            }`}
          >
            <Truck size={34} className={isExcel ? '' : 'drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]'} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Van<span className={isExcel ? 'text-emerald-800' : 'text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.7)]'}>Shift</span>
          </h1>
          <p className="text-xs sm:text-sm opacity-70 mt-1">
            Gestão Diária de Escalas, Rotas & Carrinhas
          </p>
        </div>

        {/* Mode Selector Tabs (Driver Quick Access vs Admin Portal) */}
        <div
          className={`flex rounded-xl p-1 mb-6 border transition ${
            isExcel
              ? 'bg-[#d4d0c8] border-slate-400'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => { setMode('driver'); setError('') }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
              mode === 'driver'
                ? isExcel
                  ? 'bg-emerald-800 text-white shadow-inner'
                  : 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <User size={16} />
            <span>Motorista</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('admin'); setError('') }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
              mode === 'admin'
                ? isExcel
                  ? 'bg-emerald-800 text-white shadow-inner'
                  : 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Lock size={16} />
            <span>Administrador</span>
          </button>
        </div>

        {error && (
          <div
            className={`mb-5 flex items-center gap-2.5 rounded-xl border p-3.5 text-xs sm:text-sm ${
              isExcel
                ? 'bg-red-50 border-red-400 text-red-900'
                : 'border-red-400/40 bg-red-500/15 text-red-200'
            }`}
          >
            <AlertCircle size={18} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* DRIVER QUICK-ACCESS FORM */}
        {mode === 'driver' && (
          <form onSubmit={handleDriverSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider opacity-80">
                O seu Nome de Motorista
              </label>
              <div className="relative">
                <input
                  list="login-drivers"
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Selecione ou escreva o seu nome..."
                  autoComplete="name"
                  className={`w-full px-4 py-3.5 rounded-xl text-sm font-semibold outline-none transition ${
                    isExcel
                      ? 'bg-white border border-slate-500 text-slate-900 focus:border-emerald-700'
                      : 'bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                  }`}
                />
                <datalist id="login-drivers">
                  {knownDrivers.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <p className="mt-1.5 text-[11px] opacity-60">
                Acesso direto sem necessidade de password. O seu perfil será memorizado.
              </p>
            </div>

            <button
              type="submit"
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition cursor-pointer ${
                isExcel
                  ? 'bg-emerald-800 hover:bg-emerald-700 text-white border-2 border-emerald-950'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
              }`}
            >
              <span>Entrar no VanShift</span>
              <ArrowRight size={17} />
            </button>
          </form>
        )}

        {/* ADMIN CREDENTIALS FORM */}
        {mode === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider opacity-80">
                E-mail de Administrador
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vanshift.com"
                required
                className={`w-full px-4 py-3.5 rounded-xl text-sm font-semibold outline-none transition ${
                  isExcel
                    ? 'bg-white border border-slate-500 text-slate-900 focus:border-emerald-700'
                    : 'bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                }`}
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider opacity-80">
                Palavra-passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full px-4 py-3.5 rounded-xl text-sm font-semibold outline-none transition ${
                  isExcel
                    ? 'bg-white border border-slate-500 text-slate-900 focus:border-emerald-700'
                    : 'bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition disabled:opacity-50 cursor-pointer ${
                isExcel
                  ? 'bg-emerald-800 hover:bg-emerald-700 text-white border-2 border-emerald-950'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
              }`}
            >
              {busy ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>A autenticar…</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Aceder ao Painel Admin</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-700/30 text-center text-[11px] opacity-60">
          VanShift Fleet Management · Firebase Cloud Firestore
        </div>
      </div>
    </div>
  )
}
