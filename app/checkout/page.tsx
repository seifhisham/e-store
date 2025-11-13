'use client'

import { useState, useRef } from 'react'

import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useRouter } from 'next/navigation'
import { CreditCard, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod' | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'EG'
  })
  const [phoneError, setPhoneError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }))
    if (name === 'phone') {
      setPhoneError('')
    }
  }

  const toLatinDigits = (s: string) =>
    s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (ch) => {
      const code = ch.charCodeAt(0)
      let digit = -1
      if (code >= 0x0660 && code <= 0x0669) digit = code - 0x0660
      else if (code >= 0x06F0 && code <= 0x06F9) digit = code - 0x06F0
      return String(digit)
    })

  const normalizePhone = (input: string) => {
    let s = input.trim()
    s = toLatinDigits(s)
    s = s.replace(/[\u200E\u200F\u202A-\u202E]/g, '') // remove RTL marks
    s = s.replace(/[()\s-]/g, '') // remove spaces, hyphens, parentheses
    // Convert 00 prefix to +
    if (s.startsWith('00')) s = '+' + s.slice(2)
    const country = (shippingAddress.country || 'EG').toUpperCase()
    // If user enters local style numbers, try to infer country code
    if (!s.startsWith('+')) {
      const digitsOnly = s.replace(/[^0-9]/g, '')
      if (country === 'EG') {
        // Common Egyptian formats: 01XXXXXXXXX or 1XXXXXXXXX or 20XXXXXXXXXX
        if (digitsOnly.startsWith('0')) {
          s = '+20' + digitsOnly.slice(1)
        } else if (digitsOnly.startsWith('20')) {
          s = '+' + digitsOnly
        } else {
          s = '+20' + digitsOnly
        }
      } else {
        // As a fallback, if no + provided, keep as-is to trigger friendly error
        s = '+' + digitsOnly
      }
    }
    return s
  }

  const validatePhone = (normalized: string) => {
    const e164 = /^\+[1-9]\d{7,14}$/
    if (!e164.test(normalized)) {
      setPhoneError('Enter phone with country code, e.g. +201234567890')
      return false
    }
    setPhoneError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!paymentMethod) {
        setLoading(false)
        alert('Please choose a payment method to continue.')
        return
      }
      // Normalize and validate phone in E.164 (+XXXXXXXXXXXX)
      const normalizedPhone = normalizePhone(shippingAddress.phone)
      if (!validatePhone(normalizedPhone)) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: items,
          shippingAddress: { ...shippingAddress, phone: normalizedPhone },
          paymentMethod,
        })
      })

      const { paymentToken, orderId, iframeUrl, error } = await response.json()
      if (error) throw new Error(error)

      // Handle based on payment method
      if (paymentMethod === 'cod') {
        if (!orderId) throw new Error('Order was not created')
        router.push(`/checkout/success?merchant_order_id=${orderId}`)
        return
      }
      // Redirect to Paymob payment page for online payments
      if (iframeUrl) {
        window.location.href = iframeUrl
      } else {
        throw new Error('Payment redirect unavailable')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const subtotal = getTotalPrice()
  const shipping = 80
  const total = subtotal + shipping

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {/* Shipping Information */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Shipping Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      First Name *
                    </label>
                    <Input
                      name="firstName"
                      required
                      value={shippingAddress.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Last Name *
                    </label>
                    <Input
                      name="lastName"
                      required
                      value={shippingAddress.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Email *
                  </label>
                  <Input
                    name="email"
                    type="email"
                    required
                    value={shippingAddress.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Phone *
                  </label>
                  <Input
                    name="phone"
                    type="tel"
                    required
                    placeholder="+201xxxxxxxxx"
                    value={shippingAddress.phone}
                    onChange={handleInputChange}
                    onBlur={(e) => {
                      const normalized = normalizePhone(e.target.value);
                      setShippingAddress((prev) => ({
                        ...prev,
                        phone: normalized,
                      }));
                      validatePhone(normalized);
                    }}
                    className="placeholder:text-gray-400"
                  />
                  {phoneError && (
                    <p className="text-red-600 text-xs mt-1">{phoneError}</p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Address *
                  </label>
                  <Input
                    name="address"
                    required
                    value={shippingAddress.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      City *
                    </label>
                    <Input
                      name="city"
                      required
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      State *
                    </label>
                    <Select
                      name="state"
                      required
                      value={shippingAddress.state}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Governorate</option>
                      <option value="C">Cairo</option>
                      <option value="GZ">Giza</option>
                      <option value="ALX">Alexandria</option>
                      <option value="SHR">Sharqia</option>
                      <option value="DK">Dakahlia</option>
                      <option value="BH">Beheira</option>
                      <option value="MNF">Monufia</option>
                      <option value="GH">Gharbia</option>
                      <option value="KFS">Kafr El Sheikh</option>
                      <option value="DMN">Damietta</option>
                      <option value="PT">Port Said</option>
                      <option value="SUZ">Suez</option>
                      <option value="IS">Ismailia</option>
                      <option value="NSR">North Sinai</option>
                      <option value="SSR">South Sinai</option>
                      <option value="BSW">Beni Suef</option>
                      <option value="FYM">Fayoum</option>
                      <option value="MN">Minya</option>
                      <option value="ASU">Asyut</option>
                      <option value="SWG">Sohag</option>
                      <option value="QN">Qena</option>
                      <option value="LX">Luxor</option>
                      <option value="ASN">Aswan</option>
                      <option value="MT">Matrouh</option>
                      <option value="NWB">New Valley</option>
                      <option value="RD">Red Sea</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      ZIP Code *
                    </label>
                    <Input
                      name="zipCode"
                      required
                      value={shippingAddress.zipCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-foreground mb-2">Payment Method</h2>
                <p className="text-sm text-foreground/70 mb-3">Choose one of the options below to place your order.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* <Button
                    type="button"
                    disabled={loading || items.length === 0}
                    className="w-full bg-black text-white hover:bg-primary hover:text-foreground"
                    onClick={() => {
                      if (loading) return
                      setPaymentMethod('online')
                      setTimeout(() => formRef.current?.requestSubmit(), 0)
                    }}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay Online {items.length > 0 ? `(${formatCurrency(total)})` : ''}
                  </Button> */}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading || items.length === 0}
                    className="w-full"
                    onClick={() => {
                      if (loading) return
                      setPaymentMethod('cod')
                      setTimeout(() => formRef.current?.requestSubmit(), 0)
                    }}
                  >
                    Place Order (Cash on Delivery)
                  </Button>
                </div>
              </div>

              {/* Payment Footer Note */}
              <div className="pt-4 border-t">
                <p className="text-xs text-foreground/80 mt-2 text-center flex items-center justify-center">
                  <Lock className="w-3 h-3 mr-1" />
                  Payments are processed securely. Online payments use Paymob.
                </p>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Order Summary
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/80">Subtotal</span>
                <span className="font-medium text-black">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground/80">Shipping</span>
                <span className="font-medium text-black">
                  {formatCurrency(shipping)}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold text-black">
                  <span>Total</span>
                  <span className="text-black">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Cart Items */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-foreground mb-3">
                Items ({items.length})
              </h3>
              <div className="space-y-2">
                {items.map((item) => {
                  const price =
                    item.product.base_price + item.variant.price_adjustment;
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-foreground/80">
                        {item.product.name} ({item.variant.size},{" "}
                        {item.variant.color}) x {item.quantity}
                      </span>
                      <span className="font-medium text-black">
                        {formatCurrency(price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
