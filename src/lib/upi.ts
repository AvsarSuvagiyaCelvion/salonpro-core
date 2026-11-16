import QRCode from 'qrcode';

/**
 * Builds a standard NPCI UPI payment URL with pre-filled amount and recipient
 */
export function buildUpiPayUrl(params: {
  upiId: string;
  name?: string;
  amount: number | string;
  note?: string;
}): string {
  const { upiId, name, amount, note } = params;
  const cleanId = upiId.trim();
  const numAmount = Number(amount);
  const formattedAmount = isNaN(numAmount) || numAmount <= 0 ? '1.00' : numAmount.toFixed(2);

  const cleanName = (name || 'SalonPro').trim().replace(/[^a-zA-Z0-9 ]/g, '');
  const cleanNote = (note || 'Bill Payment').trim().replace(/[^a-zA-Z0-9 -]/g, '');

  const queryParams = new URLSearchParams();
  queryParams.set('pa', cleanId);
  queryParams.set('pn', cleanName);
  queryParams.set('am', formattedAmount);
  queryParams.set('cu', 'INR');
  if (cleanNote) {
    queryParams.set('tn', cleanNote);
  }

  return `upi://pay?${queryParams.toString()}`;
}

/**
 * Generates an SVG or high-res DataURL QR code for instant client scanning
 */
export async function generateUpiQrDataUrl(params: {
  upiId: string;
  name?: string;
  amount: number | string;
  note?: string;
}): Promise<string> {
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

