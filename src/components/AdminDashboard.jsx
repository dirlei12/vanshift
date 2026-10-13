import { useState, useEffect, useRef } from 'react'
import {
  UploadCloud, FileSpreadsheet, Save, Loader2, LogOut, CheckCircle2,
  AlertTriangle, Lock, Truck, Route, Clock, StickyNote, Edit3, Trash2,
  Calendar, Megaphone, History, Plus, Search, Check, X, ShieldAlert,
  ArrowRight, RefreshCw, Send, Sparkles, Filter
} from 'lucide-react'
import { parseScheduleFile } from '../lib/parseSchedule'
import {
  fetchSchedule, fetchAllSchedules, saveSchedule, deleteSchedule,
  fetchAnnouncement, saveAnnouncement, deleteAnnouncement, todayISO
} from '../lib/schedule'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'

const fmt = (iso) => {
  if (!iso) return ''
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

export default function AdminDashboard() {
  const { user, isAdmin, logout, loginAdmin } = useAuth()
  const { theme, t } = useApp()
  const isExcel = theme === 'excel'

  // Admin Login Barrier State
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminLoginBusy, setAdminLoginBusy] = useState(false)
  const [adminLoginError, setAdminLoginError] = useState('')

  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'override' | 'history' | 'broadcast'

  // --- Tab 1: Upload state ---
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadFileName, setUploadFileName] = useState('')
  const [uploadDate, setUploadDate] = useState('')
  const [uploadRows, setUploadRows] = useState([])
  const [uploadDrag, setUploadDrag] = useState(false)
  const [uploadChecking, setUploadChecking] = useState(false)
  const [uploadExisting, setUploadExisting] = useState(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [uploadFilter, setUploadFilter] = useState('')
  const [uploadMsg, setUploadMsg] = useState(null)
  const fileInputRef = useRef(null)

  // --- Tab 2: Quick Edit / Override state ---
  const [overrideDate, setOverrideDate] = useState(todayISO())
  const [overrideRows, setOverrideRows] = useState([])
  const [overrideLoading, setOverrideLoading] = useState(false)
  const [overrideBusy, setOverrideBusy] = useState(false)
  const [overrideFilter, setOverrideFilter] = useState('')
  const [overrideMsg, setOverrideMsg] = useState(null)
  const [editingRowIndex, setEditingRowIndex] = useState(null)
  const [editFormData, setEditFormData] = useState({
    driver: '',
    vehicle: '',
    route: '',
    earliestStart: '',
    latestStart: '',
    notes: '',
  })
  const [isAddingNewRow, setIsAddingNewRow] = useState(false)

  // --- Tab 3: Historical Logs state ---
  const [allSchedules, setAllSchedules] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null)
  const [selectedHistorySchedule, setSelectedHistorySchedule] = useState(null)
  const [historyDeleteBusy, setHistoryDeleteBusy] = useState(false)

  // --- Tab 4: Broadcast state ---
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastLevel, setBroadcastLevel] = useState('warning') // 'info' | 'warning' | 'urgent'
  const [broadcastActive, setBroadcastActive] = useState(false)
  const [broadcastBusy, setBroadcastBusy] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState(null)

  // Load history & announcements on mount
  useEffect(() => {
    loadAllSchedules()
    loadBroadcast()
  }, [])

  const loadAllSchedules = async () => {
    setHistoryLoading(true)
    try {
      const data = await fetchAllSchedules()
      setAllSchedules(data)
      if (data.length > 0 && !selectedHistoryDate) {
        setSelectedHistoryDate(data[0].date)
        setSelectedHistorySchedule(data[0])
      }
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false)
    }
  }

  const loadBroadcast = async () => {
    try {
      const data = await fetchAnnouncement()
      if (data) {
        setBroadcastMessage(data.message || '')
        setBroadcastLevel(data.level || 'warning')
        setBroadcastActive(Boolean(data.active))
      }
    } catch {
      // ignore
    }
  }

  // Load schedule for Tab 2 (Override)
  useEffect(() => {
    if (activeTab === 'override' && overrideDate) {
      loadOverrideSchedule(overrideDate)
    }
  }, [activeTab, overrideDate])

  const loadOverrideSchedule = async (date) => {
    setOverrideLoading(true)
    setOverrideMsg(null)
    setEditingRowIndex(null)
    try {
      const snap = await fetchSchedule(date)
      setOverrideRows(snap?.rows ? [...snap.rows] : [])
    } catch (e) {
      setOverrideMsg({ type: 'error', text: 'Falha ao carregar escala para esta data.' })
    } finally {
      setOverrideLoading(false)
    }
  }

  // --- Handlers for Tab 1 (Upload) ---
  const handleSpreadsheetFile = async (file) => {
    if (!file) return
    setUploadMsg(null)
    setUploadRows([])
    setUploadDate('')
    setUploadExisting(null)
    if (!/\.xlsx$/i.test(file.name)) {
      setUploadMsg({ type: 'error', text: 'Por favor envie um ficheiro com extensão .xlsx' })
      return
    }

    setUploadChecking(true)
    try {
      const { rows, date } = await parseScheduleFile(file)
      setUploadRows(rows)
      setUploadFileName(file.name)
      const targetDate = date || todayISO()
      setUploadDate(targetDate)

      const existing = await fetchSchedule(targetDate)
      setUploadExisting(existing)
    } catch (e) {
      setUploadMsg({ type: 'error', text: e.message || 'Erro ao processar ficheiro Excel.' })
    } finally {
      setUploadChecking(false)
    }
  }

  const handleSaveUpload = async () => {
    if (!uploadDate || uploadRows.length === 0) return
    setUploadBusy(true)
    setUploadMsg(null)
    try {
      await saveSchedule(uploadDate, uploadRows)
      setUploadMsg({ type: 'ok', text: `Escala salva com sucesso para ${fmt(uploadDate)} (${uploadRows.length} motoristas)!` })
      setUploadExisting({ date: uploadDate, rows: uploadRows })
      loadAllSchedules()
    } catch (e) {
      setUploadMsg({ type: 'error', text: e.message || 'Erro ao gravar no Firebase.' })
    } finally {
      setUploadBusy(false)
    }
  }

  // --- Handlers for Tab 2 (Override) ---
  const startEditRow = (row, index) => {
    setEditingRowIndex(index)
    setEditFormData({ ...row })
    setIsAddingNewRow(false)
  }

  const saveEditedRow = () => {
    if (!editFormData.driver.trim()) {
      alert('Nome do motorista obrigatório.')
      return
    }
    const updated = [...overrideRows]
    if (isAddingNewRow) {
      updated.push({ ...editFormData })
    } else {
      updated[editingRowIndex] = { ...editFormData }
    }
    setOverrideRows(updated)
    setEditingRowIndex(null)
    setIsAddingNewRow(false)
  }

  const deleteRowFromOverride = (index) => {
    if (confirm('Remover esta linha de escala?')) {
      const updated = overrideRows.filter((_, i) => i !== index)
      setOverrideRows(updated)
    }
  }

  const commitOverrideChanges = async () => {
    setOverrideBusy(true)
    setOverrideMsg(null)
    try {
      await saveSchedule(overrideDate, overrideRows)
      setOverrideMsg({ type: 'ok', text: `Alterações guardadas com sucesso para ${fmt(overrideDate)}!` })
      loadAllSchedules()
    } catch (e) {
      setOverrideMsg({ type: 'error', text: e.message || 'Erro ao atualizar escala.' })
    } finally {
      setOverrideBusy(false)
    }
  }

  // --- Handlers for Tab 3 (History) ---
  const handleSelectHistory = (s) => {
    setSelectedHistoryDate(s.date)
    setSelectedHistorySchedule(s)
  }

  const handleDeleteHistorySchedule = async (date) => {
    if (!confirm(`Tem a certeza que deseja eliminar PERMANENTEMENTE a escala do dia ${fmt(date)}?`)) return
    setHistoryDeleteBusy(true)
    try {
      await deleteSchedule(date)
      const filtered = allSchedules.filter((s) => s.date !== date)
      setAllSchedules(filtered)
      if (selectedHistoryDate === date) {
        setSelectedHistoryDate(filtered[0]?.date || null)
        setSelectedHistorySchedule(filtered[0] || null)
      }
    } catch (e) {
      alert('Erro ao eliminar escala: ' + e.message)
    } finally {
      setHistoryDeleteBusy(false)
    }
  }

  // --- Handlers for Tab 4 (Broadcast Announcements) ---
  const handleSaveBroadcast = async (e) => {
    e.preventDefault()
    setBroadcastBusy(true)
    setBroadcastMsg(null)
    try {
      await saveAnnouncement({
        message: broadcastMessage,
        level: broadcastLevel,
        active: broadcastActive,
      })
      setBroadcastMsg({ type: 'ok', text: 'Aviso global atualizado com sucesso!' })
    } catch (e) {
      setBroadcastMsg({ type: 'error', text: 'Falha ao gravar anúncio: ' + e.message })
    } finally {
      setBroadcastBusy(false)
    }
  }

  const handleClearBroadcast = async () => {
    if (!confirm('Deseja desativar e apagar o aviso global para todos os motoristas?')) return
    setBroadcastBusy(true)
    try {
      await deleteAnnouncement()
      setBroadcastMessage('')
      setBroadcastActive(false)
      setBroadcastMsg({ type: 'ok', text: 'Aviso global removido com sucesso.' })
    } catch (e) {
      setBroadcastMsg({ type: 'error', text: 'Erro ao apagar aviso: ' + e.message })
    } finally {
      setBroadcastBusy(false)
    }
  }

  const filteredUploadRows = uploadRows.filter((r) =>
    r.driver?.toLowerCase().includes(uploadFilter.toLowerCase()) ||
    r.vehicle?.toLowerCase().includes(uploadFilter.toLowerCase()) ||
    r.route?.toLowerCase().includes(uploadFilter.toLowerCase())
  )

  const filteredOverrideRows = overrideRows.filter((r) =>
    r.driver?.toLowerCase().includes(overrideFilter.toLowerCase()) ||
    r.vehicle?.toLowerCase().includes(overrideFilter.toLowerCase()) ||
    r.route?.toLowerCase().includes(overrideFilter.toLowerCase())
  )

  const handleAdminGateSubmit = async (e) => {
    e.preventDefault()
    setAdminLoginError('')
    setAdminLoginBusy(true)
    try {
      await loginAdmin(adminEmail, adminPassword)
    } catch {
      setAdminLoginError('Credenciais inválidas. Verifique o seu e-mail e palavra-passe.')
    } finally {
      setAdminLoginBusy(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md my-8">
        <div
          className={`rise rounded-3xl p-6 sm:p-8 backdrop-blur-xl transition-all shadow-2xl ${
            isExcel
              ? 'bg-[#ece9d8] border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-mono text-slate-900'
              : 'bg-slate-950/90 border border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.25)] text-slate-100'
          }`}
        >
          <div className="text-center mb-6">
            <div
              className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
                isExcel ? 'bg-emerald-800 text-white' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
              }`}
            >
              <Lock size={28} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black">Acesso Restrito: Painel Admin</h2>
            <p className="text-xs opacity-75 mt-1">
              Introduza as credenciais de administrador para aceder ao upload de escalas, overrides e avisos globais.
            </p>
          </div>

          {adminLoginError && (
            <div
              className={`mb-4 flex items-center gap-2.5 rounded-xl border p-3.5 text-xs sm:text-sm ${
                isExcel ? 'bg-red-50 border-red-400 text-red-900' : 'border-red-400/40 bg-red-500/15 text-red-200'
              }`}
            >
              <AlertTriangle size={18} className="shrink-0 text-red-400" />
              <span>{adminLoginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminGateSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider opacity-80">
                E-mail de Administrador
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@vanshift.com"
                required
                className={`w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none transition ${
                  isExcel
                    ? 'bg-white border border-slate-500 text-slate-900 focus:border-emerald-700'
                    : 'bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                }`}
              />
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider opacity-80">
                Palavra-passe
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none transition ${
                  isExcel
                    ? 'bg-white border border-slate-500 text-slate-900 focus:border-emerald-700'
                    : 'bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={adminLoginBusy}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition cursor-pointer disabled:opacity-50 ${
                isExcel
                  ? 'bg-emerald-800 hover:bg-emerald-700 text-white border-2 border-emerald-950'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
              }`}
            >
              {adminLoginBusy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>A verificar…</span>
                </>
              ) : (
                <span>Desbloquear Painel Admin</span>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      {/* Top Admin Header */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
          isExcel
            ? 'bg-[#ece9d8] border-2 border-slate-500 font-mono text-slate-900 shadow-sm'
            : 'bg-slate-950/85 border-cyan-500/35 shadow-[0_0_25px_rgba(6,182,212,0.15)] text-slate-100 backdrop-blur-md'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                isExcel ? 'bg-emerald-800 text-white' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
              }`}
            >
              Admin Master
            </span>
            <span className="text-xs opacity-60">vanshiftallaces</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">Painel de Controlo da Frota</h2>
          <p className="text-xs opacity-70">Sessão iniciada como: {user?.email || 'Administrador'}</p>
        </div>

        <button
          onClick={logout}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer self-start sm:self-auto ${
            isExcel
              ? 'bg-white hover:bg-slate-100 border border-slate-600 text-slate-900'
              : 'border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-200'
          }`}
        >
          <LogOut size={16} />
          <span>Terminar Sessão</span>
        </button>
      </div>

      {/* Admin Multi-Tab Navigation */}
      <div
        className={`flex overflow-x-auto p-1.5 rounded-2xl border transition ${
          isExcel
            ? 'bg-[#d4d0c8] border-slate-400 font-mono text-xs'
            : 'bg-slate-950/90 border-cyan-500/25 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
        }`}
      >
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'upload'
              ? isExcel
                ? 'bg-emerald-800 text-white shadow-inner'
                : 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
              : 'opacity-70 hover:opacity-100'
          }`}
        >
          <UploadCloud size={16} />
          <span>1. Upload & Pré-visualização</span>
        </button>

        <button
          onClick={() => setActiveTab('override')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'override'
              ? isExcel
                ? 'bg-emerald-800 text-white shadow-inner'
                : 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
              : 'opacity-70 hover:opacity-100'
          }`}
        >
          <Edit3 size={16} />
          <span>2. Edição Rápida (Overrides)</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'history'
              ? isExcel
                ? 'bg-emerald-800 text-white shadow-inner'
                : 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
              : 'opacity-70 hover:opacity-100'
          }`}
        >
          <History size={16} />
          <span>3. Histórico de Escalas</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'broadcast'
              ? isExcel
                ? 'bg-emerald-800 text-white shadow-inner'
                : 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
              : 'opacity-70 hover:opacity-100'
          }`}
        >
          <Megaphone size={16} />
          <span>4. Avisos Globais (Broadcast)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SCHEDULE UPLOAD & PREVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'upload' && (
        <div className="space-y-5">
          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setUploadDrag(true) }}
            onDragLeave={() => setUploadDrag(false)}
            onDrop={(e) => { e.preventDefault(); setUploadDrag(false); handleSpreadsheetFile(e.dataTransfer.files[0]) }}
            className={`cursor-pointer rounded-3xl border-2 border-dashed p-8 sm:p-10 text-center transition ${
              isExcel
                ? uploadDrag
                  ? 'bg-emerald-100 border-emerald-700'
                  : 'bg-[#ece9d8] border-slate-500 hover:bg-[#e4e0ce] text-slate-900 font-mono'
                : uploadDrag
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-cyan-500/40 bg-slate-950/80 shadow-[0_0_20px_rgba(6,182,212,0.12)] hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]'
            }`}
          >
            <UploadCloud className={`mx-auto mb-3 ${isExcel ? 'text-emerald-800' : 'text-cyan-400'}`} size={48} />
            <p className="text-lg font-bold">Arraste a folha Excel diária (.xlsx) ou clique para selecionar</p>
            <p className="mt-1 text-xs opacity-75">
              O sistema detecta as colunas VEHICLE, DRIVER, START TIMES, ROUTE NUMBER e HANDOVER.
            </p>
            {uploadFileName && (
              <p className={`mt-3 flex items-center justify-center gap-2 text-sm font-bold ${isExcel ? 'text-emerald-800' : 'text-cyan-300'}`}>
                <FileSpreadsheet size={16} /> {uploadFileName}
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              onChange={(e) => { handleSpreadsheetFile(e.target.files[0]); e.target.value = '' }}
            />
          </div>

          {uploadChecking && (
            <div className={`flex items-center justify-center gap-2 py-4 ${isExcel ? 'text-emerald-800' : 'text-cyan-300'}`}>
              <Loader2 className="animate-spin" size={20} />
              <span className="text-sm font-bold">A verificar escala e conflitos de data...</span>
            </div>
          )}

          {uploadMsg && (
            <div
              className={`flex items-center gap-3 rounded-2xl border p-4 ${
                uploadMsg.type === 'ok'
                  ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                  : 'border-red-400/40 bg-red-500/15 text-red-200'
              }`}
            >
              {uploadMsg.type === 'ok' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />} {uploadMsg.text}
            </div>
          )}

          {/* Full Schedule Data Table Preview */}
          {uploadRows.length > 0 && !uploadChecking && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isExcel ? 'bg-white border-slate-400 font-mono' : 'bg-slate-900/80 border-cyan-500/30'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                      Data da Escala
                    </span>
                    <input
                      type="date"
                      value={uploadDate}
                      onChange={(e) => setUploadDate(e.target.value)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-bold outline-none ${
                        isExcel ? 'border border-slate-400 bg-slate-50' : 'border border-slate-700 bg-slate-950 text-white'
                      }`}
                    />
                  </label>
                  <div className="text-xs opacity-75 self-end pb-1.5">
                    <b>{uploadRows.length}</b> condutores identificados
                  </div>
                </div>

                <div className="relative">
                  <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={uploadFilter}
                    onChange={(e) => setUploadFilter(e.target.value)}
                    placeholder="Filtrar motorista ou rota..."
                    className={`pl-9 pr-3 py-2 rounded-xl text-xs outline-none w-full sm:w-56 ${
                      isExcel ? 'border border-slate-400 bg-slate-50' : 'border border-slate-700 bg-slate-950 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Table Preview */}
              <div className={`overflow-x-auto rounded-2xl border ${isExcel ? 'bg-white border-slate-400 font-mono text-xs' : 'border-cyan-500/25 bg-slate-950/80'}`}>
                <table className="w-full text-left text-sm">
                  <thead className={isExcel ? 'bg-emerald-900 text-white text-xs' : 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white text-xs uppercase'}>
                    <tr>
                      <th className="px-3 py-3 font-bold">Motorista</th>
                      <th className="px-3 py-3 font-bold">Carrinha (Van)</th>
                      <th className="px-3 py-3 font-bold">Rota</th>
                      <th className="px-3 py-3 font-bold">Início Cedo</th>
                      <th className="px-3 py-3 font-bold">Início Tarde</th>
                      <th className="px-3 py-3 font-bold">Handover / Notas</th>
                    </tr>
                  </thead>
                  <tbody className={isExcel ? 'divide-y divide-slate-300' : ''}>
                    {filteredUploadRows.map((r, i) => (
                      <tr key={i} className={`border-t border-white/5 transition hover:bg-white/10 ${i % 2 === 0 ? (isExcel ? 'bg-white' : 'bg-cyan-950/15') : (isExcel ? 'bg-slate-50' : 'bg-violet-950/20')}`}>
                        <td className="px-3 py-2 font-bold">{r.driver}</td>
                        <td className={`px-3 py-2 ${isExcel ? '' : 'text-cyan-200'}`}>{r.vehicle}</td>
                        <td className={`px-3 py-2 font-bold ${isExcel ? 'text-emerald-800' : 'text-violet-200'}`}>{r.route}</td>
                        <td className={`px-3 py-2 ${isExcel ? '' : 'text-emerald-200'}`}>{r.earliestStart}</td>
                        <td className={`px-3 py-2 ${isExcel ? '' : 'text-amber-200'}`}>{r.latestStart}</td>
                        <td className="min-w-[12rem] px-3 py-2 text-xs opacity-75">{r.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Duplicate conflict warning OR save button */}
              {uploadExisting ? (
                <div
                  className={`p-5 rounded-2xl border space-y-3 ${
                    isExcel
                      ? 'bg-amber-50 border-2 border-amber-500 font-mono text-amber-950'
                      : 'border-amber-400/40 bg-amber-500/15 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-base text-amber-300">
                    <AlertTriangle size={20} className="shrink-0 text-amber-400" />
                    Atenção: Já existe escala gravada para {fmt(uploadDate)}!
                  </div>
                  <p className="text-xs sm:text-sm opacity-90">
                    O banco de dados já possui uma escala salva para o dia <b>{fmt(uploadDate)}</b> com{' '}
                    <b>{uploadExisting.rows?.length || 0} motoristas</b>. Deseja substituir os dados existentes por esta nova planilha?
                  </p>
                  <div className="flex gap-3 pt-1">
                    <button
                      disabled={uploadBusy}
                      onClick={handleSaveUpload}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition cursor-pointer disabled:opacity-50 ${
                        isExcel ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      }`}
                    >
                      {uploadBusy ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                      Sim, Substituir Escala
                    </button>
                    <button
                      disabled={uploadBusy}
                      onClick={() => { setUploadRows([]); setUploadFileName(''); setUploadExisting(null) }}
                      className={`flex-1 rounded-xl border py-3.5 text-sm font-semibold transition cursor-pointer ${
                        isExcel ? 'border-slate-500 bg-[#ece9d8] hover:bg-slate-200 text-slate-800' : 'border-white/20 bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  disabled={uploadBusy}
                  onClick={handleSaveUpload}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition cursor-pointer disabled:opacity-50 ${
                    isExcel
                      ? 'bg-emerald-800 hover:bg-emerald-700 text-white border-2 border-emerald-950'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                  }`}
                >
                  {uploadBusy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Salvar Escala no Firebase ({uploadRows.length} condutores)
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QUICK EDIT / OVERRIDE */}
      {/* ========================================================================= */}
      {activeTab === 'override' && (
        <div className="space-y-5">
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isExcel ? 'bg-white border-slate-400 font-mono' : 'bg-slate-900/80 border-cyan-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                  Selecionar Data da Escala
                </span>
                <input
                  type="date"
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold outline-none ${
                    isExcel ? 'border border-slate-400 bg-slate-50' : 'border border-slate-700 bg-slate-950 text-white'
                  }`}
                />
              </label>
              <button
                onClick={() => loadOverrideSchedule(overrideDate)}
                className={`p-2 rounded-xl mt-5 border transition cursor-pointer ${
                  isExcel ? 'bg-[#ece9d8] border-slate-400 hover:bg-slate-200' : 'bg-slate-950 border-slate-700 text-cyan-300 hover:border-cyan-400'
                }`}
                title="Recarregar dados"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-52">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={overrideFilter}
                  onChange={(e) => setOverrideFilter(e.target.value)}
                  placeholder="Pesquisar..."
                  className={`pl-9 pr-3 py-2 rounded-xl text-xs outline-none w-full ${
                    isExcel ? 'border border-slate-400 bg-slate-50' : 'border border-slate-700 bg-slate-950 text-white'
                  }`}
                />
              </div>

              <button
                onClick={() => {
                  setIsAddingNewRow(true)
                  setEditingRowIndex(-1)
                  setEditFormData({
                    driver: '',
                    vehicle: '',
                    route: '',
                    earliestStart: '08:00',
                    latestStart: '09:00',
                    notes: '',
                  })
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  isExcel
                    ? 'bg-emerald-800 text-white hover:bg-emerald-700'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                }`}
              >
                <Plus size={15} />
                <span>Adicionar Linha</span>
              </button>
            </div>
          </div>

          {overrideLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className={`animate-spin ${isExcel ? 'text-emerald-800' : 'text-cyan-400'}`} size={28} />
            </div>
          )}

          {overrideMsg && (
            <div
              className={`flex items-center gap-3 rounded-2xl border p-4 ${
                overrideMsg.type === 'ok'
                  ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                  : 'border-red-400/40 bg-red-500/15 text-red-200'
              }`}
            >
              {overrideMsg.type === 'ok' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />} {overrideMsg.text}
            </div>
          )}

          {/* Edit Modal / Drawer for Manual Row Changes */}
          {(editingRowIndex !== null || isAddingNewRow) && (
            <div
              className={`p-5 rounded-2xl border space-y-4 rise ${
                isExcel ? 'bg-white border-2 border-emerald-800 font-mono text-slate-900 shadow-md' : 'bg-slate-900/95 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)] text-white'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-700/30 pb-2">
                <h4 className="font-bold flex items-center gap-2">
                  <Edit3 size={16} className={isExcel ? 'text-emerald-800' : 'text-cyan-400'} />
                  {isAddingNewRow ? 'Adicionar Novo Condutor à Escala' : `Editar Turno de: ${editFormData.driver}`}
                </h4>
                <button
                  onClick={() => { setEditingRowIndex(null); setIsAddingNewRow(false) }}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs opacity-75 font-bold block mb-1">Nome do Condutor</span>
                  <input
                    type="text"
                    value={editFormData.driver}
                    onChange={(e) => setEditFormData({ ...editFormData, driver: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none ${
                      isExcel ? 'border border-slate-400 bg-slate-50' : 'border border-slate-700 bg-slate-950 text-white'
                    }`}
                  />
                </label>

                <label className="block">
                  <span className="text-xs opacity-75 font-bold block mb-1">Carrinha (Van)</span>
                  <input
                    type="text"
                    value={editFormData.vehicle}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicle: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none ${
                      isExcel ? 'border border-slate-400 bg-slate-50' : 'border border-slate-700 bg-slate-950 text-white'
                    }`}
                  />
                </label>

                <label className="block">
                  <span className="text-xs opacity-75 font-bold block mb-1">Número da Rota</span>
                  <input
                    type="text"
                    value={editFormData.route}
                    onChange={(e) => setEditFormData({ ...editFormData, route: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none ${
                      isExcel ? 'border border-slate-400 bg-slate-50' : 'border border-slate-700 bg-slate-950 text-white'
                    }`}
                  />
                </label>

                <label className="block">
                  <span className="text-xs opacity-75 font-bold block mb-1">Início Mais Cedo</span>
                  <input
                    type="text"
                    value={editFormData.earliestStart}
                    onChange={(e) => setEditFormData({ ...editFormData, earliestStart: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none ${
                      isExcel ? 'border border-slate-400 bg-slate-50' : 'border border-slate-700 bg-slate-950 text-white'
                    }`}
                  />
                </label>

                <label className="block">
                  <span className="text-xs opacity-75 font-bold block mb-1">Início Mais Tarde</span>
                  <input
                    type="text"
                    value={editFormData.latestStart}
                    onChange={(e) => setEditFormData({ ...editFormData, latestStart: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none ${
                      isExcel ? 'border border-slate-400 bg-slate-50' : 'border border-slate-700 bg-slate-950 text-white'
                    }`}
                  />
                </label>

                <label className="block sm:col-span-2 md:col-span-1">
                  <span className="text-xs opacity-75 font-bold block mb-1">Notas / Handover</span>
                  <input
                    type="text"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none ${
                      isExcel ? 'border border-slate-400 bg-slate-50' : 'border border-slate-700 bg-slate-950 text-white'
                    }`}
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditingRowIndex(null); setIsAddingNewRow(false) }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-600 hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveEditedRow}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    isExcel ? 'bg-emerald-800 text-white' : 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  }`}
                >
                  Confirmar nesta Lista
                </button>
              </div>
            </div>
          )}

          {/* Editable Rows Table */}
          {!overrideLoading && overrideRows.length > 0 && (
            <div className="space-y-4">
              <div className={`overflow-x-auto rounded-2xl border ${isExcel ? 'bg-white border-slate-400 font-mono text-xs' : 'border-cyan-500/25 bg-slate-950/80'}`}>
                <table className="w-full text-left text-sm">
                  <thead className={isExcel ? 'bg-emerald-900 text-white text-xs' : 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white text-xs uppercase'}>
                    <tr>
                      <th className="px-3 py-3 font-bold">Motorista</th>
                      <th className="px-3 py-3 font-bold">Carrinha</th>
                      <th className="px-3 py-3 font-bold">Rota</th>
                      <th className="px-3 py-3 font-bold">Horário</th>
                      <th className="px-3 py-3 font-bold">Notas</th>
                      <th className="px-3 py-3 font-bold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className={isExcel ? 'divide-y divide-slate-300' : ''}>
                    {filteredOverrideRows.map((r, i) => (
                      <tr key={i} className={`border-t border-white/5 transition hover:bg-white/10 ${i % 2 === 0 ? (isExcel ? 'bg-white' : 'bg-cyan-950/15') : (isExcel ? 'bg-slate-50' : 'bg-violet-950/20')}`}>
                        <td className="px-3 py-2.5 font-bold">{r.driver}</td>
                        <td className={`px-3 py-2.5 ${isExcel ? '' : 'text-cyan-200'}`}>{r.vehicle || '—'}</td>
                        <td className={`px-3 py-2.5 font-bold ${isExcel ? 'text-emerald-800' : 'text-violet-200'}`}>{r.route || '—'}</td>
                        <td className="px-3 py-2.5 text-xs opacity-90">{r.earliestStart} – {r.latestStart}</td>
                        <td className="px-3 py-2.5 text-xs opacity-75 max-w-[10rem] truncate">{r.notes || '—'}</td>
                        <td className="px-3 py-2.5 text-right space-x-1">
                          <button
                            onClick={() => startEditRow(r, i)}
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 transition"
                            title="Editar"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => deleteRowFromOverride(i)}
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-red-500 hover:text-white text-red-300 transition"
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                disabled={overrideBusy}
                onClick={commitOverrideChanges}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition cursor-pointer disabled:opacity-50 ${
                  isExcel
                    ? 'bg-emerald-800 hover:bg-emerald-700 text-white border-2 border-emerald-950'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                }`}
              >
                {overrideBusy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Gravar Alterações de Escala no Firebase ({overrideRows.length} linhas)
              </button>
            </div>
          )}

          {!overrideLoading && overrideRows.length === 0 && (
            <div
              className={`p-8 text-center rounded-2xl border ${
                isExcel ? 'bg-white border-slate-400 font-mono text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              Nenhuma escala cadastrada para o dia {fmt(overrideDate)}. Pode adicionar linhas manualmente usando o botão acima ou carregar uma folha Excel na Aba 1.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HISTORICAL LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          {historyLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className={`animate-spin ${isExcel ? 'text-emerald-800' : 'text-cyan-400'}`} size={30} />
            </div>
          ) : allSchedules.length === 0 ? (
            <div
              className={`p-8 text-center rounded-2xl border ${
                isExcel ? 'bg-white border-slate-400 font-mono' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              Nenhum registo histórico de escalas encontrado no Firebase.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left Column: Dates list */}
              <div
                className={`p-3 rounded-2xl border space-y-2 max-h-[500px] overflow-y-auto ${
                  isExcel ? 'bg-white border-slate-400 font-mono text-xs' : 'bg-slate-950/80 border-cyan-500/25'
                }`}
              >
                <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider opacity-70">
                  Datas Registadas ({allSchedules.length})
                </div>
                {allSchedules.map((s) => (
                  <button
                    key={s.date}
                    onClick={() => handleSelectHistory(s)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                      selectedHistoryDate === s.date
                        ? isExcel
                          ? 'bg-emerald-800 text-white border-emerald-950'
                          : 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : isExcel
                        ? 'bg-[#ece9d8] border-slate-300 hover:bg-[#e0dccb]'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">{fmt(s.date)}</div>
                      <div className="text-[11px] opacity-70">{s.rows?.length || 0} motoristas</div>
                    </div>
                    <ArrowRight size={15} />
                  </button>
                ))}
              </div>

              {/* Right Column: Selected Schedule Details */}
              <div className="md:col-span-2 space-y-4">
                {selectedHistorySchedule ? (
                  <div
                    className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
                      isExcel ? 'bg-white border-slate-400 font-mono text-xs' : 'bg-slate-950/80 border-cyan-500/25 text-slate-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/30 pb-3">
                      <div>
                        <h3 className="text-lg font-bold">Escala de {fmt(selectedHistorySchedule.date)}</h3>
                        <p className="text-xs opacity-70">
                          Total de condutores: {selectedHistorySchedule.rows?.length || 0}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setOverrideDate(selectedHistorySchedule.date)
                            setActiveTab('override')
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isExcel ? 'bg-emerald-800 text-white' : 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
                          }`}
                        >
                          <Edit3 size={14} /> Editar
                        </button>
                        <button
                          disabled={historyDeleteBusy}
                          onClick={() => handleDeleteHistorySchedule(selectedHistorySchedule.date)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition cursor-pointer"
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Table View of Historical Rows */}
                    <div className="overflow-x-auto max-h-80 rounded-xl border border-slate-700/40">
                      <table className="w-full text-left text-xs">
                        <thead className={isExcel ? 'bg-[#ece9d8] text-slate-800' : 'bg-slate-900 text-cyan-300 uppercase'}>
                          <tr>
                            <th className="px-3 py-2">Motorista</th>
                            <th className="px-3 py-2">Carrinha</th>
                            <th className="px-3 py-2">Rota</th>
                            <th className="px-3 py-2">Horário</th>
                            <th className="px-3 py-2">Notas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                          {selectedHistorySchedule.rows?.map((r, i) => (
                            <tr key={i} className="hover:bg-white/5">
                              <td className="px-3 py-2 font-bold">{r.driver}</td>
                              <td className="px-3 py-2">{r.vehicle}</td>
                              <td className="px-3 py-2 font-bold text-violet-300">{r.route}</td>
                              <td className="px-3 py-2">{r.earliestStart} – {r.latestStart}</td>
                              <td className="px-3 py-2 text-slate-400 truncate max-w-[8rem]">{r.notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center opacity-60">Selecione uma data à esquerda para ver os detalhes.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BROADCAST ANNOUNCEMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'broadcast' && (
        <form onSubmit={handleSaveBroadcast} className="space-y-5">
          <div
            className={`p-5 sm:p-6 rounded-2xl border space-y-4 ${
              isExcel
                ? 'bg-[#ece9d8] border-2 border-slate-400 font-mono text-slate-900 shadow-sm'
                : 'bg-slate-950/85 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] text-slate-100'
            }`}
          >
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Megaphone className={isExcel ? 'text-emerald-800' : 'text-cyan-400'} size={20} />
                Publicar Aviso Geral para Toda a Frota
              </h3>
              <p className="text-xs opacity-70 mt-1">
                Esta mensagem aparecerá como uma faixa no topo do ecrã de todos os motoristas em tempo real.
              </p>
            </div>

            {broadcastMsg && (
              <div
                className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-xs sm:text-sm ${
                  broadcastMsg.type === 'ok'
                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                    : 'border-red-400/40 bg-red-500/15 text-red-200'
                }`}
              >
                {broadcastMsg.type === 'ok' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{broadcastMsg.text}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider opacity-80 mb-1.5">
                Texto do Aviso
              </label>
              <textarea
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Exemplo: Entrada do armazém obstruída nas obras, utilizar o Portão B. Atenção às condições climatéricas no turno da manhã."
                required
                className={`w-full p-3.5 rounded-xl text-sm font-semibold outline-none transition ${
                  isExcel
                    ? 'bg-white border border-slate-500 text-slate-900 focus:border-emerald-700'
                    : 'bg-slate-900 border border-slate-700 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider opacity-80 mb-1.5">
                  Nível de Urgência
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'info', label: 'Informativo', color: 'border-cyan-400 bg-cyan-500/20 text-cyan-300' },
                    { id: 'warning', label: 'Importante', color: 'border-amber-400 bg-amber-500/20 text-amber-300' },
                    { id: 'urgent', label: 'Urgente / Alerta', color: 'border-pink-400 bg-pink-500/20 text-pink-300' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setBroadcastLevel(lvl.id)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        broadcastLevel === lvl.id
                          ? lvl.color + ' shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                          : 'border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider opacity-80 mb-1.5">
                  Estado do Aviso
                </label>
                <label className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-700/40 bg-slate-900/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={broadcastActive}
                    onChange={(e) => setBroadcastActive(e.target.checked)}
                    className="h-5 w-5 accent-cyan-400 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold">
                    {broadcastActive ? 'Ativo (Visível nos ecrãs)' : 'Inativo (Oculto)'}
                  </span>
                </label>
              </div>
            </div>

            {/* Live Preview for Admin */}
            {broadcastMessage && (
              <div className="pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider opacity-70 mb-1">
                  Pré-visualização (como os condutores verão):
                </div>
                <div
                  className={`p-4 rounded-xl border flex items-center gap-3 ${
                    broadcastLevel === 'urgent'
                      ? 'border-pink-500/50 bg-pink-500/20 text-pink-100 shadow-[0_0_15px_rgba(236,72,153,0.3)] animate-pulse'
                      : broadcastLevel === 'warning'
                      ? 'border-amber-400/50 bg-amber-500/20 text-amber-100'
                      : 'border-cyan-400/50 bg-cyan-500/20 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  }`}
                >
                  <Megaphone size={20} className="shrink-0" />
                  <div className="text-xs sm:text-sm font-semibold">{broadcastMessage}</div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                disabled={broadcastBusy}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition cursor-pointer disabled:opacity-50 ${
                  isExcel
                    ? 'bg-emerald-800 hover:bg-emerald-700 text-white border-2 border-emerald-950'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                }`}
              >
                {broadcastBusy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Publicar Aviso Geral
              </button>

              <button
                type="button"
                disabled={broadcastBusy}
                onClick={handleClearBroadcast}
                className="px-4 py-3.5 rounded-xl text-xs sm:text-sm font-bold border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition cursor-pointer"
              >
                Desativar Aviso
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  )
}
