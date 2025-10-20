export const getPaymob = async () => {
  if (typeof window === 'undefined') return null
  const mod: any = await import('paymob-pixel')
  const Paymob = mod.default ?? mod
  return new Paymob({
    apiKey: process.env.PAYMOB_API_KEY!,
    clientSecret: process.env.PAYMOB_CLIENT_SECRET!,
  })
}
