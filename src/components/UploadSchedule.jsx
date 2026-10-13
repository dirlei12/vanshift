import { useState, useRef, useEffect } from 'react'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { UploadCloud, FileSpreadsheet, Save, Loader2, LogOut, CheckCircle2, AlertTriangle, Lock, Truck, Route, Clock, StickyNote, Copy, User, ChevronDown, Table2, Sparkles } from 'lucide-react'
import { auth } from '../firebase'
import { parseScheduleFile } from '../lib/parseSchedule'
import { fetchSchedule, saveSchedule, todayISO } from '../lib/schedule'
import { useApp } from '../context/AppContext'

const fmt = (iso) => {
  if (!iso) return ''
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function Login({ isExcel }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try { await signInWithEmailAndPassword(auth, email, password) }
    catch { setErr('Invalid credentials.') }
    finally { setBusy(false) }
  }

  return (
    <form
      onSubmit={submit}
      className={`mx-auto max-w-sm space-y-3 rounded-2xl border p-6 transition ${
        isExcel
          ? 'bg-[#ece9d8] border-2 border-slate-500 font-mono text-slate-900 shadow-md'
          : 'border-cyan-500/30 bg-slate-950/90 shadow-[0_0_20px_rgba(6,182,212,0.15)] text-white'
      }`}
    >
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Lock size={18} className={isExcel ? 'text-emerald-800' : 'text-cyan-400'} /> Admin Sign In
      </h2>
      <input
        className={`w-full rounded-xl px-4 py-3 outline-none transition text-sm ${
          isExcel
            ? 'bg-white border border-slate-500 text-slate-900'
            : 'border border-slate-700 bg-slate-900/90 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
        }`}
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className={`w-full rounded-xl px-4 py-3 outline-none transition text-sm ${
          isExcel
            ? 'bg-white border border-slate-500 text-slate-900'
            : 'border border-slate-700 bg-slate-900/90 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
        }`}
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {err && <p className="text-xs text-red-400">{err}</p>}
      <button
        disabled={busy}
        className={`w-full rounded-xl py-3 font-bold transition disabled:opacity-50 cursor-pointer ${
          isExcel
            ? 'bg-emerald-800 hover:bg-emerald-700 text-white border-2 border-emerald-950'
            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
        }`}
      >
        {busy ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}

function MyReport({ rows, date, isExcel }) {
  const { driver, setDriver } = useApp()
  const [copied, setCopied] = useState(false)

  const names = [...new Set(rows.map((r) => r.driver))].sort((a, b) => a.localeCompare(b))
  const e = rows.find((r) => r.driver.toLowerCase() === driver.toLowerCase())
  const text = e
    ? `VanShift ${date}\n${e.driver}\nVan: ${e.vehicle}\nRoute: ${e.route}\nEarliest start: ${e.earliestStart}\nLatest start: ${e.latestStart}\nNotes: ${e.notes || '-'}`
    : ''
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ }
  }

  const Row = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
      <Icon size={18} className={`mt-0.5 shrink-0 ${isExcel ? 'text-emerald-800' : 'text-cyan-300'}`} />
      <div>
        <div className="text-xs uppercase font-bold opacity-70">{label}</div>
        <div className="whitespace-pre-wrap text-lg font-bold">{value || '—'}</div>
      </div>
    </div>
  )

  return (
    <div
      className={`rise space-y-4 rounded-2xl border p-5 transition ${
        isExcel
          ? 'bg-[#ece9d8] border-2 border-slate-500 font-mono text-slate-900 shadow-sm'
          : 'border-cyan-500/30 bg-slate-950/80 shadow-[0_0_20px_rgba(6,182,212,0.15)] text-slate-100'
      }`}
    >
      <label className="block">
        <span className={`mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${isExcel ? 'text-emerald-800' : 'text-cyan-300'}`}>
          <User size={15} /> My report – Pick your name
        </span>
        <input
          list="my-names"
          value={driver}
          onChange={(ev) => setDriver(ev.target.value)}
          placeholder="Your name"
          className={`w-full rounded-xl px-4 py-3 outline-none text-sm transition ${
            isExcel
              ? 'bg-white border border-slate-500 text-slate-900'
              : 'border border-slate-700 bg-slate-900/90 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
          }`}
        />
        <datalist id="my-names">{names.map((n) => <option key={n} value={n} />)}</datalist>
      </label>

      {driver && !e && <p className="text-xs text-amber-400">Driver not found in this schedule.</p>}

      {e && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Row icon={Truck} label="Van" value={e.vehicle} />
            <Row icon={Route} label="Route" value={e.route} />
            <Row icon={Clock} label="Earliest start" value={e.earliestStart} />
            <Row icon={Clock} label="Latest start" value={e.latestStart} />
          </div>
          <Row icon={StickyNote} label="Handover / Notes" value={e.notes} />
          <button
            onClick={copy}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              isExcel
                ? 'bg-white hover:bg-slate-100 border border-slate-600 text-slate-900'
                : 'border border-cyan-500/30 bg-slate-900 hover:bg-slate-800 text-cyan-300'
            }`}
          >
            <Copy size={15} /> {copied ? 'Copied!' : 'Copy report'}
          </button>
        </>
      )}
    </div>
  )
}

export default function UploadSchedule({ user }) {
  const { theme, t } = useApp()
  const [date, setDate] = useState('')
  const [dateSource, setDateSource] = useState('')
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(false)
  const [existingSchedule, setExistingSchedule] = useState(null)
  const [msg, setMsg] = useState(null)
  const inputRef = useRef(null)
  const [showTable, setShowTable] = useState(false)

  const isExcel = theme === 'excel'

  if (!user) return <Login isExcel={isExcel} />

  const checkExisting = async (targetDate) => {
    if (!targetDate) return
    setChecking(true)
    try {
      const existing = await fetchSchedule(targetDate)
      setExistingSchedule(existing)
    } catch {
      setExistingSchedule(null)
    } finally {
      setChecking(false)
    }
  }

  const save = async (data = rows, forDate = date) => {
    if (!forDate) return setMsg({ type: 'error', text: 'Selecione uma data para a escala.' })
    setBusy(true); setMsg(null)
    try {
      await saveSchedule(forDate, data)
      setMsg({ type: 'ok', text: `Escala salva com sucesso para ${fmt(forDate)} (${data.length} motoristas)!` })
      setExistingSchedule({ date: forDate, rows: data })
    } catch (e) {
      setMsg({ type: 'error', text: e.message || 'Falha ao salvar a escala.' })
    } finally { setBusy(false) }
  }

  const handleFile = async (file) => {
    if (!file) return
    setMsg(null); setRows([]); setDate(''); setDateSource(''); setExistingSchedule(null)
    if (!/\.xlsx$/i.test(file.name)) return setMsg({ type: 'error', text: 'Por favor, envie um arquivo .xlsx válido.' })
    try {
      setChecking(true)
      const { rows: parsed, date: found } = await parseScheduleFile(file)
      setRows(parsed); setFileName(file.name)
      const finalDate = found || todayISO()
      setDate(finalDate)
      setDateSource(found ? 'file' : 'manual')
      await checkExisting(finalDate)
      if (!found) {
        setMsg({ type: 'error', text: 'Nenhuma data encontrada no cabeçalho. Confirme a data abaixo antes de salvar.' })
      }
    } catch (e) {
      setMsg({ type: 'error', text: e.message || 'Não foi possível ler a planilha.' })
      setChecking(false)
    }
  }

  const handleDateChange = async (newDate) => {
    setDate(newDate)
    setDateSource('manual')
    if (rows.length > 0) {
      await checkExisting(newDate)
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      {/* Date & Logout Bar */}
      <div className="flex items-end justify-between gap-3">
        {date ? (
          <label className="block flex-1">
            <span className={`mb-1 block text-xs font-bold uppercase tracking-wider ${isExcel ? 'text-emerald-800' : 'text-cyan-300'}`}>
              Data da escala {dateSource === 'file' ? '(identificada no arquivo)' : '(informada manualmente)'}
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className={`w-full rounded-xl px-4 py-3 outline-none text-sm transition ${
                isExcel
                  ? 'bg-white border border-slate-500 text-slate-900 font-mono'
                  : 'bg-slate-900/90 border border-slate-700 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
              }`}
            />
          </label>
        ) : (
          <p className="flex-1 text-xs sm:text-sm text-slate-400">
            A data da escala será identificada automaticamente ao ler a planilha.
          </p>
        )}

        <button
          onClick={() => signOut(auth)}
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition cursor-pointer ${
            isExcel
              ? 'bg-[#ece9d8] hover:bg-slate-200 border border-slate-600 text-slate-900'
              : 'border border-cyan-500/30 bg-slate-900/80 hover:bg-slate-800 text-cyan-300'
          }`}
        >
          <LogOut size={16} /> Sair
        </button>
      </div>

      {/* Upload Dropzone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
          isExcel
            ? drag
              ? 'bg-emerald-100 border-emerald-700 text-slate-900'
              : 'bg-[#ece9d8] border-slate-500 hover:bg-[#e4e0ce] text-slate-900 font-mono'
            : drag
            ? 'border-cyan-400 bg-cyan-400/10'
            : 'border-cyan-500/40 bg-slate-950/80 shadow-[0_0_20px_rgba(6,182,212,0.12)] hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]'
        }`}
      >
        <UploadCloud className={`mx-auto mb-3 ${isExcel ? 'text-emerald-800' : 'text-cyan-400'}`} size={48} />
        <p className="text-lg font-bold">Toque ou arraste a planilha .xlsx</p>
        <p className="mt-1 text-xs opacity-75">No iPhone: WhatsApp → Compartilhar → Salvar em Arquivos → Escolher em <b>Recentes</b>.</p>
        {fileName && (
          <p className={`mt-3 flex items-center justify-center gap-2 text-sm font-bold ${isExcel ? 'text-emerald-800' : 'text-cyan-300'}`}>
            <FileSpreadsheet size={16} /> {fileName}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          hidden
          onChange={(e) => { handleFile(e.target.files[0]); e.target.value = '' }}
        />
      </div>

      {checking && (
        <div className={`flex items-center justify-center gap-2 py-4 ${isExcel ? 'text-emerald-800' : 'text-cyan-300'}`}>
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm">Verificando se já existe planilha para {fmt(date)}...</span>
        </div>
      )}

      {msg && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 ${
            msg.type === 'ok'
              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
              : 'border-red-400/40 bg-red-500/15 text-red-200'
          }`}
        >
          {msg.type === 'ok' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />} {msg.text}
        </div>
      )}

      {rows.length > 0 && !checking && (
        <>
          <MyReport rows={rows} date={date} isExcel={isExcel} />

          <button
            onClick={() => setShowTable((v) => !v)}
            aria-expanded={showTable}
            className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 font-bold text-sm transition cursor-pointer ${
              isExcel
                ? 'bg-[#ece9d8] hover:bg-slate-200 border-slate-500 text-slate-900 font-mono'
                : 'border-violet-400/40 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Table2 size={18} /> {showTable ? 'Ocultar' : 'Ver'} escala completa ({rows.length} motoristas)
            </span>
            <ChevronDown size={18} className={`transition-transform ${showTable ? 'rotate-180' : ''}`} />
          </button>

          {showTable && (
            <div className={`rise overflow-x-auto rounded-2xl border ${isExcel ? 'bg-white border-2 border-slate-500 font-mono' : 'border-white/10'}`}>
              <table className="w-full text-left text-sm">
                <thead className={isExcel ? 'bg-emerald-900 text-white text-xs' : 'bg-gradient-to-r from-cyan-600 to-violet-600 text-xs uppercase text-white'}>
                  <tr>{['Driver', 'Van', 'Route', 'Earliest', 'Latest', 'Notes'].map((h) => <th key={h} className="px-3 py-3 font-bold">{h}</th>)}</tr>
                </thead>
                <tbody className={isExcel ? 'divide-y divide-slate-300 text-slate-900' : ''}>
                  {rows.map((r, i) => {
                    const mine = r.driver.toLowerCase() === (localStorage.getItem('vanshift:driver') || '').toLowerCase()
                    const tone = isExcel
                      ? mine
                        ? 'bg-amber-100 font-bold'
                        : i % 2 === 0
                        ? 'bg-white'
                        : 'bg-slate-50'
                      : mine
                      ? 'bg-amber-400/25 ring-1 ring-inset ring-amber-300/60'
                      : i % 2 === 0
                      ? 'bg-cyan-950/20'
                      : 'bg-violet-950/25'
                    return (
                      <tr key={i} className={`border-t border-white/5 transition ${tone}`}>
                        <td className="px-3 py-2.5 font-bold">{r.driver}</td>
                        <td className={`px-3 py-2.5 ${isExcel ? '' : 'text-cyan-200'}`}>{r.vehicle}</td>
                        <td className={`px-3 py-2.5 ${isExcel ? 'font-bold text-emerald-800' : 'text-violet-200'}`}>{r.route}</td>
                        <td className={`px-3 py-2.5 ${isExcel ? '' : 'text-emerald-200'}`}>{r.earliestStart}</td>
                        <td className={`px-3 py-2.5 ${isExcel ? '' : 'text-amber-200'}`}>{r.latestStart}</td>
                        <td className="min-w-[12rem] px-3 py-2.5 text-xs opacity-80">{r.notes}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* DUPLICATE WARNING OR SAVE PROMPT */}
          {existingSchedule ? (
            <div
              className={`rise rounded-2xl border p-5 space-y-3 ${
                isExcel
                  ? 'bg-amber-50 border-2 border-amber-500 text-amber-950 font-mono'
                  : 'border-amber-400/40 bg-amber-500/15 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-lg text-amber-300">
                <AlertTriangle size={24} className="shrink-0 text-amber-400" />
                Atenção: Já existe uma planilha salva para {fmt(date)}!
              </div>
              <p className="text-sm leading-relaxed opacity-90">
                O banco de dados já possui uma escala gravada para o dia <b>{fmt(date)}</b> com{' '}
                <b>{existingSchedule.rows?.length || 0} motoristas</b>.
              </p>
              <p className="text-sm font-bold text-amber-300">
                Deseja substituir a planilha existente por esta nova ({rows.length} motoristas)?
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  disabled={busy}
                  onClick={() => save()}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold transition disabled:opacity-50 cursor-pointer ${
                    isExcel
                      ? 'bg-amber-600 hover:bg-amber-500 text-white border-2 border-amber-900'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  }`}
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <AlertTriangle size={18} />}
                  Sim, Substituir Planilha
                </button>
                <button
                  disabled={busy}
                  onClick={() => { setRows([]); setFileName(''); setExistingSchedule(null) }}
                  className={`flex-1 rounded-xl border py-3.5 font-semibold transition cursor-pointer ${
                    isExcel
                      ? 'border-slate-500 bg-[#ece9d8] hover:bg-slate-200 text-slate-800'
                      : 'border-white/20 bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`rise rounded-2xl border p-5 space-y-3 ${
                isExcel
                  ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-950 font-mono'
                  : 'border-cyan-500/40 bg-cyan-500/15 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-lg text-cyan-300">
                <Sparkles size={22} className="shrink-0 text-cyan-400" />
                Nova escala identificada para {fmt(date)}
              </div>
              <p className="text-sm leading-relaxed opacity-90">
                Foram lidos <b>{rows.length} motoristas</b>. Deseja gravar esta escala no banco de dados?
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  disabled={busy}
                  onClick={() => save()}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold transition disabled:opacity-50 cursor-pointer ${
                    isExcel
                      ? 'bg-emerald-800 hover:bg-emerald-700 text-white border-2 border-emerald-950'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                  }`}
                >
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Salvar Escala no Firebase
                </button>
                <button
                  disabled={busy}
                  onClick={() => { setRows([]); setFileName(''); setExistingSchedule(null) }}
                  className={`flex-1 rounded-xl border py-3.5 font-semibold transition cursor-pointer ${
                    isExcel
                      ? 'border-slate-500 bg-[#ece9d8] hover:bg-slate-200 text-slate-800'
                      : 'border-white/20 bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
