import { NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { activateSubscriptionFromPayment } from '@/lib/subscription';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured in environment variables');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const rawBody = await request.text();

    // Verify webhook signature with timing-safe comparison
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event?.event;

    // Handle payment.captured and order.paid
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event?.payload?.payment?.entity;
      const orderEntity = event?.payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id || '';

      if (orderId) {
        try {
          const result = await activateSubscriptionFromPayment({
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
          });
          console.log(`Razorpay webhook ${eventType} handled for order ${orderId}:`, result.message);
        } catch (activationErr) {
          console.error(`Error activating subscription from webhook for order ${orderId}:`, activationErr);
        }
      }
    }

    // Always return 200 for valid signed events
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err: any) {
    console.error('Razorpay webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}

