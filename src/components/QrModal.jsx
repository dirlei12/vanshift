import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, X, Smartphone } from 'lucide-react'

export default function QrModal({ isOpen: controlledOpen, onClose: controlledClose }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof controlledOpen === 'boolean'
  const open = isControlled ? controlledOpen : internalOpen
  const handleClose = isControlled ? controlledClose : () => setInternalOpen(false)
  const url = typeof window !== 'undefined' ? window.location.origin : 'https://vanshiftallaces.web.app'

  return (
    <>
      {!isControlled && (
        <button
          id="qr-button"
          onClick={() => setInternalOpen(true)}
          aria-label="Show QR code"
          className="rounded-full border border-cyan-500/30 bg-slate-950/80 p-2.5 text-cyan-300 transition hover:border-cyan-400 hover:text-white cursor-pointer"
        >
          <QrCode size={18} />
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="rise relative w-full max-w-xs rounded-3xl border border-cyan-500/40 bg-slate-950 p-6 text-center text-white shadow-[0_0_35px_rgba(6,182,212,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              <Smartphone size={24} />
            </div>

            <h2 className="mb-1 text-lg font-black tracking-tight text-white">
              Abrir no Telemóvel
            </h2>
            <p className="mb-4 text-xs text-slate-400">
              Aponte a câmara do telemóvel para aceder à aplicação na carrinha
            </p>

            <div className="inline-block rounded-2xl bg-white p-3.5 shadow-lg">
              <QRCodeSVG value={url} size={190} level="M" />
            </div>

            <p className="mt-3.5 break-all text-[11px] font-mono text-cyan-300/80 bg-slate-900/90 py-1.5 px-3 rounded-lg border border-slate-800">
              {url}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
