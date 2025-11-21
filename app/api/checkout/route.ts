import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPaymentRequest } from '@/lib/paymob-server'
import { getActiveDiscountPercent } from '@/lib/discounts'

export async function POST(request: NextRequest) {
  try {
    const { cartItems, shippingAddress, paymentMethod } = await request.json()
    
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Re-fetch products and variants from DB to prevent client tampering
    const productIds = Array.from(new Set(cartItems.map((i: any) => i.product_id)))
    const variantIds = Array.from(new Set(cartItems.map((i: any) => i.variant_id)))

    const { data: products, error: productsErr } = await supabase
      .from('products')
      .select('id, name, base_price')
      .in('id', productIds)

    if (productsErr) throw productsErr

    const { data: variants, error: variantsErr } = await supabase
      .from('product_variants')
      .select('id, product_id, size, color, price_adjustment, stock_quantity')
      .in('id', variantIds)

    if (variantsErr) throw variantsErr

    const productMap = new Map((products || []).map(p => [p.id, p]))
    const variantMap = new Map((variants || []).map(v => [v.id, v]))

    // Calculate total from trusted DB values
    let totalAmount = 0
    const paymobItems: Array<{ name: string; amount_cents: number; description?: string; quantity: number }> = []

    // Cache discount percentage per product for this request
    const discountCache = new Map<string, number>()
    for (const item of cartItems) {
      const product = productMap.get(item.product_id)
      const variant = variantMap.get(item.variant_id)
      if (!product || !variant || variant.product_id !== product.id) {
        return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 })
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
      }
      if (variant.stock_quantity != null && item.quantity > variant.stock_quantity) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
      }

      const baseUnit = (product.base_price || 0) + (variant.price_adjustment || 0)
      let percent = discountCache.get(item.product_id)
      if (percent == null) {
        percent = await getActiveDiscountPercent(item.product_id)
        discountCache.set(item.product_id, percent)
      }
      const unitPrice = percent > 0 ? Math.max(0, baseUnit * (1 - percent / 100)) : baseUnit
      totalAmount += unitPrice * item.quantity
      paymobItems.push({
        name: product.name,
        amount_cents: Math.round(unitPrice * 100),
        description: `${variant.size} - ${variant.color}`,
        quantity: item.quantity,
      })
    }

    // Add flat shipping (EGP)
    totalAmount += 80

    // Create order in database first
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id || null,
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

    // Create order items with trustworthy prices
    for (const item of cartItems) {
      const product = productMap.get(item.product_id)!
      const variant = variantMap.get(item.variant_id)!
      const baseUnit = (product.base_price || 0) + (variant.price_adjustment || 0)
      const percent = discountCache.get(item.product_id) || 0
      const unitPrice = percent > 0 ? Math.max(0, baseUnit * (1 - percent / 100)) : baseUnit
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price_at_purchase: unitPrice,
      })
    }

    // If Cash on Delivery, skip Paymob and return orderId
    if (paymentMethod === 'cod') {
      // Best-effort: clear authenticated user's cart
      if (user?.id) {
        await supabase.from('cart_items').delete().eq('user_id', user.id)
      }
      return NextResponse.json({ orderId: order.id })
    }

    // Create Paymob payment request (server-side) for online payments
    const paymentRequest = await createPaymentRequest({
      amountCents: Math.round(totalAmount * 100),
      currency: 'EGP',
      items: paymobItems,
      shipping: {
        first_name: shippingAddress.firstName,
        last_name: shippingAddress.lastName,
        email: shippingAddress.email,
        phone_number: shippingAddress.phone || '',
        street: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country || 'EG',
        postal_code: shippingAddress.zipCode,
      },
      merchantOrderId: String(order.id),
    })

    // Persist Paymob identifiers on the order
    await supabase
      .from('orders')
      .update({
        paymob_order_id: String(paymentRequest.paymob_order_id),
        paymob_payment_token: paymentRequest.token,
      })
      .eq('id', order.id)

    return NextResponse.json({
      paymentToken: paymentRequest.token,
      orderId: order.id,
      iframeUrl: paymentRequest.iframe_url,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
