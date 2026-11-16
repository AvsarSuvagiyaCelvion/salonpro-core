import { NextResponse } from 'next/server';
import { getStorageObjectFromDb, getStoragePublicUrl } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];
    if (pathSegments.length === 0) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    // Join and sanitize path to prevent directory traversal
    const cleanPath = pathSegments.join('/').replace(/\\/g, '/').replace(/\/\.+/g, '');
    if (cleanPath.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // 1. Check database storage_objects
    const dbObj = await getStorageObjectFromDb(cleanPath);
    if (dbObj && dbObj.data) {
      const buffer = Buffer.from(dbObj.data, 'base64');
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': dbObj.mimeType || 'image/webp',
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 2. If not found in DB, redirect to external Supabase Storage public URL
    const publicUrl = getStoragePublicUrl(cleanPath);
    return NextResponse.redirect(publicUrl, { status: 307 });
  } catch (error: any) {
    console.error('Error serving media file:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

