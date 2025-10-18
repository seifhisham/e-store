declare module 'paymob-pixel' {
  interface PaymobConfig {
    apiKey: string
    clientSecret: string
  }

  interface PaymentRequest {
    token: string
    iframe_url: string
  }

  interface CheckoutData {
    amount_cents: number
    currency: string
    order_id: string
    items: Array<{
      name: string
      amount_cents: number
      description: string
      quantity: number
    }>
    shipping_data: {
      first_name: string
      last_name: string
      email: string
      phone_number: string
      street: string
      city: string
      state: string
      country: string
      postal_code: string
    }
    success_url: string
    cancel_url: string
  }

  class Paymob {
    constructor(config: PaymobConfig)
    createPaymentRequest(data: CheckoutData): Promise<PaymentRequest>
    checkoutButton(token: string): {
      mount: (selector: string) => void
    }
  }

  export default Paymob
}
