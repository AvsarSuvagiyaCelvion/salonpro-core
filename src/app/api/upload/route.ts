import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { query } from '@/lib/db';
import {
  COOKIE_NAME,
  CUSTOMER_COOKIE_NAME,
  verifySessionToken,
  verifyCustomerSessionToken,
} from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { serverError } from '@/lib/http';
import {
  MAX_GALLERY_PHOTOS,
  MAX_SERVER_FILE_SIZE,
  validateImageSignature,
  validateStoragePath,
  uploadToStorage,
  deleteFromStorage,
  getStoragePublicUrl,
} from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const ownerToken = cookieStore.get(COOKIE_NAME)?.value;
    const customerToken = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;

    let callerType: 'owner' | 'customer' | null = null;
    let salonId: string | null = null;
    let customerId: string | null = null;
    let salonSlug: string | null = null;

    if (ownerToken) {
      const payload = await verifySessionToken(ownerToken);
      if (payload && payload.salonId) {
        callerType = 'owner';
        salonId = payload.salonId;
        salonSlug = payload.salonSlug || null;
      }
    }

    if (!callerType && customerToken) {
      const custPayload = await verifyCustomerSessionToken(customerToken);
      if (custPayload && custPayload.customerId) {
        callerType = 'customer';
        customerId = custPayload.customerId;
        salonId = custPayload.salonId || null;
      }
    }

    if (!callerType) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    // Rate limiting: 25 uploads per minute per caller
    const rateLimitKey = `upload_rate:${callerType}:${salonId || customerId}`;
    const rlCheck = await checkRateLimit(rateLimitKey, 25, 60);
    if (rlCheck.isLocked) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploadType = (formData.get('type') as string) || (callerType === 'owner' ? 'logo' : 'avatar');
    const oldPath = formData.get('old_path') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Server file size limit: strictly <= 400 KB
    if (file.size > MAX_SERVER_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the 400KB limit (${Math.round(file.size / 1024)}KB). Please compress image.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate real file signature (magic bytes)
    const sigCheck = validateImageSignature(buffer);
    if (!sigCheck.isValid || !sigCheck.mimeType || !sigCheck.extension) {
      return NextResponse.json(
        { error: sigCheck.error || 'Invalid image file signature.' },
        { status: 400 }
      );
    }

    // Demo salon showcase: simulate success without Storage/DB writes
    if (salonSlug === 'dixa-beauty-salon') {
      const mockId = crypto.randomUUID();
      const mockPath = `salons/${salonId}/demo-${mockId}.${sigCheck.extension}`;
      return NextResponse.json({
        success: true,
        url: getStoragePublicUrl(mockPath),
        storage_path: mockPath,
        demo: true,
      });
    }

    // Enforce folder structure and limits
    let destinationPath = '';
    const fileUUID = crypto.randomUUID();

    if (callerType === 'owner') {
      if (uploadType === 'gallery') {
        // Enforce MAX_GALLERY_PHOTOS = 5
        const countRes = await query(
          'SELECT COUNT(*)::int as count FROM salon_photos WHERE salon_id = $1::uuid',
          [salonId]
        );
        const currentCount = countRes.rows[0]?.count || 0;
        if (currentCount >= MAX_GALLERY_PHOTOS) {
          return NextResponse.json(
            { error: `Maximum ${MAX_GALLERY_PHOTOS} gallery photos allowed per salon.` },
            { status: 400 }
          );
        }
        destinationPath = `salons/${salonId}/gallery/${fileUUID}.${sigCheck.extension}`;
      } else {
        // Logo upload
        destinationPath = `salons/${salonId}/logo-${fileUUID}.${sigCheck.extension}`;
      }
    } else {
      // Customer avatar
      destinationPath = `customers/${customerId}/avatar/${fileUUID}.${sigCheck.extension}`;
    }

    // If replacing an existing image, delete the old storage object
    if (oldPath) {
      const allowedPrefix = callerType === 'owner' ? `salons/${salonId}` : `customers/${customerId}`;
      if (validateStoragePath(oldPath, allowedPrefix)) {
        await deleteFromStorage(oldPath);
      }
    }

    // Upload to Supabase Storage
    const uploadResult = await uploadToStorage(destinationPath, buffer, sigCheck.mimeType);
    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error || 'Storage upload failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.publicUrl,
      storage_path: uploadResult.storagePath,
    });
  } catch (error: any) {
    return serverError(error, 'src/app/api/upload/route.ts');
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const ownerToken = cookieStore.get(COOKIE_NAME)?.value;
    const customerToken = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;

    let callerType: 'owner' | 'customer' | null = null;
    let salonId: string | null = null;
    let customerId: string | null = null;
    let salonSlug: string | null = null;

    if (ownerToken) {
      const payload = await verifySessionToken(ownerToken);
      if (payload && payload.salonId) {
        callerType = 'owner';
        salonId = payload.salonId;
        salonSlug = payload.salonSlug || null;
      }
    }

    if (!callerType && customerToken) {
      const custPayload = await verifyCustomerSessionToken(customerToken);
      if (custPayload && custPayload.customerId) {
        callerType = 'customer';
        customerId = custPayload.customerId;
        salonId = custPayload.salonId || null;
      }
    }

    if (!callerType) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { storage_path } = body;

    if (!storage_path || typeof storage_path !== 'string') {
      return NextResponse.json({ error: 'storage_path is required.' }, { status: 400 });
    }

    const allowedPrefix = callerType === 'owner' ? `salons/${salonId}` : `customers/${customerId}`;
    if (!validateStoragePath(storage_path, allowedPrefix)) {
      return NextResponse.json(
        { error: 'Forbidden: You cannot delete files outside your own directory.' },
        { status: 403 }
      );
    }

    // Demo salon: simulated delete
    if (salonSlug === 'dixa-beauty-salon') {
      return NextResponse.json({ success: true, message: 'Simulated delete' });
    }

    // Delete from Supabase Storage
    await deleteFromStorage(storage_path);

    // If it was in salon_photos, remove the database record
    if (callerType === 'owner' && salonId) {
      await query(
        'DELETE FROM salon_photos WHERE salon_id = $1::uuid AND storage_path = $2::text',
        [salonId, storage_path]
      );
    }

    return NextResponse.json({ success: true, message: 'File deleted successfully.' });
  } catch (error: any) {
    return serverError(error, 'src/app/api/upload/route.ts');
  }
}

