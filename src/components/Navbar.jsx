import { useState } from 'react'
import { Truck, BarChart3, Settings, LogOut, Shield } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import SettingsModal from './SettingsModal'

export default function Navbar({ activeTab, onTabChange }) {
  const { theme, t, driver } = useApp()
  const { isAdmin, logout } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const isExcel = theme === 'excel'

  if (isExcel) {
    return (
      <>
        {/* Retro Microsoft Excel 97 Window Frame & Ribbon */}
        <header className="mx-auto mb-4 max-w-4xl font-mono text-xs select-none">
          {/* Windows Title Bar */}
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white px-3 py-1.5 rounded-t-lg border-t-2 border-l-2 border-r-2 border-white/40 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-600 border border-white text-white flex items-center justify-center font-bold text-[10px]">
                X
              </div>
              <span className="font-bold tracking-wide">{t('excelTitle')}</span>
              {isAdmin && (
                <span className="bg-amber-950/80 px-2 py-0.5 rounded text-[10px] text-amber-200 font-bold">
                  [ADMIN]
                </span>
              )}
              {driver && (
                <span className="bg-emerald-950/80 px-2 py-0.5 rounded text-[10px] text-emerald-200">
                  [{driver}]
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSettingsOpen(true)}
                className="px-2 py-0.5 bg-[#ece9d8] text-slate-900 hover:bg-white border border-slate-700 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                title={t('settings')}
              >
                <Settings size={12} />
                <span>Prefs</span>
              </button>
              <button
                onClick={logout}
                className="px-2 py-0.5 bg-red-100 text-red-900 hover:bg-red-200 border border-red-700 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                title="Terminar Sessão"
              >
                <LogOut size={12} />
                <span>Sair</span>
              </button>
            </div>
          </div>

          {/* Excel Menu Bar */}
          <div className="flex items-center justify-between bg-[#ece9d8] text-slate-800 px-3 py-1 border-x-2 border-slate-400 border-b border-slate-300">
            <div className="flex items-center gap-3">
              {[
                t('excelFile'),
                t('excelEdit'),
                t('excelView'),
                t('excelInsert'),
                t('excelFormat'),
                t('excelTools'),
                t('excelData'),
                t('excelHelp'),
              ].map((m) => (
                <span key={m} className="hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded cursor-pointer">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Excel Formula Bar */}
          <div className="flex items-center gap-2 bg-white text-slate-900 px-3 py-1.5 border-x-2 border-b-2 border-slate-400">
            <div className="w-14 px-1 bg-slate-100 border border-slate-400 text-center font-bold text-[11px]">
              {activeTab === 'dashboard' ? 'A1' : activeTab === 'stats' ? 'B1' : 'C1'}
            </div>
            <div className="font-serif italic font-bold text-slate-500 px-1 select-none">
              {t('excelFormulaLabel')}
            </div>
            <div className="flex-1 px-2 py-0.5 bg-slate-50 border border-slate-300 text-slate-800 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
              {activeTab === 'dashboard'
                ? `=GET_SHIFT("${driver || 'ALL'}", TODAY())`
                : activeTab === 'stats'
                ? `=CALC_HISTORY("${driver || 'ALL'}")`
                : `=IMPORT_EXCEL(FILE, FIRESTORE)`}
            </div>
          </div>

          {/* Workbook Sheet Tabs (Our actual navigation) */}
          <div className="flex items-center gap-1 bg-[#d4d0c8] px-3 pt-1 border-x-2 border-b-2 border-slate-400">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`px-4 py-1.5 text-xs font-bold rounded-t border-t-2 border-x-2 cursor-pointer transition ${
                activeTab === 'dashboard'
                  ? 'bg-white text-emerald-900 border-t-emerald-700 border-x-slate-500 -mb-[2px] z-10'
                  : 'bg-[#ece9d8] text-slate-700 border-slate-400 hover:bg-white/70'
              }`}
            >
              📄 {t('myShift')}
            </button>
            <button
              onClick={() => onTabChange('stats')}
              className={`px-4 py-1.5 text-xs font-bold rounded-t border-t-2 border-x-2 cursor-pointer transition ${
                activeTab === 'stats'
                  ? 'bg-white text-emerald-900 border-t-emerald-700 border-x-slate-500 -mb-[2px] z-10'
                  : 'bg-[#ece9d8] text-slate-700 border-slate-400 hover:bg-white/70'
              }`}
            >
              📊 {t('myRoutes')}
            </button>
            <button
              onClick={() => onTabChange('admin')}
              className={`px-4 py-1.5 text-xs font-bold rounded-t border-t-2 border-x-2 cursor-pointer transition ${
                activeTab === 'admin'
                  ? 'bg-white text-emerald-900 border-t-emerald-700 border-x-slate-500 -mb-[2px] z-10'
                  : 'bg-[#ece9d8] text-slate-700 border-slate-400 hover:bg-white/70'
              }`}
            >
              ⚙️ {t('admin')}
            </button>
          </div>
        </header>

        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </>
    )
  }

  // Dark Neon Glow Style
  return (
    <>
      <header className="mx-auto mb-6 flex max-w-3xl items-center justify-between gap-3">
        {/* Logo with Neon Glow */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('dashboard')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-cyan-500/40 shadow-[0_0_18px_rgba(6,182,212,0.4)]">
            <Truck className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center">
                Van<span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.7)]">Shift</span>
              </h1>
              {isAdmin && (
                <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                  <Shield size={10} /> Admin
                </span>
              )}
            </div>
            {driver && (
              <p className="text-[11px] text-cyan-300/80 font-medium tracking-wide truncate max-w-[140px] sm:max-w-[200px]">
                {driver}
              </p>
            )}
          </div>
        </div>

        {/* Navigation Tabs + Action Icons */}
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1 rounded-full border border-cyan-500/30 bg-slate-950/80 p-1 shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-md">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <Truck size={15} />
              <span>{t('myShift')}</span>
            </button>

            <button
              onClick={() => onTabChange('stats')}
              className={`flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <BarChart3 size={15} />
              <span>{t('myRoutes')}</span>
            </button>

            <button
              onClick={() => onTabChange('admin')}
              className={`flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <Settings size={15} />
              <span>{t('admin')}</span>
            </button>
          </nav>

          {/* Settings Gear Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label={t('settings')}
            className="p-2.5 rounded-full border border-cyan-500/30 bg-slate-950/80 text-cyan-300 hover:text-white hover:border-cyan-400 hover:shadow-[0_0_18px_rgba(6,182,212,0.4)] transition backdrop-blur-md cursor-pointer"
          >
            <Settings size={18} />
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            aria-label="Terminar Sessão"
            title="Terminar Sessão"
            className="p-2.5 rounded-full border border-red-500/30 bg-slate-950/80 text-red-400 hover:text-white hover:border-red-400 hover:bg-red-500/20 hover:shadow-[0_0_18px_rgba(239,68,68,0.4)] transition backdrop-blur-md cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
