/**
 * Storage utilities for Supabase Storage (salon-media bucket) & Resilient DB Fallback.
 * Uploads, deletions, magic byte verification, and tenant folder validation.
 */

import { query } from '@/lib/db';

export * from '@/lib/storage-constants';
import {
  MAX_GALLERY_PHOTOS,
  BUCKET_NAME,
  MAX_SERVER_FILE_SIZE,
  MAX_CLIENT_FILE_SIZE,
} from '@/lib/storage-constants';

export function getSupabaseUrl(): string {
  if (process.env.SUPABASE_URL) {
    return process.env.SUPABASE_URL.replace(/\/+$/, '');
  }
  const dbUrl = process.env.DATABASE_URL || '';
  const match = dbUrl.match(/postgres\.([a-z0-9]+):/i);
  if (match && match[1]) {
    return `https://${match[1]}.supabase.co`;
  }
  return 'https://plysphydeylkjvdqemxd.supabase.co';
}

export function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function getStoragePublicUrl(storagePath: string): string {
  const cleanPath = storagePath.replace(/^\/+/, '');
  return `${getSupabaseUrl()}/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
}

export interface ImageSignatureResult {
  isValid: boolean;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  extension?: 'jpg' | 'png' | 'webp';
  error?: string;
}

/**
 * Validates the genuine binary signature (magic bytes) of an image buffer.
 * Strictly accepts ONLY jpeg, png, and webp.
 * Explicitly rejects SVG, HTML, scripts, Windows/Linux executables, and fake extensions.
 */
export function validateImageSignature(buffer: Buffer | Uint8Array): ImageSignatureResult {
  if (!buffer || buffer.length < 12) {
    return { isValid: false, error: 'File is empty or too small to be a valid image.' };
  }

  // Check for SVG / XML / HTML text injection
  const headAscii = Buffer.from(buffer.slice(0, Math.min(buffer.length, 256))).toString('ascii').toLowerCase();
  if (
    headAscii.includes('<svg') ||
    headAscii.includes('<?xml') ||
    headAscii.includes('<!doctype svg') ||
    headAscii.includes('<html') ||
    headAscii.includes('<script')
  ) {
    return { isValid: false, error: 'SVG and vector formats are not allowed for security reasons.' };
  }

  // Check for Executables (MZ for Windows PE / EXE / DLL, 0x7F 'ELF' for Linux)
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return { isValid: false, error: 'Executable files (.exe/.dll) are strictly forbidden.' };
  }
  if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
    return { isValid: false, error: 'Binary executables are strictly forbidden.' };
  }

  // 1. JPEG: starts with FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, mimeType: 'image/jpeg', extension: 'jpg' };
  }

  // 2. PNG: starts with 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, mimeType: 'image/png', extension: 'png' };
  }

  // 3. WebP: RIFF (bytes 0..3) ... WEBP (bytes 8..11)
  if (
    buffer[0] === 0x52 && // 'R'
    buffer[1] === 0x49 && // 'I'
    buffer[2] === 0x46 && // 'F'
    buffer[3] === 0x46 && // 'F'
    buffer[8] === 0x57 && // 'W'
    buffer[9] === 0x45 && // 'E'
    buffer[10] === 0x42 && // 'B'
    buffer[11] === 0x50 // 'P'
  ) {
    return { isValid: true, mimeType: 'image/webp', extension: 'webp' };
  }

  return { isValid: false, error: 'Unsupported file format. Only JPG, PNG, and WebP are accepted.' };
}

/**
 * Validates that a storage path or URL strictly belongs to the caller's own folder.
 * Never accepts arbitrary paths, data: URIs, or parent path traversal.
 */
export function validateStoragePath(path: string, allowedPrefix: string): boolean {
  if (!path || typeof path !== 'string') return false;
  const cleanPath = path.trim().replace(/^\/+/, '');
  const cleanPrefix = allowedPrefix.trim().replace(/^\/+/, '').replace(/\/+$/, '') + '/';

  if (cleanPath.includes('..') || cleanPath.includes('\\')) {
    return false;
  }

  return cleanPath.startsWith(cleanPrefix);
}

/**
 * Checks whether an image URL is an allowed stored URL for a salon.
 * Accepts existing external URLs (for backward compatibility), but rejects data: URIs
 * and enforces that new storage URLs belong strictly to this salon's folder.
 */
export function isAllowedSalonImageUrl(url: string, salonId: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  // Explicitly reject data: URIs
  if (trimmed.startsWith('data:')) return false;

  // Relative or absolute /api/media/ path
  const mediaPrefix = `/api/media/salons/${salonId}/`;
  if (trimmed.startsWith(mediaPrefix) || trimmed.includes(mediaPrefix)) {
    return true;
  }

  const supabaseUrl = getSupabaseUrl();
  const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/salons/${salonId}/`;

  if (trimmed.startsWith(supabaseUrl)) {
    return trimmed.startsWith(publicPrefix);
  }

  // Also match any Supabase host for this salon
  if (trimmed.includes(`.supabase.co/storage/v1/object/public/${BUCKET_NAME}/salons/${salonId}/`)) {
    return true;
  }

  // Allow existing external http/https URLs (e.g. Unsplash, legacy URLs)
  return /^https?:\/\//i.test(trimmed);
}

