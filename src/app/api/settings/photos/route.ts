import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireTenant, requireRole } from '@/lib/api-auth';
import { serverError } from '@/lib/http';
import {
  MAX_GALLERY_PHOTOS,
  validateStoragePath,
  isAllowedSalonImageUrl,
  deleteFromStorage,
} from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const salonId = auth.session.salonId;
    const res = await query(
      `SELECT id, url, storage_path, sort_order, created_at
       FROM salon_photos
       WHERE salon_id = $1::uuid
       ORDER BY sort_order ASC, created_at ASC`,
      [salonId]
    );

    return NextResponse.json({ photos: res.rows });
  } catch (error: any) {
    return serverError(error, 'src/app/api/settings/photos/route.ts');
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const isDemo = auth.session.salonSlug === 'dixa-beauty-salon';

    const body = await request.json().catch(() => ({}));
    const { url, storage_path } = body;

    if (!url || !storage_path) {
      return NextResponse.json(
        { error: 'Both url and storage_path are required.' },
        { status: 400 }
      );
    }

    // Security check: validate storage_path belongs strictly to this salon
    if (!validateStoragePath(storage_path, `salons/${salonId}`)) {
      return NextResponse.json(
        { error: 'Forbidden: Storage path must belong to your salon folder.' },
        { status: 403 }
      );
    }

    // Security check: reject data: URIs or arbitrary foreign domains
    if (!isAllowedSalonImageUrl(url, salonId)) {
      return NextResponse.json(
        { error: 'Invalid image URL. Must be stored in your salon media storage.' },
        { status: 400 }
      );
    }

    // Demo salon: simulated add
    if (isDemo) {
      return NextResponse.json({
        success: true,
        photo: {
          id: 'demo-photo-' + Date.now(),
          salon_id: salonId,
          url,
          storage_path,
          sort_order: 0,
          created_at: new Date().toISOString(),
        },
      });
    }

    // Check count against MAX_GALLERY_PHOTOS = 5
    const countRes = await query(
      'SELECT COUNT(*)::int as count FROM salon_photos WHERE salon_id = $1::uuid',
      [salonId]
    );
    const count = countRes.rows[0]?.count || 0;
    if (count >= MAX_GALLERY_PHOTOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_GALLERY_PHOTOS} gallery photos allowed per salon.` },
        { status: 400 }
      );
    }

    const nextOrder = count;
    const insertRes = await query(
      `INSERT INTO salon_photos (salon_id, url, storage_path, sort_order)
       VALUES ($1::uuid, $2::text, $3::text, $4::int)
       RETURNING id, url, storage_path, sort_order, created_at`,
      [salonId, url, storage_path, nextOrder]
    );

    return NextResponse.json({
      success: true,
      photo: insertRes.rows[0],
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/settings/photos/route.ts');
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireTenant(request);
    if (auth.error) return auth.error;

    const roleErr = requireRole(auth.session, ['owner']);
    if (roleErr) return roleErr;

    const salonId = auth.session.salonId;
    const isDemo = auth.session.salonSlug === 'dixa-beauty-salon';

    const body = await request.json().catch(() => ({}));
    const { id, storage_path } = body;

    if (!id && !storage_path) {
      return NextResponse.json(
        { error: 'Photo id or storage_path is required for deletion.' },
        { status: 400 }
      );
    }

    if (isDemo) {
      return NextResponse.json({ success: true, message: 'Photo removed (Demo mode)' });
    }

    // Find the photo to ensure it belongs to this salon
    let photoRes;
    if (id) {
      photoRes = await query(
        'SELECT id, storage_path FROM salon_photos WHERE id = $1::uuid AND salon_id = $2::uuid LIMIT 1',
        [id, salonId]
      );
    } else {
      photoRes = await query(
        'SELECT id, storage_path FROM salon_photos WHERE storage_path = $1::text AND salon_id = $2::uuid LIMIT 1',
        [storage_path, salonId]
      );
    }

    if (photoRes.rows.length === 0) {
      return NextResponse.json({ error: 'Photo not found.' }, { status: 404 });
    }

    const photo = photoRes.rows[0];
    const pathToDelete = photo ? photo.storage_path : storage_path;

    // Delete record from database
    await query('DELETE FROM salon_photos WHERE id = $1::uuid AND salon_id = $2::uuid', [photo.id, salonId]);

    // Delete file from Supabase Storage
    if (pathToDelete) {
      await deleteFromStorage(pathToDelete);
    }

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully.',
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/settings/photos/route.ts');
  }
}
