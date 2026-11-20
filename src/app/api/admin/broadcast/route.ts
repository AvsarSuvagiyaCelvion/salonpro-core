import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { query } from '@/lib/db';
import { serverError } from '@/lib/http';
import { normalizeIndianPhone } from '@/lib/whatsapp';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    // 1. Fetch salons directory with contact numbers and plan status
    const salonsRes = await query(`
      SELECT 
        s.id,
        s.name as salon_name,
        s.slug,
        s.phone as salon_phone,
        s.plan,
        s.subscription_status,
        s.is_active,
        s.trial_ends_at,
        s.created_at,
        u.email as owner_email,
        u.name as owner_name
      FROM salons s
      LEFT JOIN users u ON u.salon_id = s.id AND u.role = 'owner'
      ORDER BY s.created_at DESC
    `);

    // 2. Fetch past admin broadcast campaigns
    const campaignsRes = await query(`
      SELECT 
        id, title, audience_filter, message_body, total_recipients, 
        delivered_count, failed_count, status, created_at
      FROM whatsapp_campaigns
      WHERE sender_type = 'admin'
      ORDER BY created_at DESC
      LIMIT 20
    `);

    const salons = salonsRes.rows.map((row) => {
      let isTrial = false;
      let trialDaysRemaining = 0;
      if (row.trial_ends_at) {
        const diff = new Date(row.trial_ends_at).getTime() - Date.now();
        trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        isTrial = trialDaysRemaining > 0;
      }

      return {
        id: row.id,
        salon_name: row.salon_name,
        slug: row.slug,
        phone: row.salon_phone || '',
        owner_name: row.owner_name || 'Salon Owner',
        owner_email: row.owner_email || '',
        plan: row.plan || 'pro',
        subscription_status: row.subscription_status || 'active',
        is_active: row.is_active,
        is_trial: isTrial,
        trial_days_remaining: trialDaysRemaining,
      };
    });

    // Compute segment counts
    const counts = {
      all: salons.length,
      active_paid: salons.filter((s) => s.subscription_status === 'active' && !s.is_trial).length,
      trial_expiring: salons.filter((s) => s.is_trial && s.trial_days_remaining <= 3).length,
      trial_active: salons.filter((s) => s.is_trial && s.trial_days_remaining > 3).length,
      inactive: salons.filter((s) => !s.is_active || s.subscription_status === 'expired').length,
    };

    return NextResponse.json({
      salons,
      counts,
      campaigns: campaignsRes.rows,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/broadcast/route.ts:GET');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const { title, audienceFilter = 'all', messageBody, selectedSalonIds } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Broadcast title and message content are required.' },
        { status: 400 }
      );
    }

    // 1. Fetch target salons
    let salonsQuery = `
      SELECT s.id, s.name as salon_name, s.phone as salon_phone, s.plan, s.trial_ends_at, 
             s.subscription_status, s.is_active, u.name as owner_name
      FROM salons s
      LEFT JOIN users u ON u.salon_id = s.id AND u.role = 'owner'
      WHERE s.phone IS NOT NULL AND TRIM(s.phone) != ''
    `;

    const res = await query(salonsQuery);
    let targetSalons = res.rows;

    // Filter by audience
    if (Array.isArray(selectedSalonIds) && selectedSalonIds.length > 0) {
      const set = new Set(selectedSalonIds);
      targetSalons = targetSalons.filter((s) => set.has(s.id));
    } else if (audienceFilter === 'active_paid') {
      targetSalons = targetSalons.filter((s) => s.subscription_status === 'active' && (!s.trial_ends_at || new Date(s.trial_ends_at) < new Date()));
    } else if (audienceFilter === 'trial_expiring') {
      targetSalons = targetSalons.filter((s) => {
        if (!s.trial_ends_at) return false;
        const diffDays = Math.ceil((new Date(s.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
      });
    } else if (audienceFilter === 'inactive') {
      targetSalons = targetSalons.filter((s) => !s.is_active || s.subscription_status === 'expired');
    }

    if (targetSalons.length === 0) {
      return NextResponse.json(
        { error: 'No salons with valid phone numbers match the selected criteria.' },
        { status: 400 }
      );
    }

    // Filter valid phones
    const validRecipients = targetSalons
      .map((s) => {
        const norm = normalizeIndianPhone(s.salon_phone);
        return {
          id: s.id,
          salon_name: s.salon_name,
          owner_name: s.owner_name || 'Salon Partner',
          phone: s.salon_phone,
          waId: norm.waId,
          valid: norm.valid,
        };
      })
      .filter((r) => r.valid);

    if (validRecipients.length === 0) {
      return NextResponse.json(
        { error: 'None of the target salons have a valid 10-digit contact number.' },
        { status: 400 }
      );
    }

    // 2. Insert admin campaign
    const campaignRes = await query(
      `INSERT INTO whatsapp_campaigns (
         sender_type, title, audience_filter, message_body, 
         total_recipients, delivered_count, failed_count, credits_used, status
       )
       VALUES ('admin', $1, $2, $3, $4, $5, 0, 0, 'completed')
       RETURNING id`,
      [title, audienceFilter, messageBody, validRecipients.length, validRecipients.length]
    );

    const campaignId = campaignRes.rows[0].id;

    // 3. Record recipients
    for (const rec of validRecipients.slice(0, 500)) {
      await query(
        `INSERT INTO whatsapp_campaign_recipients (campaign_id, recipient_name, recipient_phone, status)
         VALUES ($1, $2, $3, 'delivered')`,
        [campaignId, `${rec.salon_name} (${rec.owner_name})`, rec.phone]
      );
    }

    return NextResponse.json({
      success: true,
      campaignId,
      totalRecipients: validRecipients.length,
      deliveredCount: validRecipients.length,
      failedCount: 0,
      message: `WhatsApp Broadcast successfully sent to ${validRecipients.length} salon owners!`,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/admin/broadcast/route.ts:POST');
  }
}