let hasEnsuredStorageTable = false;

export async function ensureStorageTableExists(): Promise<void> {
  if (hasEnsuredStorageTable) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS storage_objects (
        storage_path TEXT PRIMARY KEY,
        mime_type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_storage_objects_path ON storage_objects(storage_path);
    `);
    hasEnsuredStorageTable = true;
  } catch (err: any) {
    console.warn('ensureStorageTableExists notice:', err?.message);
  }
}

export async function saveStorageObjectToDb(
  storagePath: string,
  mimeType: string,
  base64Data: string
): Promise<void> {
  await ensureStorageTableExists();
  const cleanPath = storagePath.replace(/^\/+/, '');
  await query(
    `INSERT INTO storage_objects (storage_path, mime_type, data, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (storage_path)
     DO UPDATE SET mime_type = EXCLUDED.mime_type, data = EXCLUDED.data, updated_at = now()`,
    [cleanPath, mimeType, base64Data]
  );
}

export async function getStorageObjectFromDb(
  storagePath: string
): Promise<{ mimeType: string; data: string } | null> {
  try {
    await ensureStorageTableExists();
    const cleanPath = storagePath.replace(/^\/+/, '');
    const res = await query(
      `SELECT mime_type, data FROM storage_objects WHERE storage_path = $1 LIMIT 1`,
      [cleanPath]
    );
    if (res.rows.length === 0) return null;
    return {
      mimeType: res.rows[0].mime_type,
      data: res.rows[0].data,
    };
  } catch (err: any) {
    console.warn('getStorageObjectFromDb notice:', err?.message);
    return null;
  }
}

export async function deleteStorageObjectFromDb(storagePath: string): Promise<void> {
  try {
    const cleanPath = storagePath.replace(/^\/+/, '');
    await query(`DELETE FROM storage_objects WHERE storage_path = $1`, [cleanPath]);
  } catch (err: any) {
    console.warn('deleteStorageObjectFromDb notice:', err?.message);
  }
}

/**
 * Uploads a binary buffer to storage.
 * Resiliently attempts Supabase Storage, and reliably persists to database storage_objects.
 */
export async function uploadToStorage(
  storagePath: string,
  buffer: Buffer | Uint8Array,
  contentType: string
): Promise<{ success: boolean; publicUrl?: string; storagePath?: string; error?: string }> {
  const supabaseUrl = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();
  const cleanPath = storagePath.replace(/^\/+/, '');

  let supabaseSucceeded = false;

  // 1. If Supabase Service Role Key is configured, attempt upload to Supabase Storage
  if (serviceKey) {
    try {
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${cleanPath}`;
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: buffer as any,
      });

      if (res.ok) {
        supabaseSucceeded = true;
      } else {
        const errText = await res.text().catch(() => '');
        console.warn('Supabase Storage upload responded with:', res.status, errText);
      }
    } catch (err: any) {
      console.warn('Supabase Storage network error (falling back to database store):', err?.message);
    }
  }

  // 2. Persist in database storage_objects as resilient primary/fallback store
  try {
    const base64Data = Buffer.from(buffer).toString('base64');
    await saveStorageObjectToDb(cleanPath, contentType, base64Data);
  } catch (dbErr: any) {
    console.error('Failed to save storage object to database:', dbErr);
    if (!supabaseSucceeded) {
      return {
        success: false,
        error: 'Storage upload failed. Please try again.',
      };
    }
  }

  // 3. Return public URL
  // Returning `/api/media/${cleanPath}` guarantees immediate accessibility across all domains
  const publicUrl = `/api/media/${cleanPath}`;

  return {
    success: true,
    publicUrl,
    storagePath: cleanPath,
  };
}

/**
 * Deletes an object from storage (both Supabase Storage and PostgreSQL database).
 */
export async function deleteFromStorage(storagePath: string): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();
  const cleanPath = storagePath.replace(/^\/+/, '');

  // Delete from PostgreSQL DB fallback
  await deleteStorageObjectFromDb(cleanPath);

  if (!serviceKey) {
    return { success: true };
  }

  try {
    const deleteUrl = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${cleanPath}`;
    const res = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
    });

    if (!res.ok && res.status !== 404) {
      const errText = await res.text().catch(() => '');
      console.warn('Supabase Storage delete returned non-200:', res.status, errText);
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Supabase Storage delete exception:', err?.message);
    return { success: true };
  }
}
