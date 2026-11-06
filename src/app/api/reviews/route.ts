import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant } from '@/lib/api-auth';
import { serverError } from '@/lib/http';
import { getSalonPlan } from '@/lib/plan';
import { DEMO_REVIEWS, DEMO_REVIEW_STATS } from '@/lib/demo-data';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    if (auth.session.salonSlug === 'dixa-beauty-salon') {
      return NextResponse.json({
        reviews: DEMO_REVIEWS,
        stats: DEMO_REVIEW_STATS,
        staffStats: [
          { staffId: 'stf-1', staffName: 'Priya Patel', reviewCount: 14, averageRating: 4.9 },
          { staffId: 'stf-2', staffName: 'Neha Shah', reviewCount: 9, averageRating: 5.0 },
          { staffId: 'stf-3', staffName: 'Ananya Sharma', reviewCount: 5, averageRating: 4.8 },
        ],
        planAllowed: true,
        pagination: {
          page: 1,
          pageSize: 15,
          totalRecords: DEMO_REVIEWS.length,
          totalPages: 1,
        },
      });
    }

    const salonId = auth.session.salonId;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '15', 10)));
    const offset = (page - 1) * pageSize;

    const statusFilter = searchParams.get('status'); // 'all', 'visible', 'hidden'
    const ratingFilter = searchParams.get('rating'); // '1'..'5'
    const staffFilter = searchParams.get('staff_id');

    // Check plan feature flag for reviews
    const planRes = await getSalonPlan(salonId);
    const planAllowed = planRes.plan?.flags.reviews ?? false;

    // 1. Base query params
    let filterSql = ` WHERE r.salon_id = $1::uuid `;
    const params: any[] = [salonId];
    let idx = 2;

    if (statusFilter && statusFilter !== 'all') {
      filterSql += ` AND r.status = $${idx}::text `;
      params.push(statusFilter);
      idx++;
    }

    if (ratingFilter) {
      const numR = parseInt(ratingFilter, 10);
      if (numR >= 1 && numR <= 5) {
        filterSql += ` AND r.rating = $${idx}::smallint `;
        params.push(numR);
        idx++;
      }
    }

    if (staffFilter) {
      filterSql += ` AND r.staff_id = $${idx}::uuid `;
      params.push(staffFilter);
      idx++;
    }

    // 2. Query paginated reviews list
    const listSql = `
      SELECT r.id, r.salon_id, r.customer_id, r.appointment_id, r.staff_id,
             r.rating, r.comment, r.owner_reply, r.owner_replied_at, r.status, r.created_at,
             c.name as customer_name, c.mobile as customer_mobile,
             st.name as staff_name, srv.name as service_name,
             a.starts_at as appointment_date,
             COUNT(*) OVER() as total_count
      FROM reviews r
      JOIN customers c ON r.customer_id = c.id
      JOIN appointments a ON r.appointment_id = a.id
      LEFT JOIN staff st ON r.staff_id = st.id
      LEFT JOIN services srv ON a.service_id = srv.id
      ${filterSql}
      ORDER BY r.created_at DESC
      LIMIT $${idx}::int OFFSET $${idx + 1}::int
    `;
    params.push(pageSize, offset);

    const listRes = await query(listSql, params);
    const totalRecords = listRes.rows.length > 0 ? parseInt(listRes.rows[0].total_count, 10) : 0;
    const totalPages = Math.ceil(totalRecords / pageSize);

    // 3. Overall Salon Stats (aggregate over all visible reviews)
    const statsRes = await query(
      `SELECT
         COUNT(*)::int as total_reviews,
         COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float as average_rating,
         COUNT(*) FILTER (WHERE rating = 5)::int as stars_5,
         COUNT(*) FILTER (WHERE rating = 4)::int as stars_4,
         COUNT(*) FILTER (WHERE rating = 3)::int as stars_3,
         COUNT(*) FILTER (WHERE rating = 2)::int as stars_2,
         COUNT(*) FILTER (WHERE rating = 1)::int as stars_1
       FROM reviews
       WHERE salon_id = $1::uuid AND status = 'visible'`,
      [salonId]
    );

    const statsRow = statsRes.rows[0] || {
      total_reviews: 0,
      average_rating: 0,
      stars_5: 0,
      stars_4: 0,
      stars_3: 0,
      stars_2: 0,
      stars_1: 0,
    };

    // 4. Staff-wise Rating Table
    const staffStatsRes = await query(
      `SELECT
         st.id as staff_id,
         st.name as staff_name,
         COUNT(r.id)::int as review_count,
         COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)::float as average_rating
       FROM staff st
       LEFT JOIN reviews r ON st.id = r.staff_id AND r.status = 'visible'
       WHERE st.salon_id = $1::uuid AND st.active = true
       GROUP BY st.id, st.name
       ORDER BY review_count DESC, average_rating DESC, st.name ASC`,
      [salonId]
    );

    return NextResponse.json({
      reviews: listRes.rows.map((row) => ({
        id: row.id,
        salon_id: row.salon_id,
        customer_id: row.customer_id,
        customer_name: row.customer_name,
        customer_mobile: row.customer_mobile,
        appointment_id: row.appointment_id,
        appointment_date: row.appointment_date,
        service_name: row.service_name,
        staff_id: row.staff_id,
        staff_name: row.staff_name,
        rating: row.rating,
        comment: row.comment,
        owner_reply: row.owner_reply,
        owner_replied_at: row.owner_replied_at,
        status: row.status,
        created_at: row.created_at,
      })),
      pagination: {
        page,
        pageSize,
        total: totalRecords,
        totalPages,
      },
      stats: {
        averageRating: Number(statsRow.average_rating) || 0,
        totalReviews: Number(statsRow.total_reviews) || 0,
        distribution: {
          5: Number(statsRow.stars_5) || 0,
          4: Number(statsRow.stars_4) || 0,
          3: Number(statsRow.stars_3) || 0,
          2: Number(statsRow.stars_2) || 0,
          1: Number(statsRow.stars_1) || 0,
        },
      },
      staffStats: staffStatsRes.rows.map((s) => ({
        staffId: s.staff_id,
        staffName: s.staff_name,
        reviewCount: Number(s.review_count) || 0,
        averageRating: Number(s.average_rating) || 0,
      })),
      planAllowed,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/reviews/route.ts (GET)');
  }
}

