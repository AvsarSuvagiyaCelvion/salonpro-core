import { query } from './db';

export interface PhoneNormalizationResult {
  valid: boolean;
  e164: string; // e.g. "+919876500001"
  waId: string; // e.g. "919876500001"
  national: string; // e.g. "9876500001"
}

/**
 * Normalizes Indian and international phone numbers to standard E.164 and WhatsApp IDs.
 * Correctly strips spaces, dashes, parentheses, and leading zeros.
 */
export function normalizeIndianPhone(input: string): PhoneNormalizationResult {
  if (!input) {
    return { valid: false, e164: '', waId: '', national: '' };
  }

  // Strip all non-digit characters
  const digits = input.replace(/\D/g, '');

  // 10 digits standard Indian mobile (e.g. 9876500001)
  if (digits.length === 10) {
    return {
      valid: true,
      e164: `+91${digits}`,
      waId: `91${digits}`,
      national: digits,
    };
  }

  // 11 digits starting with 0 (e.g. 09876500001)
  if (digits.length === 11 && digits.startsWith('0')) {
    const national = digits.slice(1);
    return {
      valid: true,
      e164: `+91${national}`,
      waId: `91${national}`,
      national,
    };
  }

  // 12 digits starting with 91 (e.g. 919876500001)
  if (digits.length === 12 && digits.startsWith('91')) {
    const national = digits.slice(2);
    return {
      valid: true,
      e164: `+${digits}`,
      waId: digits,
      national,
    };
  }

  // Generic international fallback (length between 10 and 15)
  if (digits.length >= 10 && digits.length <= 15) {
    return {
      valid: true,
      e164: `+${digits}`,
      waId: digits,
      national: digits,
    };
  }

  return { valid: false, e164: '', waId: '', national: digits };
}

export interface SendInvoiceReceiptParams {
  salonId: string;
  salonName: string;
  salonPhone?: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerMobile: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  balanceDue?: number;
}

export interface WhatsAppSendResult {
  success: boolean;
  status: 'sent' | 'failed' | 'pending_credentials';
  providerMessageId?: string;
  logId?: string;
  error?: string;
  missingCredentials?: boolean;
  requiredEnv?: string[];
  receiptUrl: string;
}

/**
 * Automatically delivers invoice & printable receipt link to customer's WhatsApp (+91).
 * Supports WhatsApp Cloud API (Meta) & Twilio WhatsApp API.
 * Automatically logs status, errors, and delivery tracking in whatsapp_delivery_logs table.
 */
export async function sendWhatsAppInvoiceReceipt(
  params: SendInvoiceReceiptParams
): Promise<WhatsAppSendResult> {
  const {
    salonId,
    salonName,
    invoiceId,
    invoiceNumber,
    customerId,
    customerName,
    customerMobile,
    total,
    balanceDue = 0,
  } = params;

  const phone = normalizeIndianPhone(customerMobile);
  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://salonpro-plum.vercel.app');
  
  const receiptUrl = `${appBaseUrl}/b/${encodeURIComponent(invoiceNumber)}`;

  if (!phone.valid) {
    const errorMsg = `Invalid phone number format: "${customerMobile}". Minimum 10 digits required.`;
    await logDelivery({
      salonId,
      invoiceId,
      customerId,
      recipientPhone: customerMobile || 'unknown',
      provider: 'none',
      status: 'failed',
      errorMessage: errorMsg,
      payload: { params },
    });
    return {
      success: false,
      status: 'failed',
      error: errorMsg,
      receiptUrl,
    };
  }

  // Construct message content
  const paymentStatusText = balanceDue <= 0 ? 'PAID IN FULL ✓' : `Balance Due: ₹${balanceDue.toFixed(2)}`;
  const messageBody =
    `✨ *${salonName}* - Official Invoice Receipt\n\n` +
    `Dear *${customerName}*,\n` +
    `Thank you for visiting us! Your bill *#${invoiceNumber}* for *₹${total.toFixed(2)}* has been processed (${paymentStatusText}).\n\n` +
    `📄 *View & Download Digital Bill / PDF:*\n${receiptUrl}\n\n` +
    `Need assistance? Reply directly or visit us again soon! 💇‍♀️💅`;

  // 1. Check for Meta WhatsApp Cloud API credentials
  const cloudApiToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const cloudPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // 2. Check for Twilio WhatsApp credentials
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

  // If no WhatsApp provider credentials are configured, log pending status cleanly
  if (!cloudApiToken && !twilioSid) {
    const requiredEnv = [
      'WHATSAPP_CLOUD_API_TOKEN (Meta Graph API System User Token)',
      'WHATSAPP_PHONE_NUMBER_ID (Meta Verified WhatsApp Phone Number ID)',
      '-- OR --',
      'TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN & TWILIO_WHATSAPP_NUMBER',
    ];

    const logRes = await logDelivery({
      salonId,
      invoiceId,
      customerId,
      recipientPhone: phone.e164,
      provider: 'whatsapp_cloud_api',
      status: 'pending_credentials',
      errorMessage: 'WhatsApp provider credentials not configured in environment. Automated delivery logged.',
      payload: {
        receiptUrl,
        messageBody,
        requiredEnv,
      },
    });

    return {
      success: false,
      status: 'pending_credentials',
      missingCredentials: true,
      requiredEnv,
      logId: logRes?.id,
      error: 'WhatsApp provider credentials missing. Please set WHATSAPP_CLOUD_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment variables.',
      receiptUrl,
    };
  }

  // Execute Meta WhatsApp Cloud API if configured
  if (cloudApiToken && cloudPhoneNumberId) {
    return await sendViaMetaCloudApi({
      salonId,
      invoiceId,
      customerId,
      phone,
      messageBody,
      receiptUrl,
      cloudApiToken,
      cloudPhoneNumberId,
    });
  }

  // Execute Twilio if configured
  if (twilioSid && twilioAuthToken) {
    return await sendViaTwilio({
      salonId,
      invoiceId,
      customerId,
      phone,
      messageBody,
      receiptUrl,
      twilioSid,
      twilioAuthToken,
      twilioFromNumber,
    });
  }

  return {
    success: false,
    status: 'failed',
    error: 'No active WhatsApp provider available',
    receiptUrl,
  };
}

