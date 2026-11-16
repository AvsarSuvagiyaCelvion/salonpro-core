import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { serverError } from '@/lib/http';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const res = await query(`SELECT key, value FROM platform_settings`);
    const settingsMap: Record<string, string> = {};
    for (const row of res.rows) {
      settingsMap[row.key] = row.value;
    }

    return NextResponse.json({
      settings: settingsMap,
    });
  } catch (err: any) {
    return serverError(err, 'src/app/api/admin/settings/route.ts');
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    // Super admin role required
    if (auth.admin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only Super Administrators can update platform payment settings.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedKeys = [
      'platform_upi_id',
      'platform_upi_number',
      'platform_account_name',
      'platform_bank_name',
      'platform_account_number',
      'platform_ifsc_code',
      'platform_support_whatsapp',
      'platform_upi_qr_url',
    ];

    for (const [key, value] of Object.entries(body)) {
      if (allowedKeys.includes(key)) {
        await query(
          `INSERT INTO platform_settings (key, value, updated_at)
           VALUES ($1, $2, now())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
          [key, String(value || '').trim()]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Platform payment settings updated successfully.',
    });
  } catch (err: any) {
    return serverError(err, 'src/app/api/admin/settings/route.ts');
  }
}

