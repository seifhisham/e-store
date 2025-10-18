import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paymob-signature')
    
    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 })
    }

    // Verify Paymob webhook signature
    const hmac = crypto.createHmac('sha256', process.env.PAYMOB_HMAC_KEY!)
    hmac.update(body)
    const calculatedSignature = hmac.digest('hex')

    if (signature !== calculatedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    const { order_id, status, amount_cents } = payload

    if (!order_id) {
      return NextResponse.json({ error: 'No order ID provided' }, { status: 400 })
    }

    const supabase = await createClient()

    // Update order status based on payment result
    let orderStatus = 'pending'
    if (status === 'success' || status === 'paid') {
      orderStatus = 'completed'
    } else if (status === 'failed' || status === 'cancelled') {
      orderStatus = 'cancelled'
    }

    const { error } = await supabase
      .from('orders')
      .update({ 
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id)

    if (error) {
      console.error('Error updating order status:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // If payment was successful, clear the user's cart
    if (orderStatus === 'completed') {
      const { data: order } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', order_id)
        .single()

      if (order?.user_id) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', order.user_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Paymob webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
