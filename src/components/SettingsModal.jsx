import { useState } from 'react'
import { Settings, User, Languages, Palette, X, Check, Zap, Table, CheckCircle2, LogOut, QrCode, Smartphone } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import QrModal from './QrModal'

export default function SettingsModal({ isOpen, onClose }) {
  const { theme, setTheme, lang, setLang, driver, setDriver, allDrivers, t } = useApp()
  const { logout } = useAuth()
  const [driverInput, setDriverInput] = useState(driver)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)

  if (!isOpen) return null

  const handleSaveDriver = (name) => {
    setDriverInput(name)
    setDriver(name)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 1500)
  }

  const isExcel = theme === 'excel'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
      <div
        className={`rise relative w-full max-w-md rounded-2xl shadow-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto transition-all ${
          isExcel
            ? 'bg-[#ece9d8] text-slate-900 font-mono border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
            : 'bg-slate-950 text-slate-100 border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
        }`}
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl ${
                isExcel ? 'bg-emerald-800 text-white' : 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              }`}
            >
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">{t('settingsTitle')}</h2>
              <p className="text-xs opacity-70">VanShift Preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${
              isExcel
                ? 'bg-[#d4d0c8] hover:bg-[#c0bca8] border border-slate-600 text-slate-900'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          {/* 1. Driver Profile / Name Selector */}
          <div className={`p-4 rounded-xl border ${isExcel ? 'bg-white border-slate-400' : 'bg-slate-900/80 border-slate-800'}`}>
            <label className="block mb-2">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-80 mb-1">
                <User size={15} className={isExcel ? 'text-emerald-700' : 'text-cyan-400'} />
                {t('activeDriver')}
              </span>
              <div className="relative mt-1">
                <input
                  list="settings-driver-list"
                  type="text"
                  value={driverInput}
                  onChange={(e) => handleSaveDriver(e.target.value)}
                  placeholder={t('selectDriverPrompt')}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none transition ${
                    isExcel
                      ? 'bg-slate-50 border border-slate-500 text-slate-900 focus:border-emerald-700'
                      : 'bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                  }`}
                />
                <datalist id="settings-driver-list">
                  {allDrivers.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
            </label>

            {driver ? (
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="opacity-75">
                  Perfil ativo: <b className={isExcel ? 'text-emerald-700' : 'text-cyan-300'}>{driver}</b>
                </span>
                {savedSuccess && (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 size={13} /> Gravado
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs opacity-60 mt-1">{t('noDriverSelected')}</p>
            )}
          </div>

          {/* 2. Language Switcher */}
          <div className={`p-4 rounded-xl border ${isExcel ? 'bg-white border-slate-400' : 'bg-slate-900/80 border-slate-800'}`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-80 mb-3">
              <Languages size={15} className={isExcel ? 'text-emerald-700' : 'text-cyan-400'} />
              {t('language')}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition border ${
                  lang === 'en'
                    ? isExcel
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-inner'
                      : 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : isExcel
                    ? 'bg-[#ece9d8] text-slate-800 border-slate-400 hover:bg-[#dfdbca]'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>🇬🇧</span>
                <span>English</span>
                {lang === 'en' && <Check size={14} className="ml-auto" />}
              </button>

              <button
                type="button"
                onClick={() => setLang('pt')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition border ${
                  lang === 'pt'
                    ? isExcel
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-inner'
                      : 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : isExcel
                    ? 'bg-[#ece9d8] text-slate-800 border-slate-400 hover:bg-[#dfdbca]'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>🇵🇹</span>
                <span>Português</span>
                {lang === 'pt' && <Check size={14} className="ml-auto" />}
              </button>
            </div>
          </div>

          {/* 3. App Theme Switcher */}
          <div className={`p-4 rounded-xl border ${isExcel ? 'bg-white border-slate-400' : 'bg-slate-900/80 border-slate-800'}`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-80 mb-3">
              <Palette size={15} className={isExcel ? 'text-emerald-700' : 'text-cyan-400'} />
              {t('theme')}
            </div>

            <div className="space-y-2.5">
              {/* Option A: Dark Neon Glow */}
              <button
                type="button"
                onClick={() => setTheme('neon')}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${
                  theme === 'neon'
                    ? 'bg-slate-950 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] text-white'
                    : isExcel
                    ? 'bg-[#ece9d8] text-slate-800 border-slate-400 hover:bg-[#e0dccb]'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5 p-2 rounded-lg bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                  <Zap size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-cyan-300">Dark Neon Glow</span>
                    {theme === 'neon' && <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold">Ativo</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{t('themeNeonDesc')}</p>
                </div>
              </button>

              {/* Option B: Retro Excel Theme */}
              <button
                type="button"
                onClick={() => setTheme('excel')}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${
                  theme === 'excel'
                    ? 'bg-emerald-900/30 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-emerald-200'
                    : isExcel
                    ? 'bg-[#ece9d8] text-slate-800 border-slate-400 hover:bg-[#e0dccb]'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5 p-2 rounded-lg bg-emerald-600/20 text-emerald-400">
                  <Table size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-400 font-mono">Retro Excel (1997)</span>
                    {theme === 'excel' && <span className="text-xs bg-emerald-600/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">Ativo</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{t('themeExcelDesc')}</p>
                </div>
              </button>
            </div>
          </div>

          {/* 4. Open on Mobile (QR Code) */}
          <div className={`p-4 rounded-xl border ${isExcel ? 'bg-white border-slate-400' : 'bg-slate-900/80 border-slate-800'}`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-80 mb-2.5">
              <QrCode size={15} className={isExcel ? 'text-emerald-700' : 'text-cyan-400'} />
              <span>{t('openOnMobile')}</span>
            </div>

            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                isExcel
                  ? 'bg-[#ece9d8] text-slate-800 border-slate-400 hover:bg-[#dfdbca]'
                  : 'bg-slate-950/80 border-cyan-500/30 text-white hover:border-cyan-400 hover:shadow-[0_0_18px_rgba(6,182,212,0.25)]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isExcel
                      ? 'bg-emerald-800 text-white'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_10px_rgba(6,182,212,0.35)]'
                  }`}
                >
                  <Smartphone size={18} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                    <span>📱 {t('openOnMobile')}</span>
                  </div>
                  <p className="text-xs opacity-70 mt-0.5 truncate">
                    {t('openOnMobileDesc')}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition ${
                  isExcel
                    ? 'bg-emerald-800 text-white'
                    : 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                }`}
              >
                QR Code
              </span>
            </button>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="mt-6 pt-3 border-t border-slate-700/40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              logout()
              onClose()
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl font-bold text-xs border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition cursor-pointer"
            title="Terminar Sessão / Alterar Perfil"
          >
            <LogOut size={15} />
            <span>Sair</span>
          </button>
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition cursor-pointer ${
              isExcel
                ? 'bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-900'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
            }`}
          >
            {t('close')}
          </button>
        </div>
      </div>

      {/* Mobile QR Scanner Modal */}
      <QrModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />
    </div>
  )
}
