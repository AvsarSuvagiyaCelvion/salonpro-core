import { serverError } from '@/lib/http';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { normalizeMobile } from '@/lib/phone';
import { DEMO_CUSTOMERS } from '@/lib/demo-data';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      return NextResponse.json({
        customers: DEMO_CUSTOMERS,
        pagination: {
          page: 1,
          pageSize: 50,
          totalRecords: DEMO_CUSTOMERS.length,
          totalPages: 1,
        },
      });
    }

    const salonId = auth.session.salonId;
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT c.id, c.salon_id, c.name, c.mobile, c.email, c.address, c.avatar_url, c.note, c.birthday, c.created_at,
             COUNT(DISTINCT i.id)::int as visits,
             COALESCE(SUM(i.total), 0)::numeric(10,2) as total_spent,
             COUNT(*) OVER() as full_count
      FROM customers c
      LEFT JOIN invoices i ON c.id = i.customer_id
      WHERE c.salon_id = $1
    `;
    const params: any[] = [salonId];
    let idx = 2;

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (c.name ILIKE $${idx} OR c.mobile ILIKE $${idx} OR c.email ILIKE $${idx}) `;
      idx++;
    }

    sql += ` GROUP BY c.id ORDER BY c.created_at DESC `;
    sql += ` LIMIT $${idx++} OFFSET $${idx++} `;
    params.push(pageSize, offset);

    const res = await query(sql, params);

    const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    const customers = res.rows.map((row) => {
      const { full_count, ...cleanRow } = row;
      return cleanRow;
    });

    return NextResponse.json({
      customers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/customers/route.ts');
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const body = await request.json();
    const { name, mobile, email, note, birthday } = body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }
    const cleanMobile = normalizeMobile(mobile);
    if (!cleanMobile) {
      return NextResponse.json({ error: 'Valid 10-digit mobile number is required' }, { status: 400 });
    }

    try {
      const res = await query(
        `INSERT INTO customers (salon_id, name, mobile, email, note, birthday, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [
          salonId,
          name.trim(),
          cleanMobile,
          email?.trim() || null,
          note?.trim() || null,
          birthday || null,
        ]
      );

      return NextResponse.json({
        customer: { ...res.rows[0], visits: 0, total_spent: 0 },
        message: 'Customer added successfully',
      }, { status: 201 });
    } catch (insertError: any) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'A customer with this mobile number already exists in your salon' },
          { status: 409 }
        );
      }
      throw insertError;
    }
  } catch (error: any) {
    return serverError(error, 'src/app/api/customers/route.ts');
  }
}
