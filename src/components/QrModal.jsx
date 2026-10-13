import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, X } from 'lucide-react'

export default function QrModal() {
  const [open, setOpen] = useState(false)
  const url = window.location.origin

  return (
    <>
      <button id="qr-button" onClick={() => setOpen(true)} aria-label="Show QR code"
        className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10">
        <QrCode size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="rise relative w-full max-w-xs rounded-3xl bg-slate-900 p-6 text-center ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} aria-label="Close" className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-white/10">
              <X size={18} />
            </button>
            <h2 className="mb-1 text-lg font-bold">Open on your phone</h2>
            <p className="mb-4 text-sm text-slate-400">Scan with the iPhone camera</p>
            <div className="inline-block rounded-2xl bg-white p-4">
              <QRCodeSVG value={url} size={200} level="M" />
            </div>
            <p className="mt-4 break-all text-xs text-slate-400">{url}</p>
          </div>
        </div>
      )}
    </>
  )
}
