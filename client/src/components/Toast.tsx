import { useEffect } from 'react'
import './Toast.css'

export type ToastItem = {
  id: string
  type: 'success' | 'error'
  message: string
}

type Props = {
  toasts: ToastItem[]
  onClose: (id: string) => void
}

export function Toast({ toasts, onClose }: Props) {
  return (
    <div className="ToastContainer" aria-live="polite">
      {toasts.map((t) => (
        <ToastEntry key={t.id} toast={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  )
}

function ToastEntry({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`ToastItem ToastItem--${toast.type}`}>
      <span className="ToastMessage">{toast.message}</span>
      <button className="ToastClose" onClick={onClose} aria-label="Fermer">×</button>
    </div>
  )
}

let _nextId = 0
export function makeToastId() {
  return String(++_nextId)
}
