import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { serverError } from '@/lib/http';
import {
  CUSTOMER_COOKIE_NAME,
  verifyCustomerSessionToken,
} from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const session = await verifyCustomerSessionToken(token);
    if (!session || !session.customerId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid customer session.' }, { status: 401 });
    }

    const customerId = session.customerId;

    const res = await query(
      `SELECT r.id, r.salon_id, r.customer_id, r.appointment_id, r.staff_id, r.rating, r.comment,
              r.owner_reply, r.owner_replied_at, r.status, r.created_at,
              st.name as staff_name, srv.name as service_name,
              a.starts_at as appointment_date
       FROM reviews r
       JOIN appointments a ON r.appointment_id = a.id
       LEFT JOIN staff st ON r.staff_id = st.id
       LEFT JOIN services srv ON a.service_id = srv.id
       WHERE r.customer_id = $1::uuid
       ORDER BY r.created_at DESC`,
      [customerId]
    );

    return NextResponse.json({ reviews: res.rows });
  } catch (error: any) {
    return serverError(error, 'src/app/api/customer/reviews/route.ts (GET)');
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const session = await verifyCustomerSessionToken(token);
    if (!session || !session.customerId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid customer session.' }, { status: 401 });
    }

    const customerId = session.customerId;

    // Rate-limit review submissions: 10 per 15 minutes per customer
    const rateLimitKey = `cust_review_submit:${customerId}`;
    const rl = await checkRateLimit(rateLimitKey, 10, 900);
    if (rl.isLocked) {
      return NextResponse.json(
        { error: 'Too many review requests. Please wait a few minutes before submitting again.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { appointment_id, rating, comment } = body;

    if (!appointment_id) {
      return NextResponse.json({ error: 'Appointment ID is required.' }, { status: 400 });
    }

    // Validate rating: integer 1..5
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5 stars.' },
        { status: 400 }
      );
    }

    // Validate comment: optional text <= 500 chars
    let cleanComment: string | null = null;
    if (comment !== undefined && comment !== null && String(comment).trim() !== '') {
      cleanComment = String(comment).trim();
      if (cleanComment.length > 500) {
        return NextResponse.json(
          { error: 'Comment must not exceed 500 characters.' },
          { status: 400 }
        );
      }
    }

    // Fetch appointment and verify ownership, status, and completion cutoff
    const apptRes = await query(
      `SELECT a.id, a.salon_id, a.customer_id, a.staff_id, a.status, a.starts_at, a.ends_at,
              s.slug as salon_slug
       FROM appointments a
       JOIN salons s ON a.salon_id = s.id
       WHERE a.id = $1::uuid
       LIMIT 1`,
      [appointment_id]
    );

    if (apptRes.rows.length === 0) {
      return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
    }

    const appt = apptRes.rows[0];

    // Must belong to logged-in customer
    if (appt.customer_id !== customerId) {
      return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
    }

    // Must be completed
    if (appt.status !== 'completed') {
      return NextResponse.json(
        { error: 'Reviews can only be submitted for completed appointments.' },
        { status: 400 }
      );
    }

    // Within 30 days of completion (based on appointment timestamp in Asia/Kolkata)
    const apptTime = new Date(appt.ends_at || appt.starts_at).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - apptTime > thirtyDaysMs) {
      return NextResponse.json(
        { error: 'Reviews can only be submitted within 30 days of the appointment.' },
        { status: 400 }
      );
    }

    // Check if review already exists
    const existingCheck = await query(
      `SELECT id FROM reviews WHERE appointment_id = $1::uuid LIMIT 1`,
      [appointment_id]
    );
    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'You have already submitted a review for this appointment.' },
        { status: 400 }
      );
    }

    // Demo salon showcase: simulate success without DB writes
    if (appt.salon_slug === 'dixa-beauty-salon') {
      const mockId = crypto.randomUUID();
      return NextResponse.json({
        success: true,
        review: {
          id: mockId,
          salon_id: appt.salon_id,
          customer_id: customerId,
          appointment_id: appt.id,
          staff_id: appt.staff_id,
          rating: numRating,
          comment: cleanComment,
          owner_reply: null,
          owner_replied_at: null,
          status: 'visible',
          created_at: new Date().toISOString(),
          demo: true,
        },
        message: 'Thank you for your review! (Demo mode: simulated submission)',
      });
    }

    // Insert review
    const insertRes = await query(
      `INSERT INTO reviews (salon_id, customer_id, appointment_id, staff_id, rating, comment, status, created_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::smallint, $6::text, 'visible', NOW())
       RETURNING id, salon_id, customer_id, appointment_id, staff_id, rating, comment, owner_reply, owner_replied_at, status, created_at`,
      [
        appt.salon_id,
        customerId,
        appt.id,
        appt.staff_id || null,
        numRating,
        cleanComment,
      ]
    );

    return NextResponse.json({
      success: true,
      review: insertRes.rows[0],
      message: 'Thank you! Your review has been submitted.',
    });
  } catch (error: any) {
    if (error.code === '23505') {
      // Postgres unique_violation for appointment_id
      return NextResponse.json(
        { error: 'A review has already been submitted for this appointment.' },
        { status: 400 }
      );
    }
    return serverError(error, 'src/app/api/customer/reviews/route.ts (POST)');
  }
}

