import QRCode from 'qrcode';

export interface UpiIntentParams {
  upiId: string;
  name?: string;
  amount: number | string;
  note?: string;
}

/**
 * Builds standard NPCI UPI payment query string
 */
function buildUpiQuery(params: UpiIntentParams): string {
  const { upiId, name, amount, note } = params;
  const cleanId = upiId.trim();
  const numAmount = Number(amount);
  const formattedAmount = isNaN(numAmount) || numAmount <= 0 ? '1.00' : numAmount.toFixed(2);

  const cleanName = (name || 'StudioDesk').trim().replace(/[^a-zA-Z0-9 ]/g, '');
  const cleanNote = (note || 'Bill Payment').trim().replace(/[^a-zA-Z0-9 -]/g, '');

  const queryParams = new URLSearchParams();
  queryParams.set('pa', cleanId);
  queryParams.set('pn', cleanName);
  queryParams.set('am', formattedAmount);
  queryParams.set('cu', 'INR');
  if (cleanNote) {
    queryParams.set('tn', cleanNote);
  }

  return queryParams.toString();
}

/**
 * Universal UPI link (opens OS app picker on Android/iOS)
 */
export function buildUpiPayUrl(params: UpiIntentParams): string {
  return `upi://pay?${buildUpiQuery(params)}`;
}

/**
 * Deep-link directly into Google Pay app with pre-filled amount and recipient
 */
export function buildGPayUrl(params: UpiIntentParams): string {
  return `gpay://upi/pay?${buildUpiQuery(params)}`;
}

/**
 * Deep-link directly into PhonePe app with pre-filled amount and recipient
 */
export function buildPhonePeUrl(params: UpiIntentParams): string {
  return `phonepe://upi/pay?${buildUpiQuery(params)}`;
}

/**
 * Deep-link directly into Paytm app with pre-filled amount and recipient
 */
export function buildPaytmUrl(params: UpiIntentParams): string {
  return `paytmmp://upi/pay?${buildUpiQuery(params)}`;
}

/**
 * Generates an SVG or high-res DataURL QR code for instant client scanning
 */
export async function generateUpiQrDataUrl(params: UpiIntentParams): Promise<string> {
  const upiUrl = buildUpiPayUrl(params);
  return QRCode.toDataURL(upiUrl, {
    width: 320,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}
