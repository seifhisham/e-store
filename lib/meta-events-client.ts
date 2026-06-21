'use client'

import type { MetaCustomData, MetaEventName, MetaUserData } from '@/lib/meta-conversion-api'

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

export function getMetaBrowserIds() {
  return {
    fbp: getCookie('_fbp'),
    fbc: getCookie('_fbc'),
  }
}

export function createMetaEventId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

export function trackMetaEvent(
  eventName: MetaEventName,
  customData?: MetaCustomData,
  eventId?: string,
  userData?: Pick<MetaUserData, 'email' | 'phone' | 'firstName' | 'lastName' | 'city' | 'state' | 'zipCode' | 'country'>
) {
  if (typeof window === 'undefined') return null

  const id = eventId || createMetaEventId(eventName.toLowerCase())
  const pixelData: Record<string, unknown> = {}

  if (customData?.value != null) pixelData.value = customData.value
  if (customData?.currency) pixelData.currency = customData.currency
  if (customData?.contentIds?.length) pixelData.content_ids = customData.contentIds
  if (customData?.contentName) pixelData.content_name = customData.contentName
  if (customData?.contentType) pixelData.content_type = customData.contentType
  if (customData?.numItems != null) pixelData.num_items = customData.numItems

  if (window.fbq) {
    window.fbq('track', eventName, pixelData, { eventID: id })
  }

  const { fbp, fbc } = getMetaBrowserIds()

  fetch('/api/meta/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName,
      eventId: id,
      eventSourceUrl: window.location.href,
      fbp,
      fbc,
      customData,
      userData,
    }),
    keepalive: true,
  }).catch(() => {})

  return id
}
