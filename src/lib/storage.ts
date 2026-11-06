/**
 * Storage utilities for Supabase Storage (salon-media bucket).
 * Uploads, deletions, magic byte verification, and tenant folder validation.
 */

export const MAX_GALLERY_PHOTOS = 5;
export const BUCKET_NAME = 'salon-media';
export const MAX_SERVER_FILE_SIZE = 400 * 1024; // 400 KB
export const MAX_CLIENT_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL || 'https://mneftepouqtsyfwgfsyb.supabase.co';
  return url.replace(/\/+$/, '');
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
 * and enforces that new Supabase Storage URLs belong strictly to this salon's folder.
 */
export function isAllowedSalonImageUrl(url: string, salonId: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  // Explicitly reject data: URIs
  if (trimmed.startsWith('data:')) return false;

  const supabaseUrl = getSupabaseUrl();
  const publicPrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/salons/${salonId}/`;

  if (trimmed.startsWith(supabaseUrl)) {
    return trimmed.startsWith(publicPrefix);
  }

  // Allow existing external http/https URLs (e.g. Unsplash, legacy URLs)
  return /^https?:\/\//i.test(trimmed);
}

/**
 * Uploads a binary buffer to Supabase Storage using the service-role key.
 */
export async function uploadToStorage(
  storagePath: string,
  buffer: Buffer | Uint8Array,
  contentType: string
): Promise<{ success: boolean; publicUrl?: string; storagePath?: string; error?: string }> {
  const supabaseUrl = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();
  const cleanPath = storagePath.replace(/^\/+/, '');

  if (!serviceKey) {
    console.warn('Notice: SUPABASE_SERVICE_ROLE_KEY is not configured. Simulating storage upload.');
    return {
      success: true,
      publicUrl: getStoragePublicUrl(cleanPath),
      storagePath: cleanPath,
    };
  }

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

    if (!res.ok) {
      const errText = await res.text();
      console.error('Supabase Storage upload error:', res.status, errText);
      return {
        success: false,
        error: `Supabase Storage upload failed: ${res.statusText}`,
      };
    }

    return {
      success: true,
      publicUrl: getStoragePublicUrl(cleanPath),
      storagePath: cleanPath,
    };
  } catch (err: any) {
    console.error('Upload exception:', err);
    return {
      success: false,
      error: err.message || 'Network error during image upload',
    };
  }
}

/**
 * Deletes an object from Supabase Storage using the service-role key.
 */
export async function deleteFromStorage(storagePath: string): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();
  const cleanPath = storagePath.replace(/^\/+/, '');

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
      const errText = await res.text();
      console.error('Supabase Storage delete error:', res.status, errText);
      return { success: false, error: errText };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Delete exception:', err);
    return { success: false, error: err.message };
  }
}

