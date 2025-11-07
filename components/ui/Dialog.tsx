'use client'

import React, { createContext, useContext, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type DialogContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

function useDialogContext(): DialogContextValue {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('Dialog components must be used within <Dialog>')
  return ctx
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children: React.ReactNode
}

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  const { open, onOpenChange } = useDialogContext()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  useEffect(() => {
    if (open) {
      const previouslyFocused = document.activeElement as HTMLElement | null
      panelRef.current?.focus()
      return () => previouslyFocused?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false)
      }}
    >
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full max-w-2xl rounded-lg border bg-white p-4 sm:p-6 shadow-lg outline-none max-h-[85vh] overflow-y-auto',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

interface DialogHeaderProps {
  className?: string
  children: React.ReactNode
}

export function DialogHeader({ className, children }: DialogHeaderProps) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string
}

export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <h2 className={cn('text-xl font-semibold text-gray-900', className)} {...props} />
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string
}

export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return <p className={cn('text-sm text-gray-500', className)} {...props} />
}

interface DialogFooterProps {
  className?: string
  children: React.ReactNode
}

export function DialogFooter({ className, children }: DialogFooterProps) {
  return <div className={cn('mt-6 flex justify-end gap-2', className)}>{children}</div>
}

interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

export function DialogClose({ asChild, onClick, ...props }: DialogCloseProps) {
  const { onOpenChange } = useDialogContext()
  if (asChild) {
    // Consumer will render the child button and handle props via clone; keep simple variant
    return (
      <button
        {...props}
        onClick={(e) => {
          onOpenChange(false)
          onClick?.(e)
        }}
      />
    )
  }
  return (
    <button
      {...props}
      onClick={(e) => {
        onOpenChange(false)
        onClick?.(e)
      }}
    />
  )
}

export { Dialog as default }



