import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { serverError } from '@/lib/http';
import { checkRateLimit } from '@/lib/rate-limit';

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const { id } = await props.params;

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required.' }, { status: 400 });
    }

    // Rate-limit owner review replies/status changes: 30 per 15 minutes
    const rateLimitKey = `owner_review_patch:${salonId}`;
    const rl = await checkRateLimit(rateLimitKey, 30, 900);
    if (rl.isLocked) {
      return NextResponse.json(
        { error: 'Too many updates. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { owner_reply, status } = body;

    const hasReply = owner_reply !== undefined;
    let finalReply: string | null = null;
    if (hasReply) {
      if (owner_reply !== null && String(owner_reply).trim() !== '') {
        finalReply = String(owner_reply).trim();
        if (finalReply.length > 300) {
          return NextResponse.json(
            { error: 'Owner reply cannot exceed 300 characters.' },
            { status: 400 }
          );
        }
      } else {
        finalReply = null;
      }
    }

    const hasStatus = status !== undefined;
    let finalStatus: 'visible' | 'hidden' | null = null;
    if (hasStatus) {
      if (status !== 'visible' && status !== 'hidden') {
        return NextResponse.json(
          { error: "Status must be either 'visible' or 'hidden'." },
          { status: 400 }
        );
      }
      finalStatus = status;
    }

    // Check if review exists for this salon
    const checkRes = await query(
      `SELECT id, salon_id FROM reviews WHERE id = $1::uuid AND salon_id = $2::uuid LIMIT 1`,
      [id, salonId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    }

    // Update review
    const updateRes = await query(
      `UPDATE reviews
       SET owner_reply = CASE WHEN $1::boolean THEN $2::text ELSE owner_reply END,
           owner_replied_at = CASE WHEN $1::boolean AND $2::text IS NOT NULL THEN NOW()
                                   WHEN $1::boolean AND $2::text IS NULL THEN NULL
                                   ELSE owner_replied_at END,
           status = CASE WHEN $3::boolean THEN $4::text ELSE status END
       WHERE id = $5::uuid AND salon_id = $6::uuid
       RETURNING id, salon_id, customer_id, appointment_id, staff_id, rating, comment, owner_reply, owner_replied_at, status, created_at`,
      [
        hasReply,
        finalReply,
        hasStatus,
        finalStatus,
        id,
        salonId,
      ]
    );

    return NextResponse.json({
      success: true,
      review: updateRes.rows[0],
      message: 'Review updated successfully.',
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/reviews/[id]/route.ts (PATCH)');
  }
}

