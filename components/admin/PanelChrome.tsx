'use client'

/** Client-side chrome shared by every panel page: toasts and the Cmd+K palette. */
import { ToastProvider } from './Toast'
import CommandPalette from './CommandPalette'

export default function PanelChrome({ role, children }: { role: string; children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <CommandPalette role={role} />
    </ToastProvider>
  )
}
