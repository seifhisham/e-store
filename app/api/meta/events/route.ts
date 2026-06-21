import { NextRequest, NextResponse } from 'next/server'
import { sendMetaConversionEvent, type MetaCustomData, type MetaEventName, type MetaUserData } from '@/lib/meta-conversion-api'

type MetaEventRequestBody = {
  eventName: MetaEventName
  eventId: string
  eventSourceUrl?: string
  fbp?: string
  fbc?: string
  customData?: MetaCustomData
  userData?: Pick<
    MetaUserData,
    'email' | 'phone' | 'firstName' | 'lastName' | 'city' | 'state' | 'zipCode' | 'country' | 'externalId'
  >
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MetaEventRequestBody

    if (!body.eventName || !body.eventId) {
      return NextResponse.json({ error: 'Missing eventName or eventId' }, { status: 400 })
    }

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      undefined
    const clientUserAgent = request.headers.get('user-agent') || undefined

    const result = await sendMetaConversionEvent({
      eventName: body.eventName,
      eventId: body.eventId,
      eventSourceUrl: body.eventSourceUrl,
      userData: {
        ...body.userData,
        fbp: body.fbp,
        fbc: body.fbc,
        clientIp,
        clientUserAgent,
      },
      customData: body.customData,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Meta CAPI] API route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
