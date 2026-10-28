'use client'

import { useState } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'success'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  const variantColors = {
    danger: { bg: '#ef4444', icon: '🗑️', iconBg: '#fef2f2', iconColor: '#dc2626' },
    warning: { bg: '#f59e0b', icon: '⚠️', iconBg: '#fffbeb', iconColor: '#92400e' },
    success: { bg: '#10b981', icon: '✅', iconBg: '#ecfdf5', iconColor: '#065f46' },
  }

  const c = variantColors[variant]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: c.iconBg,
            color: c.iconColor,
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
          }}
        >
          {c.icon}
        </div>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '17px',
            fontWeight: 700,
            marginBottom: '8px',
            color: '#0f172a',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            textAlign: 'center',
            fontSize: '13px',
            color: '#475569',
            marginBottom: '20px',
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#475569',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              background: c.bg,
              color: 'white',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook لتسهيل استخدام ConfirmDialog
 */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    message: string
    variant: 'danger' | 'warning' | 'success'
    onConfirm: () => void
  }>({
    open: false,
    title: '',
    message: '',
    variant: 'danger',
    onConfirm: () => {},
  })

  const confirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    variant: 'danger' | 'warning' | 'success' = 'danger'
  ) => {
    setState({ open: true, title, message, onConfirm, variant })
  }

  const close = () => {
    setState({ ...state, open: false })
  }

  return {
    ConfirmDialog: (
      <ConfirmDialog
        open={state.open}
        title={state.title}
        message={state.message}
        variant={state.variant}
        onConfirm={() => {
          state.onConfirm()
          close()
        }}
        onCancel={close}
      />
    ),
    confirm,
  }
}
