import { useEffect, useMemo, useState, useCallback } from 'react'
import { BarChart3, CalendarCheck, Map, Repeat, Sparkles, Truck, User, Loader2, AlertTriangle, Trophy, Plus, FileSpreadsheet } from 'lucide-react'
import { fetchAllSchedules, computeStats } from '../lib/schedule'
import { useApp } from '../context/AppContext'
import UploadModal from './UploadModal'

const fmt = (iso) => {
  if (!iso) return ''
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function NeonStat({ icon: Icon, label, value, tone }) {
  const tones = {
    cyan: 'from-cyan-950/60 to-slate-900/90 border-cyan-500/40 shadow-[0_0_18px_rgba(6,182,212,0.2)] text-cyan-300',
    violet: 'from-purple-950/60 to-slate-900/90 border-violet-500/40 shadow-[0_0_18px_rgba(168,85,247,0.2)] text-violet-300',
    emerald: 'from-emerald-950/60 to-slate-900/90 border-emerald-500/40 shadow-[0_0_18px_rgba(16,185,129,0.2)] text-emerald-300',
    amber: 'from-amber-950/60 to-slate-900/90 border-amber-500/40 shadow-[0_0_18px_rgba(245,158,11,0.2)] text-amber-300',
  }
  return (
    <div className={`rise rounded-2xl border bg-gradient-to-br p-4.5 backdrop-blur-md ${tones[tone]}`}>
      <Icon size={20} className="mb-2 opacity-90" />
      <div className="text-3xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{value}</div>
      <div className="text-xs font-bold uppercase tracking-wider opacity-80 mt-1">{label}</div>
    </div>
  )
}

export default function Stats({ user }) {
  const { theme, t, driver, setDriver, setAllDrivers } = useApp()
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)

  const isExcel = theme === 'excel'

  const reloadSchedules = useCallback(() => {
    setLoading(true)
    fetchAllSchedules()
      .then(setSchedules)
      .catch((e) => setError(e.message || 'Failed to load history.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reloadSchedules()
  }, [reloadSchedules])

  const names = useMemo(
    () => [...new Set(schedules.flatMap((s) => s.rows?.map((r) => r.driver) || []))].filter(Boolean).sort((a, b) => a.localeCompare(b)),
    [schedules],
  )

  useEffect(() => {
    if (names.length > 0) setAllDrivers(names)
  }, [names, setAllDrivers])

  const stats = useMemo(() => (driver ? computeStats(schedules, driver) : null), [schedules, driver])
  const latest = stats?.shifts.at(-1)
  const top = stats?.routes[0]

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      {/* Top Bar Filter & Action */}
      <div
        className={`p-4 rounded-2xl border transition ${
          isExcel
            ? 'bg-[#ece9d8] border-2 border-slate-400 font-mono text-slate-900 shadow-sm'
            : 'bg-slate-950/70 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.12)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <label className="block flex-1">
            <span
              className={`mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
                isExcel ? 'text-emerald-800' : 'text-cyan-300'
              }`}
            >
              <User size={15} /> {t('driver')}
            </span>
            <input
              list="stats-names"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              placeholder={t('typeOrPickName')}
              autoComplete="off"
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold outline-none transition ${
                isExcel
                  ? 'bg-white border border-slate-500 text-slate-900 focus:border-emerald-700'
                  : 'bg-slate-900/90 border border-slate-700 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
              }`}
            />
            <datalist id="stats-names">
              {names.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </label>

          <button
            onClick={() => setUploadOpen(true)}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition shrink-0 cursor-pointer ${
              isExcel
                ? 'bg-emerald-800 hover:bg-emerald-700 text-white border-2 border-emerald-950 shadow-sm'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
            }`}
          >
            <Plus size={18} /> {t('addSpreadsheetBtn')}
          </button>
        </div>
      </div>

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        user={user}
        onSaved={() => reloadSchedules()}
      />

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className={`animate-spin ${isExcel ? 'text-emerald-800' : 'text-cyan-400'}`} size={32} />
        </div>
      )}

      {error && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 ${
            isExcel ? 'bg-red-100 border-red-400 text-red-900 font-mono text-sm' : 'border-red-400/30 bg-red-500/10 text-red-200'
          }`}
        >
          <AlertTriangle size={20} className="shrink-0" /> {error}
        </div>
      )}

      {!loading && !error && !driver && (
        <div
          className={`rounded-2xl border p-8 text-center ${
            isExcel ? 'bg-white border-2 border-slate-400 text-slate-800 font-mono' : 'border-cyan-500/20 bg-slate-950/80 text-slate-300'
          }`}
        >
          {t('selectNamePrompt')}
        </div>
      )}

      {stats && stats.totalDays === 0 && !loading && (
        <div
          className={`rounded-2xl border p-8 text-center ${
            isExcel
              ? 'bg-amber-50 border-2 border-amber-400 text-amber-900 font-mono'
              : 'border-amber-300/30 bg-amber-400/10 text-amber-100'
          }`}
        >
          No shifts found for this name in {stats.daysScanned} saved schedule(s).
        </div>
      )}

      {stats && stats.totalDays > 0 && (
        <>
          {/* STATS COUNTERS */}
          {isExcel ? (
            /* Retro Excel Formula / Metric Table */
            <div className="rise bg-white border-2 border-slate-500 shadow-md font-mono text-xs overflow-hidden">
              <div className="bg-emerald-900 text-white px-3 py-1 font-bold">
                [SHEET2: HISTORICAL_KPI_SUMMARY]
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#ece9d8] text-slate-800 border-b border-slate-400">
                    <th className="w-12 border-r border-slate-400 py-1 text-center font-bold">#</th>
                    <th className="border-r border-slate-400 px-3 py-1 text-left font-bold">FORMULA_METRIC</th>
                    <th className="border-r border-slate-400 px-3 py-1 text-right font-bold">RESULT</th>
                    <th className="px-3 py-1 text-left font-bold">DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  <tr>
                    <td className="bg-[#ece9d8] text-center font-bold text-slate-600 border-r border-slate-400 py-2">1</td>
                    <td className="px-3 py-2 font-bold text-slate-700 border-r border-slate-300">=COUNT_DAYS(SHIFTS)</td>
                    <td className="px-3 py-2 font-black text-slate-900 text-base text-right border-r border-slate-300">{stats.totalDays}</td>
                    <td className="px-3 py-2 text-slate-500">{t('daysWorked')}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="bg-[#ece9d8] text-center font-bold text-slate-600 border-r border-slate-400 py-2">2</td>
                    <td className="px-3 py-2 font-bold text-slate-700 border-r border-slate-300">=DISTINCT_COUNT(ROUTES)</td>
                    <td className="px-3 py-2 font-black text-slate-900 text-base text-right border-r border-slate-300">{stats.routes.length}</td>
                    <td className="px-3 py-2 text-slate-500">{t('diffRoutes')}</td>
                  </tr>
                  <tr>
                    <td className="bg-[#ece9d8] text-center font-bold text-slate-600 border-r border-slate-400 py-2">3</td>
                    <td className="px-3 py-2 font-bold text-slate-700 border-r border-slate-300">=DISTINCT_COUNT(VANS)</td>
                    <td className="px-3 py-2 font-black text-slate-900 text-base text-right border-r border-slate-300">{stats.vans.length}</td>
                    <td className="px-3 py-2 text-slate-500">{t('diffVans')}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="bg-[#ece9d8] text-center font-bold text-slate-600 border-r border-slate-400 py-2">4</td>
                    <td className="px-3 py-2 font-bold text-slate-700 border-r border-slate-300">=MODE(ROUTES)</td>
                    <td className="px-3 py-2 font-black text-emerald-800 text-base text-right border-r border-slate-300">{top?.route ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{t('topRoute')} ({top?.count || 0}x)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* Dark Neon Glow Counters */
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <NeonStat icon={CalendarCheck} label={t('daysWorked')} value={stats.totalDays} tone="cyan" />
              <NeonStat icon={Map} label={t('diffRoutes')} value={stats.routes.length} tone="violet" />
              <NeonStat icon={Truck} label={t('diffVans')} value={stats.vans.length} tone="emerald" />
              <NeonStat icon={Trophy} label={`${t('topRoute')}${top ? ` (${top.count}×)` : ''}`} value={top?.route ?? '—'} tone="amber" />
            </div>
          )}

          {/* LATEST SHIFT BANNER */}
          {latest && (
            <div
              className={`rise flex items-center gap-3.5 rounded-2xl border p-4.5 ${
                isExcel
                  ? 'bg-emerald-50 border-2 border-emerald-600 font-mono text-emerald-950 text-xs'
                  : latest.isNew
                  ? 'border-pink-500/40 bg-pink-500/15 text-pink-200 shadow-[0_0_20px_rgba(236,72,153,0.25)]'
                  : 'border-cyan-500/40 bg-cyan-500/15 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
              }`}
            >
              {latest.isNew ? <Sparkles size={24} className="shrink-0" /> : <Repeat size={24} className="shrink-0" />}
              <div>
                <div className="font-bold text-sm sm:text-base">
                  {t('latestShift')} ({fmt(latest.date)}): {t('route')} {latest.route}
                </div>
                <div className="text-xs sm:text-sm opacity-90 mt-0.5">
                  {latest.isNew ? t('firstTimeRoute') : t('doneBefore', { times: latest.timesBefore })}
                </div>
              </div>
            </div>
          )}

          {/* ROUTES FREQUENCY LIST */}
          <div
            className={`overflow-hidden rounded-2xl border ${
              isExcel ? 'bg-white border-2 border-slate-500 font-mono text-xs shadow-md' : 'border-cyan-500/30 bg-slate-950/80 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
            }`}
          >
            <div
              className={`flex items-center gap-2 px-4 py-3 font-bold text-xs uppercase tracking-wider ${
                isExcel ? 'bg-emerald-900 text-white' : 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white'
              }`}
            >
              <BarChart3 size={16} /> {t('routesDoneHeading')}
            </div>
            {stats.routes.map((r, i) => (
              <div
                key={r.route}
                className={`flex items-center justify-between px-4 py-3 border-t ${
                  isExcel
                    ? i % 2
                      ? 'bg-slate-50 border-slate-300'
                      : 'bg-white border-slate-300'
                    : i % 2
                    ? 'bg-violet-950/20 border-white/5 hover:bg-violet-900/30'
                    : 'bg-cyan-950/20 border-white/5 hover:bg-cyan-900/30'
                }`}
              >
                <div>
                  <div className={`font-bold ${isExcel ? 'text-slate-900 text-sm' : 'text-white'}`}>
                    {t('route')} {r.route}
                  </div>
                  <div className="text-xs opacity-60 mt-0.5">
                    {t('lastTime')}: {fmt(r.last)}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black ${
                    isExcel
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  }`}
                >
                  {r.count}×
                </span>
              </div>
            ))}
          </div>

          {/* ALL REPORTS HISTORY */}
          <div
            className={`overflow-hidden rounded-2xl border ${
              isExcel ? 'bg-white border-2 border-slate-500 font-mono text-xs shadow-md' : 'border-cyan-500/30 bg-slate-950/80 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
            }`}
          >
            <div className={`px-4 py-3 font-bold text-xs uppercase tracking-wider ${isExcel ? 'bg-[#ece9d8] text-slate-800 border-b border-slate-400' : 'bg-slate-900 text-white border-b border-white/10'}`}>
              {t('allReportsHeading')}
            </div>
            {[...stats.shifts].reverse().map((s, i) => (
              <div
                key={s.date}
                className={`space-y-1.5 px-4 py-3 border-t transition ${
                  isExcel
                    ? i % 2
                      ? 'bg-slate-50 border-slate-300'
                      : 'bg-white border-slate-300'
                    : i % 2
                    ? 'bg-violet-950/20 border-white/5 hover:bg-violet-900/20'
                    : 'bg-cyan-950/20 border-white/5 hover:bg-cyan-900/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`font-bold ${isExcel ? 'text-slate-900' : 'text-white'}`}>
                    {fmt(s.date)} · {t('route')} {s.route}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      s.isNew
                        ? isExcel
                          ? 'bg-pink-100 text-pink-900 border border-pink-400'
                          : 'bg-pink-500/20 text-pink-300 border border-pink-400/50'
                        : isExcel
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                    }`}
                  >
                    {s.isNew ? `★ ${t('newRouteBadge')}` : `${s.timesBefore + 1}ª ${t('doneTimesBadge')}`}
                  </span>
                </div>
                <div className={`text-xs ${isExcel ? 'text-slate-600' : 'text-slate-300'}`}>
                  {t('van')} {s.vehicle || '—'} · {s.earliestStart || '—'} – {s.latestStart || '—'}
                </div>
                {s.notes && (
                  <div className={`whitespace-pre-wrap text-xs rounded-lg p-2 mt-1 ${isExcel ? 'bg-slate-100 border border-slate-300 text-slate-700 font-sans' : 'bg-slate-900/90 border border-slate-800 text-slate-400'}`}>
                    {s.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
