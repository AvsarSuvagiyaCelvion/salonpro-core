import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { serverError } from '@/lib/http';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request, { allowExpired: true });
    if (auth.error) return auth.error;

    const res = await query(
      `SELECT key, value FROM platform_settings
       WHERE key IN (
         'platform_upi_id',
         'platform_upi_number',
         'platform_account_name',
         'platform_bank_name',
         'platform_account_number',
         'platform_ifsc_code',
         'platform_support_whatsapp',
         'platform_upi_qr_url'
       )`
    );

    const paymentDetails: Record<string, string> = {
      platform_upi_id: '8320653782@okaxis',
      platform_upi_number: '8320653782',
      platform_account_name: 'Avsar Suvagiya',
      platform_bank_name: 'State Bank of India',
      platform_account_number: 'XXXXXX1234',
      platform_ifsc_code: 'SBIN0001234',
      platform_support_whatsapp: '918320653782',
      platform_upi_qr_url: '',
    };

    for (const row of res.rows) {
      if (row.value) paymentDetails[row.key] = row.value;
    }

    return NextResponse.json({
      paymentDetails,
    });
  } catch (err: any) {
    return serverError(err, 'src/app/api/subscription/bank-details/route.ts');
  }
}

