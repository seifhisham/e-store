'use client'

import { SelectHTMLAttributes, useState, useTransition } from 'react'
import { Select } from '@/components/ui/Select'

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
      className={className}
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
