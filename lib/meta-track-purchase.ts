import { createClient } from '@/lib/supabase/server'
import { sendMetaConversionEvent, type MetaUserData } from '@/lib/meta-conversion-api'

type TrackPurchaseOptions = {
  eventSourceUrl?: string
  userData?: Pick<
    MetaUserData,
    'fbp' | 'fbc' | 'clientIp' | 'clientUserAgent' | 'email' | 'phone' | 'firstName' | 'lastName' | 'city' | 'state' | 'zipCode' | 'country' | 'externalId'
  >
}

export async function trackMetaPurchaseForOrder(orderId: string, options: TrackPurchaseOptions = {}) {
  const supabase = await createClient()
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id,
      total_amount,
      guest_email,
      shipping_address,
      user_id,
      order_items(product_id, quantity, price_at_purchase)
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    console.error('[Meta CAPI] Could not load order for purchase event', orderId, error)
    return { ok: false, skipped: true as const }
  }

  const shipping = (order.shipping_address || {}) as Record<string, string | undefined>
  const orderItems = (order.order_items || []) as Array<{ product_id: string; quantity: number }>

  return sendMetaConversionEvent({
    eventName: 'Purchase',
    eventId: `purchase_${order.id}`,
    eventSourceUrl: options.eventSourceUrl,
    userData: {
      email: options.userData?.email || shipping.email || order.guest_email || undefined,
      phone: options.userData?.phone || shipping.phone,
      firstName: options.userData?.firstName || shipping.firstName,
      lastName: options.userData?.lastName || shipping.lastName,
      city: options.userData?.city || shipping.city,
      state: options.userData?.state || shipping.state,
      zipCode: options.userData?.zipCode || shipping.zipCode,
      country: options.userData?.country || shipping.country || 'eg',
      fbp: options.userData?.fbp,
      fbc: options.userData?.fbc,
      clientIp: options.userData?.clientIp,
      clientUserAgent: options.userData?.clientUserAgent,
      externalId: options.userData?.externalId || order.user_id || undefined,
    },
    customData: {
      value: order.total_amount,
      currency: 'EGP',
      contentIds: orderItems.map((item) => item.product_id),
      contentType: 'product',
      numItems: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      orderId: order.id,
    },
  })
}

export async function trackMetaPurchaseForPaymobOrder(paymobOrderId: string, options: TrackPurchaseOptions = {}) {
  const supabase = await createClient()
  const { data: order, error } = await supabase
    .from('orders')
    .select('id')
    .eq('paymob_order_id', paymobOrderId)
    .single()

  if (error || !order) {
    console.error('[Meta CAPI] Could not map Paymob order to purchase event', paymobOrderId, error)
    return { ok: false, skipped: true as const }
  }

  return trackMetaPurchaseForOrder(order.id, options)
}
