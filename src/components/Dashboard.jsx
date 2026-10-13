import { useEffect, useMemo, useState } from 'react'
import { Truck, Route, Clock, StickyNote, CalendarDays, User, Loader2, Moon, AlertTriangle, Sparkles, Repeat, FileSpreadsheet, Megaphone, X } from 'lucide-react'
import { fetchSchedule, fetchAllSchedules, fetchAnnouncement, todayISO } from '../lib/schedule'
import { useApp } from '../context/AppContext'

const isOff = (r) => /^(off|folga|day off)$/i.test(r.vehicle) || /^(off|folga)$/i.test(r.route)

const NEON_TONES = {
  cyan: {
    box: 'from-cyan-950/50 via-slate-900/90 to-slate-950 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)]',
    label: 'text-cyan-300',
    icon: 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]',
    value: 'text-white drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]',
  },
  violet: {
    box: 'from-purple-950/50 via-slate-900/90 to-slate-950 border-violet-500/40 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:border-violet-400 hover:shadow-[0_0_25px_rgba(168,85,247,0.35)]',
    label: 'text-violet-300',
    icon: 'bg-violet-500/20 text-violet-300 shadow-[0_0_12px_rgba(168,85,247,0.5)]',
    value: 'text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]',
  },
  emerald: {
    box: 'from-emerald-950/50 via-slate-900/90 to-slate-950 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.35)]',
    label: 'text-emerald-300',
    icon: 'bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    value: 'text-white drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]',
  },
  amber: {
    box: 'from-amber-950/50 via-slate-900/90 to-slate-950 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.35)]',
    label: 'text-amber-300',
    icon: 'bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
    value: 'text-white drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]',
  },
  pink: {
    box: 'from-pink-950/50 via-slate-900/90 to-slate-950 border-pink-500/40 shadow-[0_0_20px_rgba(236,72,153,0.2)] hover:border-pink-400 hover:shadow-[0_0_25px_rgba(236,72,153,0.35)]',
    label: 'text-pink-300',
    icon: 'bg-pink-500/20 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.5)]',
    value: 'text-white drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]',
  },
}

function NeonCard({ icon: Icon, label, value, tone, wide, badge }) {
  const t = NEON_TONES[tone]
  return (
    <div
      className={`rise flex items-center justify-between gap-4 rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-md transition ${t.box} ${
        wide ? 'sm:col-span-2' : ''
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${t.icon}`}>
          <Icon size={28} />
        </div>
        <div className="min-w-0">
          <div className={`text-xs font-bold uppercase tracking-wider ${t.label}`}>{label}</div>
          <div className={`mt-1 whitespace-pre-wrap break-words text-3xl font-black ${t.value}`}>
            {value || '—'}
          </div>
        </div>
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  )
}

