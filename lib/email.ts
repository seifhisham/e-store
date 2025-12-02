import { Resend } from 'resend'

export type OrderEmailItem = {
  name: string
  size?: string
  color?: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type NewOrderEmailInput = {
  orderId: string | number
  userEmail?: string | null
  paymentMethod: 'online' | 'cod' | string
  items: OrderEmailItem[]
  shippingAmount: number
  totalAmount: number
}

function formatEGP(amount: number) {
  try {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `EGP ${amount.toFixed(2)}`
  }
}

export async function sendNewOrderEmail(input: NewOrderEmailInput) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM // e.g. "Store <orders@yourdomain.com>"
  const to = process.env.ADMIN_EMAIL || process.env.RESEND_TO // destination for notifications

  if (!apiKey || !from || !to) {
    // Missing config: skip silently (don't block order creation)
    return
  }

  const resend = new Resend(apiKey)

  const subject = `New order #${input.orderId} - ${formatEGP(input.totalAmount)}`
  const rows = input.items
    .map(
      (it) =>
        `<tr>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${it.name}${it.size || it.color ? ` <span style='color:#6b7280'>( ${[it.size, it.color].filter(Boolean).join(', ')} )</span>` : ''}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${it.quantity}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${formatEGP(it.unitPrice)}</td>
          <td style="padding:6px 8px;border:1px solid #e5e7eb;">${formatEGP(it.lineTotal)}</td>
        </tr>`
    )
    .join('')

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
      <h2 style="margin:0 0 8px 0;">New order received</h2>
      <p style="margin:0 0 16px 0;">Order <strong>#${input.orderId}</strong> (${input.paymentMethod.toUpperCase()}). ${input.userEmail ? `Customer: <a href="mailto:${input.userEmail}">${input.userEmail}</a>.` : ''}</p>
      <table style="border-collapse:collapse;width:100%;margin-top:8px;">
        <thead>
          <tr>
            <th align="left" style="padding:6px 8px;border:1px solid #e5e7eb;background:#f9fafb;">Item</th>
            <th align="left" style="padding:6px 8px;border:1px solid #e5e7eb;background:#f9fafb;">Qty</th>
            <th align="left" style="padding:6px 8px;border:1px solid #e5e7eb;background:#f9fafb;">Unit</th>
            <th align="left" style="padding:6px 8px;border:1px solid #e5e7eb;background:#f9fafb;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div style="margin-top:12px;border-top:1px solid #e5e7eb;padding-top:12px;">
        <p style="margin:4px 0;">Shipping: <strong>${formatEGP(input.shippingAmount)}</strong></p>
        <p style="margin:4px 0;">Grand Total: <strong>${formatEGP(input.totalAmount)}</strong></p>
      </div>
      <p style="margin-top:16px;color:#6b7280;">This is an automated notification from your store.</p>
    </div>
  `

  await resend.emails.send({ from, to, subject, html })
}
