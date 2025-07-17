'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ToastProps {
  id?: string
  variant?: 'default' | 'success' | 'warning' | 'error'
  title?: string
  description?: string
  duration?: number
  onClose?: () => void
}

export function Toast({
  variant = 'default',
  title,
  description,
  duration = 5000,
  onClose
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300) // Wait for animation
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-sm',
        'transition-all duration-300 ease-in-out',
        {
          'bg-white border-gray-200': variant === 'default',
          'bg-green-50 border-green-200 text-green-800': variant === 'success',
          'bg-yellow-50 border-yellow-200 text-yellow-800': variant === 'warning',
          'bg-red-50 border-red-200 text-red-800': variant === 'error',
        },
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {title && (
            <div className="font-medium text-sm mb-1">{title}</div>
          )}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose?.(), 300)
          }}
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Toast container and provider
interface ToastMessage {
  id: string
  variant?: 'default' | 'success' | 'warning' | 'error'
  title?: string
  description?: string
  duration?: number
}

let toastCounter = 0
const toastListeners: ((toasts: ToastMessage[]) => void)[] = []
let toasts: ToastMessage[] = []

export const toast = {
  success: (title: string, description?: string) => 
    addToast({ variant: 'success', title, description }),
  error: (title: string, description?: string) => 
    addToast({ variant: 'error', title, description }),
  warning: (title: string, description?: string) => 
    addToast({ variant: 'warning', title, description }),
  default: (title: string, description?: string) => 
    addToast({ variant: 'default', title, description }),
}

function addToast(toast: Omit<ToastMessage, 'id'>) {
  const id = `toast-${++toastCounter}`
  const newToast = { ...toast, id }
  toasts = [...toasts, newToast]
  toastListeners.forEach(listener => listener(toasts))
  
  // Auto remove after duration
  setTimeout(() => {
    removeToast(id)
  }, toast.duration || 5000)
}

function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id)
  toastListeners.forEach(listener => listener(toasts))
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const listener = (toasts: ToastMessage[]) => setCurrentToasts([...toasts])
    toastListeners.push(listener)
    
    return () => {
      const index = toastListeners.indexOf(listener)
      if (index > -1) toastListeners.splice(index, 1)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {currentToasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
} 