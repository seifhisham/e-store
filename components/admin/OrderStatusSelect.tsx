'use client'

import { SelectHTMLAttributes } from 'react'
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
  return (
    <form action={action}>
      <Select
        defaultValue={defaultValue}
        name={name}
        className={className}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </form>
  )
}
