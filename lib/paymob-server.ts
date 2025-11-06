// Server-only Paymob integration using Paymob Accept REST API
// Docs: https://docs.paymob.com/

const PAYMOB_BASE = process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com';

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${PAYMOB_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    // Next.js runtime is fine with fetch to external APIs server-side
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paymob API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export interface CreatePaymentInput {
  amountCents: number;
  currency: string; // e.g. 'EGP'
  items: Array<{ name: string; amount_cents: number; description?: string; quantity: number }>; // Paymob expects amount per item in cents
  shipping: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    street: string;
    city: string;
    state?: string;
    country?: string; // ISO2
    postal_code?: string;
  };
  // Our internal order id to get it back on redirect (via Paymob merchant_order_id)
  merchantOrderId?: string;
}

export interface CreatePaymentResult {
  token: string;
  iframe_url?: string;
  paymob_order_id: number;
}

export async function createPaymentRequest(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const apiKey = process.env.PAYMOB_API_KEY;
  const integrationId = process.env.PAYMOB_INTEGRATION_ID; // Required to obtain payment key
  const iframeId = process.env.PAYMOB_IFRAME_ID; // Used to construct iframe URL

  if (!apiKey) throw new Error('Missing PAYMOB_API_KEY');
  if (!integrationId) throw new Error('Missing PAYMOB_INTEGRATION_ID');
  if (!iframeId) throw new Error('Missing PAYMOB_IFRAME_ID');

  // 1) Authenticate
  const auth = await postJson<{ token: string }>(`/api/auth/tokens`, {
    api_key: apiKey,
  });

  // 2) Create order
  const order = await postJson<{ id: number }>(`/api/ecommerce/orders`, {
    auth_token: auth.token,
    delivery_needed: false,
    amount_cents: input.amountCents,
    currency: input.currency,
    items: input.items.map((i) => ({
      name: i.name,
      amount_cents: i.amount_cents,
      description: i.description || '',
      quantity: i.quantity,
    })),
    ...(input.merchantOrderId ? { merchant_order_id: input.merchantOrderId } : {}),
  });

  // 3) Get payment key
  const billing = input.shipping;
  const paymentKey = await postJson<{ token: string }>(`/api/acceptance/payment_keys`, {
    auth_token: auth.token,
    amount_cents: input.amountCents,
    expiration: 3600,
    order_id: order.id,
    billing_data: {
      apartment: 'NA',
      email: billing.email,
      floor: 'NA',
      first_name: billing.first_name,
      street: billing.street,
      building: 'NA',
      phone_number: billing.phone_number || '',
      shipping_method: 'NA',
      postal_code: billing.postal_code || 'NA',
      city: billing.city || 'NA',
      country: (billing.country || 'EG').toUpperCase(),
      last_name: billing.last_name,
      state: billing.state || 'NA',
    },
    currency: input.currency,
    integration_id: Number(integrationId),
  });

  const iframe_url = `${PAYMOB_BASE}/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey.token}`;
  return { token: paymentKey.token, iframe_url, paymob_order_id: order.id };
}
