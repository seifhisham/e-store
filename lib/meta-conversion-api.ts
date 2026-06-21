import crypto from 'crypto'

export type MetaEventName =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'

export type MetaUserData = {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  fbp?: string
  fbc?: string
  clientIp?: string
  clientUserAgent?: string
  externalId?: string
}

export type MetaCustomData = {
  value?: number
  currency?: string
  contentIds?: string[]
  contentName?: string
  contentType?: string
  numItems?: number
  orderId?: string
}

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

function buildUserDataPayload(userData: MetaUserData): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  if (userData.email) payload.em = [hashValue(userData.email)]
  if (userData.phone) payload.ph = [hashValue(normalizePhone(userData.phone))]
  if (userData.firstName) payload.fn = [hashValue(userData.firstName)]
  if (userData.lastName) payload.ln = [hashValue(userData.lastName)]
  if (userData.city) payload.ct = [hashValue(userData.city)]
  if (userData.state) payload.st = [hashValue(userData.state)]
  if (userData.zipCode) payload.zp = [hashValue(userData.zipCode)]
  if (userData.country) payload.country = [hashValue(userData.country)]
  if (userData.fbp) payload.fbp = userData.fbp
  if (userData.fbc) payload.fbc = userData.fbc
  if (userData.clientIp) payload.client_ip_address = userData.clientIp
  if (userData.clientUserAgent) payload.client_user_agent = userData.clientUserAgent
  if (userData.externalId) payload.external_id = [hashValue(userData.externalId)]

  return payload
}

function buildCustomDataPayload(customData: MetaCustomData): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  if (customData.value != null) payload.value = customData.value
  if (customData.currency) payload.currency = customData.currency
  if (customData.contentIds?.length) payload.content_ids = customData.contentIds
  if (customData.contentName) payload.content_name = customData.contentName
  if (customData.contentType) payload.content_type = customData.contentType
  if (customData.numItems != null) payload.num_items = customData.numItems
  if (customData.orderId) payload.order_id = customData.orderId

  return payload
}

export function isMetaConversionApiConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID &&
      process.env.FACEBOOK_CONVERSION_API_ACCESS_TOKEN
  )
}

export async function sendMetaConversionEvent(params: {
  eventName: MetaEventName
  eventId: string
  eventSourceUrl?: string
  userData?: MetaUserData
  customData?: MetaCustomData
}) {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
  const accessToken = process.env.FACEBOOK_CONVERSION_API_ACCESS_TOKEN

  if (!pixelId || !accessToken) {
    console.warn('[Meta CAPI] Skipped event because pixel ID or access token is missing')
    return { ok: false, skipped: true as const }
  }

  const eventPayload: Record<string, unknown> = {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    action_source: 'website',
  }

  if (params.eventSourceUrl) eventPayload.event_source_url = params.eventSourceUrl
  if (params.userData) eventPayload.user_data = buildUserDataPayload(params.userData)

  const customData = params.customData ? buildCustomDataPayload(params.customData) : {}
  if (Object.keys(customData).length > 0) eventPayload.custom_data = customData

  const body: Record<string, unknown> = {
    data: [eventPayload],
    access_token: accessToken,
  }

  const testEventCode = process.env.FACEBOOK_TEST_EVENT_CODE
  if (testEventCode) body.test_event_code = testEventCode

  const response = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error('[Meta CAPI] Failed to send event', params.eventName, result)
    return { ok: false, skipped: false as const, error: result }
  }

  return { ok: true, skipped: false as const, result }
}
