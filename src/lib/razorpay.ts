import crypto from 'crypto';

export function getRazorpayKeys() {
  const keyId =
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    'rzp_test_TvkGEaLaUlVYMt';
  const keySecret =
    process.env.RAZORPAY_KEY_SECRET ||
    'ZJ3XD3w1OMLW3SgPXmJekEUS';

  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys are not configured in environment variables.');
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
 * Verifies Razorpay payment signature using HMAC SHA256
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
  const { keySecret } = getRazorpayKeys();

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature, 'utf-8'),
    Buffer.from(signature, 'utf-8')
  );
}

