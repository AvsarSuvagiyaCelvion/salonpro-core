import crypto from 'crypto';

export function getRazorpayKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
  }

  return { keyId, keySecret };
}

export interface CreateOrderParams {
  amount: number; // in Rupees
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface RazorpayPaymentDetails {
  id: string;
  entity: string;
  amount: number; // in paise
  currency: string;
  status: string; // 'captured' | 'authorized' | 'failed' | etc.
  order_id: string;
  method?: string;
  email?: string;
  contact?: string;
  created_at: number;
}

/**
 * Creates an order on Razorpay using REST API with Basic Auth
 */
export async function createRazorpayOrder(params: CreateOrderParams): Promise<RazorpayOrderResponse> {
  const { keyId, keySecret } = getRazorpayKeys();
  const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const amountInPaise = Math.round(params.amount * 100);

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: params.currency || 'INR',
      receipt: params.receipt || `sub_${Date.now()}`,
      notes: params.notes || {},
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.description || 'Failed to create Razorpay order');
  }

  const orderData = await res.json();
  return orderData as RazorpayOrderResponse;
}

/**
 * Fetches payment details from Razorpay REST API
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentDetails> {
  const { keyId, keySecret } = getRazorpayKeys();
  const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.description || `Failed to fetch payment details for ${paymentId}`);
  }

  return res.json() as Promise<RazorpayPaymentDetails>;
}

/**
 * Verifies Razorpay payment signature using HMAC SHA256 with timing-safe comparison
 */
export function verifyRazorpayPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!orderId || !paymentId || !signature) {
    return false;
  }
  const { keySecret } = getRazorpayKeys();

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const bufGen = Buffer.from(generatedSignature, 'utf-8');
  const bufSig = Buffer.from(signature, 'utf-8');

  if (bufGen.length !== bufSig.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufGen, bufSig);
}

/**
 * Verifies Razorpay Webhook signature using HMAC SHA256 with timing-safe comparison
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  if (!rawBody || !signature || !webhookSecret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  const bufExpected = Buffer.from(expectedSignature, 'utf-8');
  const bufActual = Buffer.from(signature, 'utf-8');

  if (bufExpected.length !== bufActual.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufExpected, bufActual);
}
