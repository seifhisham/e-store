import Paymob from 'paymob-pixel'

export const paymob = new Paymob({
  apiKey: process.env.PAYMOB_API_KEY!,
  clientSecret: process.env.PAYMOB_CLIENT_SECRET!,
})

export const getPaymob = () => {
  if (typeof window !== 'undefined') {
    return paymob
  }
  return null
}
