import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymob } from '@/lib/paymob'

export async function POST(request: NextRequest) {
  try {
    const { cartItems, shippingAddress } = await request.json()
    
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Calculate total amount
    let totalAmount = 0
    
    for (const item of cartItems) {
      const price = item.product.base_price + item.variant.price_adjustment
      const itemTotal = price * item.quantity
      totalAmount += itemTotal
    }

    // Add shipping if total is less than $50
    if (totalAmount < 50) {
      totalAmount += 9.99
    }

    // Add tax (8%)
    const tax = totalAmount * 0.08
    totalAmount += tax

    // Create order in database first
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: null, // Will be updated after payment
        guest_email: shippingAddress.email,
        total_amount: totalAmount,
        status: 'pending',
        shipping_address: shippingAddress,
        paymob_order_id: null, // Will be set after Paymob order creation
        paymob_payment_token: null // Will be set after Paymob order creation
      })
      .select()
      .single()

    if (orderError) {
      throw new Error('Failed to create order')
    }

    // Create order items
    for (const item of cartItems) {
      const price = item.product.base_price + item.variant.price_adjustment
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price_at_purchase: price
      })
    }

    // Create Paymob checkout session
    const checkoutData = {
      amount_cents: Math.round(totalAmount * 100), // Convert to cents
      currency: 'EGP', // Paymob primarily uses EGP
      order_id: order.id,
      items: cartItems.map((item: any) => ({
        name: item.product.name,
        amount_cents: Math.round((item.product.base_price + item.variant.price_adjustment) * 100),
        description: `${item.variant.size} - ${item.variant.color}`,
        quantity: item.quantity
      })),
      shipping_data: {
        first_name: shippingAddress.firstName,
        last_name: shippingAddress.lastName,
        email: shippingAddress.email,
        phone_number: shippingAddress.phone || '',
        street: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country || 'EG',
        postal_code: shippingAddress.zipCode
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?order_id=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`
    }

    // Create Paymob payment request
    const paymentRequest = await paymob.createPaymentRequest(checkoutData)
    
    if (!paymentRequest) {
      throw new Error('Failed to create payment request')
    }

    return NextResponse.json({ 
      paymentToken: paymentRequest.token,
      orderId: order.id,
      iframeUrl: paymentRequest.iframe_url
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
