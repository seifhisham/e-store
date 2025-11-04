type PaymobCtor = new (opts: { apiKey: string; clientSecret: string }) => unknown

export const getPaymob = async () => {
  if (typeof window === 'undefined') return null
  const mod = (await import('paymob-pixel')) as unknown as
    | { default: PaymobCtor }
    | PaymobCtor

  const Paymob: PaymobCtor = (mod as { default?: PaymobCtor }).default ?? (mod as PaymobCtor)
  return new Paymob({
    apiKey: process.env.PAYMOB_API_KEY as string,
    clientSecret: process.env.PAYMOB_CLIENT_SECRET as string,
  })
}
