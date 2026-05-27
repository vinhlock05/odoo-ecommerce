'use client'

import { useEffect, useState } from 'react'

interface ToastItem {
  id: number
  type: 'success' | 'error'
  message: string
}

let _nextId = 0

export function showToast(type: 'success' | 'error', message: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('fashionos:toast', { detail: { type, message } })
  )
}

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    function onToast(e: Event) {
      const { type, message } = (e as CustomEvent<{ type: 'success' | 'error'; message: string }>).detail
      const id = ++_nextId
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3200)
    }

    window.addEventListener('fashionos:toast', onToast)
    return () => window.removeEventListener('fashionos:toast', onToast)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-label="Thông báo"
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            toast-in pointer-events-auto
            flex items-center gap-3
            px-4 py-3 min-w-[240px] max-w-xs
            text-sm font-medium shadow-lg
            ${toast.type === 'success'
              ? 'bg-fashionos-black text-fashionos-white'
              : 'bg-red-600 text-white'
            }
          `}
        >
          {toast.type === 'success' ? <CheckIcon /> : <XCircleIcon />}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="opacity-60 hover:opacity-100 transition-opacity ml-1"
            aria-label="Đóng"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