async function sendViaMetaCloudApi(args: {
  salonId: string;
  invoiceId: string;
  customerId?: string;
  phone: PhoneNormalizationResult;
  messageBody: string;
  receiptUrl: string;
  cloudApiToken: string;
  cloudPhoneNumberId: string;
}): Promise<WhatsAppSendResult> {
  const { salonId, invoiceId, customerId, phone, messageBody, receiptUrl, cloudApiToken, cloudPhoneNumberId } = args;

  const url = `https://graph.facebook.com/v21.0/${cloudPhoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone.waId,
    type: 'text',
    text: {
      preview_url: true,
      body: messageBody,
    },
  };

  let retryCount = 0;
  let lastError = '';

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cloudApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data?.messages?.[0]?.id) {
        const msgId = data.messages[0].id;
        const logRes = await logDelivery({
          salonId,
          invoiceId,
          customerId,
          recipientPhone: phone.e164,
          provider: 'whatsapp_cloud_api',
          status: 'sent',
          providerMessageId: msgId,
          retryCount,
          payload: { body, response: data },
        });

        // Mark invoice as sent
        await query('UPDATE invoices SET whatsapp_sent = true WHERE id = $1', [invoiceId]);

        return {
          success: true,
          status: 'sent',
          providerMessageId: msgId,
          logId: logRes?.id,
          receiptUrl,
        };
      } else {
        lastError = data?.error?.message || `HTTP ${res.status}`;
      }
    } catch (err: any) {
      lastError = err?.message || 'Network error';
    }

    retryCount++;
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, attempt * 500));
    }
  }

  const logRes = await logDelivery({
    salonId,
    invoiceId,
    customerId,
    recipientPhone: phone.e164,
    provider: 'whatsapp_cloud_api',
    status: 'failed',
    errorMessage: `Failed after ${retryCount} attempts: ${lastError}`,
    retryCount,
    payload: { body },
  });

  return {
    success: false,
    status: 'failed',
    error: lastError,
    logId: logRes?.id,
    receiptUrl,
  };
}

async function sendViaTwilio(args: {
  salonId: string;
  invoiceId: string;
  customerId?: string;
  phone: PhoneNormalizationResult;
  messageBody: string;
  receiptUrl: string;
  twilioSid: string;
  twilioAuthToken: string;
  twilioFromNumber: string;
}): Promise<WhatsAppSendResult> {
  const { salonId, invoiceId, customerId, phone, messageBody, receiptUrl, twilioSid, twilioAuthToken, twilioFromNumber } = args;

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
  const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');

  const formData = new URLSearchParams();
  formData.append('From', twilioFromNumber.startsWith('whatsapp:') ? twilioFromNumber : `whatsapp:${twilioFromNumber}`);
  formData.append('To', `whatsapp:${phone.e164}`);
  formData.append('Body', messageBody);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await res.json();

    if (res.ok && data?.sid) {
      const logRes = await logDelivery({
        salonId,
        invoiceId,
        customerId,
        recipientPhone: phone.e164,
        provider: 'twilio',
        status: 'sent',
        providerMessageId: data.sid,
        payload: { response: data },
      });

      await query('UPDATE invoices SET whatsapp_sent = true WHERE id = $1', [invoiceId]);

      return {
        success: true,
        status: 'sent',
        providerMessageId: data.sid,
        logId: logRes?.id,
        receiptUrl,
      };
    } else {
      const errMsg = data?.message || `HTTP ${res.status}`;
      await logDelivery({
        salonId,
        invoiceId,
        customerId,
        recipientPhone: phone.e164,
        provider: 'twilio',
        status: 'failed',
        errorMessage: errMsg,
        payload: { response: data },
      });
      return {
        success: false,
        status: 'failed',
        error: errMsg,
        receiptUrl,
      };
    }
  } catch (err: any) {
    const errMsg = err?.message || 'Twilio request failed';
    await logDelivery({
      salonId,
      invoiceId,
      customerId,
      recipientPhone: phone.e164,
      provider: 'twilio',
      status: 'failed',
      errorMessage: errMsg,
    });
    return {
      success: false,
      status: 'failed',
      error: errMsg,
      receiptUrl,
    };
  }
}

async function logDelivery(entry: {
  salonId: string;
  invoiceId?: string;
  customerId?: string;
  recipientPhone: string;
  messageType?: string;
  provider: string;
  status: string;
  providerMessageId?: string;
  payload?: any;
  errorMessage?: string;
  retryCount?: number;
}) {
  try {
    const res = await query(
      `INSERT INTO whatsapp_delivery_logs (
        salon_id, invoice_id, customer_id, recipient_phone, message_type,
        provider, status, provider_message_id, payload, error_message, retry_count, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id`,
      [
        entry.salonId,
        entry.invoiceId || null,
        entry.customerId || null,
        entry.recipientPhone,
        entry.messageType || 'invoice_receipt',
        entry.provider,
        entry.status,
        entry.providerMessageId || null,
        entry.payload ? JSON.stringify(entry.payload) : null,
        entry.errorMessage || null,
        entry.retryCount || 0,
      ]
    );
    return res.rows[0];
  } catch (err) {
    console.error('Failed to log WhatsApp delivery:', err);
    return null;
  }
}

