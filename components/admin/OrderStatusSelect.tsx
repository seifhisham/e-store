'use client'

import { SelectHTMLAttributes, useState, useTransition } from 'react'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface OrderStatusSelectProps extends Pick<SelectHTMLAttributes<HTMLSelectElement>, 'defaultValue' | 'name' | 'className'> {
  action: (formData: FormData) => void
  options: Option[]
}

export default function OrderStatusSelect({ action, defaultValue, name, className, options }: OrderStatusSelectProps) {
  const [value, setValue] = useState<string>(String(defaultValue ?? options[0]?.value ?? ''))
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value
    setValue(next)

    const fd = new FormData()
    fd.set(name || 'status', next)
    startTransition(async () => {
      try {
        await action(fd)
      } catch (err) {
        // no-op: keep optimistic value; page will reflect true value on next load
      }
    })
  }

  return (
    <Select
      value={value}
      name={name}
      className={cn(
        // compact pill styling
        'h-9 md:h-9 rounded-full px-3 text-xs font-medium border border-transparent cursor-pointer w-full',
        // color coding by status
        value === 'pending' && 'bg-amber-100 text-amber-800',
        value === 'processing' && 'bg-blue-100 text-blue-800',
        value === 'shipped' && 'bg-indigo-100 text-indigo-800',
        value === 'completed' && 'bg-green-100 text-green-800',
        value === 'cancelled' && 'bg-rose-100 text-rose-800',
        // fallbacks + hover
        (!value || !( ['pending','processing','shipped','completed','cancelled'].includes(value) )) && 'bg-gray-100 text-gray-800',
        'transition-colors hover:brightness-95',
        className,
      )}
      onChange={handleChange}
      disabled={isPending}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  )
}
