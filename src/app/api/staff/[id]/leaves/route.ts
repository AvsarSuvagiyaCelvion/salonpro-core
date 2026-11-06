import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant, requireRole } from '@/lib/api-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { findConflictingAppointmentsForLeave } from '@/lib/availability';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const salonId = auth.session.salonId;

    // Demo salon simulation
    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      return NextResponse.json({
        leaves: [
          {
            id: 'leave-demo-1',
            staff_id: id,
            from_date: '2026-11-20',
            to_date: '2026-11-22',
            reason: 'Annual Vacation',
            created_at: new Date().toISOString(),
          },
        ],
      });
    }

    // Verify staff belongs to caller's salon
    const staffRes = await query(
      `SELECT id, name FROM staff WHERE id = $1::uuid AND salon_id = $2::uuid LIMIT 1`,
      [id, salonId]
    );

    if (staffRes.rows.length === 0) {
      return NextResponse.json({ error: 'Staff member not found in this salon' }, { status: 404 });
    }

    const leavesRes = await query(
      `SELECT id, staff_id, to_char(from_date, 'YYYY-MM-DD') as from_date, 
              to_char(to_date, 'YYYY-MM-DD') as to_date, reason, created_at
       FROM staff_leaves 
       WHERE staff_id = $1::uuid AND salon_id = $2::uuid 
       ORDER BY from_date DESC`,
      [id, salonId]
    );

    return NextResponse.json({ leaves: leavesRes.rows });
  } catch (error: any) {
    return serverError(error, 'src/app/api/staff/[id]/leaves/route.ts');
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const { id } = await params;

    // Rate limiting: max 30 writes per 15 min
    const clientIp = getClientIp(request);
    const rateLimitKey = `staff_leaves_write:${salonId}:${clientIp}`;
    const rateCheck = await checkRateLimit(rateLimitKey, 30, 900);
    if (rateCheck.isLocked) {
      return NextResponse.json(
        { error: 'Too many leave modifications. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    // Demo salon simulation
    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      const body = await request.json().catch(() => ({}));
      return NextResponse.json({
        success: true,
        message: 'Leave added successfully (Demo)',
        leave: {
          id: `leave-demo-${Date.now()}`,
          staff_id: id,
          from_date: body.from_date,
          to_date: body.to_date,
          reason: body.reason || null,
          created_at: new Date().toISOString(),
        },
        conflicts: [],
      });
    }

    // Verify staff belongs to caller's salon
    const staffRes = await query(
      `SELECT id, name FROM staff WHERE id = $1::uuid AND salon_id = $2::uuid LIMIT 1`,
      [id, salonId]
    );

    if (staffRes.rows.length === 0) {
      return NextResponse.json({ error: 'Staff member not found in this salon' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { from_date, to_date, reason } = body;

    // Validate date format strictly (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!from_date || !dateRegex.test(String(from_date).trim())) {
      return NextResponse.json(
        { error: 'Invalid from_date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    if (!to_date || !dateRegex.test(String(to_date).trim())) {
      return NextResponse.json(
        { error: 'Invalid to_date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    const cleanFrom = String(from_date).trim();
    const cleanTo = String(to_date).trim();

    if (cleanTo < cleanFrom) {
      return NextResponse.json(
        { error: 'End date (to_date) cannot be earlier than start date (from_date).' },
        { status: 400 }
      );
    }

    const cleanReason = reason ? String(reason).trim() : null;
    if (cleanReason && cleanReason.length > 120) {
      return NextResponse.json(
        { error: 'Leave reason cannot exceed 120 characters.' },
        { status: 400 }
      );
    }

    // Insert leave
    const insertRes = await query(
      `INSERT INTO staff_leaves (staff_id, salon_id, from_date, to_date, reason)
       VALUES ($1::uuid, $2::uuid, $3::date, $4::date, $5::text)
       RETURNING id, staff_id, to_char(from_date, 'YYYY-MM-DD') as from_date, 
                 to_char(to_date, 'YYYY-MM-DD') as to_date, reason, created_at`,
      [id, salonId, cleanFrom, cleanTo, cleanReason]
    );

    // Detect existing scheduled appointments that now conflict (Do NOT auto-cancel, return as warning list)
    const conflicts = await findConflictingAppointmentsForLeave(id, salonId, cleanFrom, cleanTo);

    return NextResponse.json(
      {
        success: true,
        message: 'Leave added successfully.',
        leave: insertRes.rows[0],
        conflicts,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return serverError(error, 'src/app/api/staff/[id]/leaves/route.ts');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const leaveId = searchParams.get('leaveId');

    if (!leaveId) {
      return NextResponse.json({ error: 'leaveId parameter is required' }, { status: 400 });
    }

    // Demo salon simulation
    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      return NextResponse.json({ success: true, message: 'Leave removed (Demo)' });
    }

    const deleteRes = await query(
      `DELETE FROM staff_leaves 
       WHERE id = $1::uuid AND staff_id = $2::uuid AND salon_id = $3::uuid
       RETURNING id`,
      [leaveId, id, salonId]
    );

    if (deleteRes.rows.length === 0) {
      return NextResponse.json({ error: 'Leave record not found in this salon' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Leave removed successfully.',
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/staff/[id]/leaves/route.ts');
  }
}

