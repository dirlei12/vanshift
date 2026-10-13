import { useState, useRef } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Lock, X, Loader2, Sparkles, User, CalendarDays } from 'lucide-react'
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

export default function UploadModal({ isOpen, onClose, user, onSaved }) {
  const { theme, t } = useApp()
  const [fileName, setFileName] = useState('')
  const [parsedRows, setParsedRows] = useState([])
  const [detectedDate, setDetectedDate] = useState('')
  const [manualDate, setManualDate] = useState('')
  const [dateSource, setDateSource] = useState('')
  const [existingSchedule, setExistingSchedule] = useState(null)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [drag, setDrag] = useState(false)

  // Quick admin login state if user not authenticated
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')

  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const isExcel = theme === 'excel'
  const targetDate = detectedDate || manualDate || todayISO()

  const resetState = () => {
    setFileName('')
    setParsedRows([])
    setDetectedDate('')
    setManualDate('')
    setDateSource('')
    setExistingSchedule(null)
    setError('')
    setSuccessMsg('')
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setAuthBusy(true)
    setAuthError('')
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
    } catch {
      setAuthError('E-mail ou senha inválidos.')
    } finally {
      setAuthBusy(false)
    }
  }

  const inspectScheduleForDate = async (rows, dateToTest) => {
    setChecking(true)
    setError('')
    try {
      const existing = await fetchSchedule(dateToTest)
      setExistingSchedule(existing)
    } catch {
      setExistingSchedule(null)
    } finally {
      setChecking(false)
    }
  }

  const handleFile = async (file) => {
    if (!file) return
    resetState()
    if (!/\.xlsx$/i.test(file.name)) {
      setError('Por favor, envie um arquivo .xlsx válido.')
      return
    }

    try {
      setChecking(true)
      const { rows, date } = await parseScheduleFile(file)
      setParsedRows(rows)
      setFileName(file.name)

      const finalDate = date || todayISO()
      if (date) {
        setDetectedDate(date)
        setDateSource('file')
      } else {
        setManualDate(todayISO())
        setDateSource('manual')
      }

      await inspectScheduleForDate(rows, finalDate)
    } catch (err) {
      setError(err.message || 'Erro ao ler a planilha.')
      setChecking(false)
    }
  }

  const handleDateChange = async (newDate) => {
    setManualDate(newDate)
    setDetectedDate('')
    setDateSource('manual')
    if (parsedRows.length > 0) {
      await inspectScheduleForDate(parsedRows, newDate)
    }
  }

  const doSave = async () => {
    if (!targetDate) {
      setError('Selecione uma data para salvar a planilha.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await saveSchedule(targetDate, parsedRows)
      setSuccessMsg(`Planilha salva com sucesso para ${fmt(targetDate)} (${parsedRows.length} motoristas)!`)
      if (onSaved) onSaved(targetDate)
      setTimeout(() => {
        handleClose()
      }, 1400)
    } catch (err) {
      setError(err.message || 'Falha ao salvar no banco de dados.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
      <div
        className={`rise relative w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto transition ${
          isExcel
            ? 'bg-[#ece9d8] text-slate-900 font-mono border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
            : 'bg-slate-950 text-slate-100 border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
        }`}
      >
        <button
          onClick={handleClose}
          aria-label="Fechar"
          className={`absolute right-4 top-4 p-1.5 rounded-lg transition ${
            isExcel
              ? 'bg-[#d4d0c8] hover:bg-[#c0bca8] border border-slate-600 text-slate-900'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <X size={20} />
        </button>

        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className={isExcel ? 'text-emerald-800' : 'text-cyan-400'} size={24} />
            Adicionar Planilha
          </h2>
          <p className="text-xs sm:text-sm opacity-70">
            A data é identificada na planilha. Se já existir escala na mesma data, o sistema pedirá confirmação antes de substituir.
          </p>
        </div>

        {/* Admin Login Box if not authenticated */}
        {!user && (
          <form
            onSubmit={handleAdminLogin}
            className={`mb-5 space-y-3 rounded-2xl border p-4 ${
              isExcel ? 'bg-white border-slate-400 font-mono' : 'border-amber-400/30 bg-amber-500/10'
            }`}
          >
            <div className={`flex items-center gap-2 text-sm font-bold ${isExcel ? 'text-amber-800' : 'text-amber-200'}`}>
              <Lock size={16} /> Login de Administrador necessário
            </div>
            <p className="text-xs opacity-75">
              Faça login para ter permissão de gravar a nova planilha no sistema.
            </p>
            <input
              type="email"
              placeholder="E-mail admin"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
              className={`w-full rounded-xl px-3 py-2 text-sm outline-none transition ${
                isExcel ? 'bg-slate-50 border border-slate-400 text-slate-900' : 'border border-slate-700 bg-slate-950 text-white focus:border-cyan-400'
              }`}
            />
            <input
              type="password"
              placeholder="Senha"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
              className={`w-full rounded-xl px-3 py-2 text-sm outline-none transition ${
                isExcel ? 'bg-slate-50 border border-slate-400 text-slate-900' : 'border border-slate-700 bg-slate-950 text-white focus:border-cyan-400'
              }`}
            />
            {authError && <p className="text-xs text-red-400">{authError}</p>}
            <button
              disabled={authBusy}
              type="submit"
              className={`w-full rounded-xl py-2.5 text-sm font-bold transition disabled:opacity-50 cursor-pointer ${
                isExcel ? 'bg-emerald-800 hover:bg-emerald-700 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              }`}
            >
              {authBusy ? 'Autenticando…' : 'Entrar e Continuar'}
            </button>
          </form>
        )}

        {/* Dropzone */}
        {user && !successMsg && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
              isExcel
                ? drag
                  ? 'bg-emerald-100 border-emerald-700'
                  : 'bg-white border-slate-400 hover:bg-slate-50 text-slate-900'
                : drag
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-cyan-500/40 bg-slate-900/80 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]'
            }`}
          >
            <UploadCloud className={`mx-auto mb-2 ${isExcel ? 'text-emerald-800' : 'text-cyan-400'}`} size={40} />
            <p className="text-base font-bold">Toque ou arraste a planilha .xlsx</p>
            <p className="mt-1 text-xs opacity-75">
              No iPhone: WhatsApp → Compartilhar → Salvar em Arquivos → Escolher em Recentes
            </p>
            {fileName && (
              <p className={`mt-3 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold ${isExcel ? 'text-emerald-800' : 'text-cyan-300'}`}>
                <FileSpreadsheet size={16} /> {fileName}
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              onChange={(e) => { handleFile(e.target.files[0]); e.target.value = '' }}
            />
          </div>
        )}

        {checking && (
          <div className={`flex items-center justify-center gap-2 py-6 ${isExcel ? 'text-emerald-800' : 'text-cyan-300'}`}>
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm font-bold">Verificando dados da planilha...</span>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-400/40 bg-red-500/15 p-3.5 text-xs sm:text-sm text-red-200">
            <AlertTriangle size={18} className="shrink-0" /> {error}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/20 p-4 text-emerald-200">
            <CheckCircle2 size={24} className="shrink-0 text-emerald-400" />
            <div>
              <p className="font-bold">{successMsg}</p>
              <p className="text-xs text-emerald-300">Fechando janela...</p>
            </div>
          </div>
        )}

        {/* Content after file parsed */}
        {user && parsedRows.length > 0 && !checking && !successMsg && (
          <div className="mt-5 space-y-4">
            {/* Date detection confirmation */}
            <div className={`rounded-2xl border p-4 ${isExcel ? 'bg-white border-slate-400' : 'border-slate-800 bg-slate-900/90'}`}>
              <label className="block">
                <span className={`mb-1 flex items-center gap-1.5 text-xs sm:text-sm font-bold ${isExcel ? 'text-emerald-800' : 'text-cyan-300'}`}>
                  <CalendarDays size={16} />
                  Data da Escala {dateSource === 'file' ? '(identificada no arquivo)' : '(informe a data)'}
                </span>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2.5 text-sm outline-none transition ${
                    isExcel ? 'bg-slate-50 border border-slate-400 text-slate-900' : 'border border-slate-700 bg-slate-950 text-white focus:border-cyan-400'
                  }`}
                />
              </label>
              <p className="mt-2 text-xs opacity-75">
                Total de motoristas identificados: <b>{parsedRows.length}</b>
              </p>
            </div>

            {/* ALERT: Existing schedule on the same date */}
            {existingSchedule ? (
              <div
                className={`rise rounded-2xl border p-4.5 space-y-3 ${
                  isExcel
                    ? 'bg-amber-50 border-2 border-amber-500 text-amber-950'
                    : 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-base text-amber-300">
                  <AlertTriangle size={22} className="shrink-0 text-amber-400" />
                  Atenção: Planilha já cadastrada nesta data!
                </div>
                <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                  Já existe uma escala gravada para o dia <b>{fmt(targetDate)}</b> contendo{' '}
                  <b>{existingSchedule.rows?.length || 0} motoristas</b>.
                </p>
                <p className="text-xs sm:text-sm font-bold text-amber-300">
                  Deseja substituir a planilha existente por esta nova ({parsedRows.length} motoristas)?
                </p>
                <div className="flex gap-2.5 pt-1">
                  <button
                    disabled={saving}
                    onClick={doSave}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs sm:text-sm font-bold transition disabled:opacity-50 cursor-pointer ${
                      isExcel ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                    Sim, Substituir
                  </button>
                  <button
                    disabled={saving}
                    onClick={handleClose}
                    className={`flex-1 rounded-xl border py-3 text-xs sm:text-sm font-bold transition cursor-pointer ${
                      isExcel ? 'border-slate-400 bg-white hover:bg-slate-100 text-slate-800' : 'border-white/20 bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              /* PROMPT: New schedule confirmation */
              <div
                className={`rise rounded-2xl border p-4.5 space-y-3 ${
                  isExcel
                    ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-950'
                    : 'border-cyan-500/40 bg-cyan-500/15 text-cyan-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-base text-cyan-300">
                  <Sparkles size={20} className="shrink-0 text-cyan-400" />
                  Nova data detectada ({fmt(targetDate)})
                </div>
                <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                  Nenhuma escala existente encontrada para o dia <b>{fmt(targetDate)}</b>. Deseja salvar as rotas de {parsedRows.length} motoristas?
                </p>
                <div className="flex gap-2.5 pt-1">
                  <button
                    disabled={saving}
                    onClick={doSave}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs sm:text-sm font-bold transition disabled:opacity-50 cursor-pointer ${
                      isExcel ? 'bg-emerald-800 hover:bg-emerald-700 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                    }`}
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Salvar Planilha
                  </button>
                  <button
                    disabled={saving}
                    onClick={handleClose}
                    className={`flex-1 rounded-xl border py-3 text-xs sm:text-sm font-bold transition cursor-pointer ${
                      isExcel ? 'border-slate-400 bg-white hover:bg-slate-100 text-slate-800' : 'border-white/20 bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