export default function Dashboard() {
  const { theme, t, driver, setDriver, setAllDrivers } = useApp()
  const [date, setDate] = useState(todayISO())
  const [schedule, setSchedule] = useState(null)
  const [allSchedules, setAllSchedules] = useState([])
  const [announcement, setAnnouncement] = useState(null)
  const [dismissedNotice, setDismissedNotice] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isExcel = theme === 'excel'

  useEffect(() => {
    fetchAllSchedules().then(setAllSchedules).catch(() => {})
    fetchAnnouncement().then((data) => {
      if (data && data.active && data.message) setAnnouncement(data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchSchedule(date)
      .then((s) => !cancelled && setSchedule(s))
      .catch((e) => !cancelled && setError(e.message || 'Failed to load schedule.'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [date])

  const rows = schedule?.rows ?? []
  const names = useMemo(() => {
    const fromCurrent = rows.map((r) => r.driver)
    const fromAll = allSchedules.flatMap((s) => s.rows?.map((r) => r.driver) || [])
    return [...new Set([...fromCurrent, ...fromAll])].filter(Boolean).sort((a, b) => a.localeCompare(b))
  }, [rows, allSchedules])

  useEffect(() => {
    if (names.length > 0) setAllDrivers(names)
  }, [names, setAllDrivers])

  const entry = rows.find((r) => r.driver.toLowerCase() === driver.toLowerCase())

  const routeStats = useMemo(() => {
    if (!entry?.route || !driver) return null
    const normName = driver.trim().toLowerCase()
    const shifts = allSchedules
      .filter((s) => s.date < date)
      .map((s) => ({ date: s.date, row: s.rows?.find((r) => r.driver.toLowerCase() === normName) }))
      .filter((x) => x.row && x.row.route)
    const countBefore = shifts.filter((s) => s.row.route.trim().toLowerCase() === entry.route.trim().toLowerCase()).length
    return {
      timesBefore: countBefore,
      isNew: countBefore === 0,
    }
  }, [allSchedules, entry, driver, date])

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      {/* Broadcast Announcement Banner */}
      {announcement && !dismissedNotice && (
        <div
          className={`rise p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-lg transition ${
            announcement.level === 'urgent'
              ? isExcel
                ? 'bg-red-100 border-2 border-red-600 text-red-950 font-mono'
                : 'border-pink-500/60 bg-pink-500/20 text-pink-100 shadow-[0_0_20px_rgba(236,72,153,0.35)] animate-pulse'
              : announcement.level === 'warning'
              ? isExcel
                ? 'bg-amber-100 border-2 border-amber-600 text-amber-950 font-mono'
                : 'border-amber-400/60 bg-amber-500/20 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
              : isExcel
              ? 'bg-emerald-100 border-2 border-emerald-600 text-emerald-950 font-mono'
              : 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                announcement.level === 'urgent'
                  ? 'bg-pink-500 text-white'
                  : announcement.level === 'warning'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-cyan-500 text-slate-950'
              }`}
            >
              <Megaphone size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-wider opacity-80">
                {announcement.level === 'urgent'
                  ? 'Aviso Urgente da Frota'
                  : announcement.level === 'warning'
                  ? 'Aviso Importante'
                  : 'Comunicado Geral'}
              </div>
              <p className="text-xs sm:text-sm font-bold whitespace-pre-wrap">{announcement.message}</p>
            </div>
          </div>
          <button
            onClick={() => setDismissedNotice(true)}
            className="p-1 rounded-lg opacity-70 hover:opacity-100 transition shrink-0 cursor-pointer"
            title="Fechar aviso"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Date & Driver Filter Controls */}
      <div
        className={`p-4 rounded-2xl border transition ${
          isExcel
            ? 'bg-[#ece9d8] border-2 border-slate-400 font-mono text-slate-900 shadow-sm'
            : 'bg-slate-950/70 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.12)]'
        }`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span
              className={`mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
                isExcel ? 'text-emerald-800' : 'text-cyan-300'
              }`}
            >
              <CalendarDays size={15} /> {t('date')}
            </span>
            <input
              id="date-picker"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold outline-none transition ${
                isExcel
                  ? 'bg-white border border-slate-500 text-slate-900 focus:border-emerald-700'
                  : 'bg-slate-900/90 border border-slate-700 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
              }`}
            />
          </label>

          <label className="block">
            <span
              className={`mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
                isExcel ? 'text-emerald-800' : 'text-cyan-300'
              }`}
            >
              <User size={15} /> {t('driver')}
            </span>
            <input
              id="driver-select"
              list="drivers"
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
            <datalist id="drivers">
              {names.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </label>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className={`animate-spin ${isExcel ? 'text-emerald-800' : 'text-cyan-400'}`} size={32} />
        </div>
      )}

      {error && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 ${
            isExcel
              ? 'bg-red-100 border-red-400 text-red-900 font-mono text-sm'
              : 'border-red-400/40 bg-red-500/15 text-red-200'
          }`}
        >
          <AlertTriangle size={20} className="shrink-0" /> {error}
        </div>
      )}

      {!loading && !error && !schedule && (
        <div
          className={`rise rounded-2xl border p-8 text-center ${
            isExcel
              ? 'bg-white border-2 border-slate-400 text-slate-800 font-mono'
              : 'border-cyan-500/20 bg-slate-950/80 text-slate-300 shadow-[0_0_15px_rgba(6,182,212,0.08)]'
          }`}
        >
          {t('noScheduleForDate')} <b>{date}</b>.
        </div>
      )}

      {!loading && schedule && !driver && (
        <div
          className={`rise rounded-2xl border p-8 text-center ${
            isExcel
              ? 'bg-white border-2 border-slate-400 text-slate-800 font-mono'
              : 'border-cyan-500/20 bg-slate-950/80 text-slate-300 shadow-[0_0_15px_rgba(6,182,212,0.08)]'
          }`}
        >
          {t('selectNamePrompt')}
        </div>
      )}

      {!loading && schedule && driver && !entry && (
        <div
          className={`rise rounded-2xl border p-8 text-center ${
            isExcel
              ? 'bg-amber-50 border-2 border-amber-400 text-amber-900 font-mono'
              : 'border-amber-400/30 bg-amber-500/15 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
          }`}
        >
          <Moon className="mx-auto mb-3" size={32} />
          <p className="text-lg font-bold">{t('notScheduledTitle')}</p>
          <p className="text-sm opacity-80 mt-1">{t('notScheduledDesc')}</p>
        </div>
      )}

      {!loading && entry && isOff(entry) && (
        <div
          className={`rise rounded-2xl border p-8 text-center ${
            isExcel
              ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-mono'
              : 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
          }`}
        >
          <Moon className="mx-auto mb-3" size={32} />
          <p className="text-xl font-extrabold">{t('offToday')}</p>
        </div>
      )}

      {/* SHIFT DATA DISPLAY */}
      {!loading && entry && !isOff(entry) && (
        <>
          {/* THEME A: Retro Excel Style - Classic Spreadsheet Table */}
          {isExcel ? (
            <div className="rise bg-white border-2 border-slate-500 shadow-md font-mono text-sm overflow-hidden">
              <div className="bg-emerald-900 text-white px-3 py-1.5 flex items-center justify-between font-bold text-xs">
                <span>[SHEET1: SHIFT_ASSIGNMENT]</span>
                <span>{driver} · {date}</span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#ece9d8] text-slate-800 text-xs border-b border-slate-400">
                    <th className="w-12 border-r border-slate-400 py-1 text-center font-bold">#</th>
                    <th className="w-40 border-r border-slate-400 px-3 py-1 text-left font-bold">COLUMN [A]</th>
                    <th className="border-r border-slate-400 px-3 py-1 text-left font-bold">VALUE [B]</th>
                    <th className="w-36 px-3 py-1 text-left font-bold">METRIC [C]</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  <tr className="hover:bg-emerald-50/70">
                    <td className="bg-[#ece9d8] text-center font-bold text-xs text-slate-600 border-r border-slate-400 py-2.5">1</td>
                    <td className="px-3 py-2.5 font-bold text-slate-700 border-r border-slate-300">{t('van')}</td>
                    <td className="px-3 py-2.5 font-black text-slate-900 text-lg border-r border-slate-300">{entry.vehicle || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">ASSIGNED_VEHICLE</td>
                  </tr>
                  <tr className="hover:bg-emerald-50/70 bg-slate-50/50">
                    <td className="bg-[#ece9d8] text-center font-bold text-xs text-slate-600 border-r border-slate-400 py-2.5">2</td>
                    <td className="px-3 py-2.5 font-bold text-slate-700 border-r border-slate-300">{t('route')}</td>
                    <td className="px-3 py-2.5 font-black text-slate-900 text-lg border-r border-slate-300 flex items-center justify-between">
                      <span>{entry.route || '—'}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-bold text-emerald-800">
                      {routeStats?.isNew ? '★ NEW_ROUTE' : `${routeStats?.timesBefore || 0}x DONE`}
                    </td>
                  </tr>
                  <tr className="hover:bg-emerald-50/70">
                    <td className="bg-[#ece9d8] text-center font-bold text-xs text-slate-600 border-r border-slate-400 py-2.5">3</td>
                    <td className="px-3 py-2.5 font-bold text-slate-700 border-r border-slate-300">{t('earliestStart')}</td>
                    <td className="px-3 py-2.5 font-bold text-emerald-700 border-r border-slate-300">{entry.earliestStart || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">TIME_EARLIEST</td>
                  </tr>
                  <tr className="hover:bg-emerald-50/70 bg-slate-50/50">
                    <td className="bg-[#ece9d8] text-center font-bold text-xs text-slate-600 border-r border-slate-400 py-2.5">4</td>
                    <td className="px-3 py-2.5 font-bold text-slate-700 border-r border-slate-300">{t('latestStart')}</td>
                    <td className="px-3 py-2.5 font-bold text-amber-700 border-r border-slate-300">{entry.latestStart || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">TIME_LATEST</td>
                  </tr>
                  <tr className="hover:bg-emerald-50/70">
                    <td className="bg-[#ece9d8] text-center font-bold text-xs text-slate-600 border-r border-slate-400 py-2.5">5</td>
                    <td className="px-3 py-2.5 font-bold text-slate-700 border-r border-slate-300">{t('handoverNotes')}</td>
                    <td colSpan={2} className="px-3 py-2.5 text-slate-800 whitespace-pre-wrap font-sans text-xs">
                      {entry.notes || '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="bg-[#ece9d8] text-slate-600 px-3 py-1 text-[11px] border-t border-slate-400 flex justify-between">
                <span>Cells: 5 | Calculation: Automatic</span>
                <span>STATUS: OK</span>
              </div>
            </div>
          ) : (
            /* THEME B: Dark Neon Glow Cards */
            <div className="grid gap-4 sm:grid-cols-2">
              <NeonCard icon={Truck} label={t('van')} value={entry.vehicle} tone="cyan" />
              <NeonCard
                icon={Route}
                label={t('route')}
                value={entry.route}
                tone="violet"
                badge={
                  routeStats ? (
                    routeStats.isNew ? (
                      <span className="flex items-center gap-1 rounded-full bg-pink-500/20 border border-pink-400/60 px-3 py-1 text-xs font-bold text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.5)] animate-pulse">
                        <Sparkles size={13} /> {t('newRouteBadge')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-violet-500/20 border border-violet-400/50 px-3 py-1 text-xs font-bold text-violet-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                        <Repeat size={13} /> {routeStats.timesBefore}× {t('doneTimesBadge')}
                      </span>
                    )
                  ) : null
                }
              />
              <NeonCard icon={Clock} label={t('earliestStart')} value={entry.earliestStart} tone="emerald" />
              <NeonCard icon={Clock} label={t('latestStart')} value={entry.latestStart} tone="amber" />
              <NeonCard icon={StickyNote} label={t('handoverNotes')} value={entry.notes} tone="pink" wide />
            </div>
          )}
        </>
      )}
    </section>
  )
}
