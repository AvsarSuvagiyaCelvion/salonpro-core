import { SignJWT, jwtVerify } from 'jose';

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      'FATAL SECURITY ERROR: SESSION_SECRET environment variable is missing or shorter than 32 characters. Minimum 32 random characters required.'
    );
  }
  return new TextEncoder().encode(secret);
}

export const COOKIE_NAME = 'studiodesk_session';

export interface TenantSessionPayload {
  email: string;
  role: string;
  salonId: string;
  userId: string;
  salonSlug?: string;
}

export async function createSessionToken(payload: TenantSessionPayload) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<TenantSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload || !payload.email) return null;
    return payload as unknown as TenantSessionPayload;
  } catch {
    return null;
  }
}

export const CUSTOMER_COOKIE_NAME = 'studiodesk_customer_session';

export async function createCustomerSessionToken(payload: {
  customerId: string;
  mobile: string;
  name: string;
  salonId: string;
}) {
  return await new SignJWT({ ...payload, role: 'customer' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecretKey());
}

export async function verifyCustomerSessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== 'customer') return null;
    return payload as unknown as {
      customerId: string;
      mobile: string;
      name: string;
      salonId: string;
      role: string;
    };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// MAIN ADMIN (SUPER ADMIN) AUTHENTICATION REALM
// -------------------------------------------------------------
export const ADMIN_COOKIE_NAME = 'studiodesk_admin_session';

export async function createAdminSessionToken(payload: { email: string; role?: string }) {
  const role = payload.role === 'super_admin' ? 'super_admin' : 'platform_admin';
  return await new SignJWT({ email: payload.email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecretKey());
}

export async function verifyAdminSessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const role = (payload.role as string) || '';
    if (role !== 'super_admin' && role !== 'platform_admin') return null;
    return payload as unknown as {
      email: string;
      role: 'super_admin' | 'platform_admin';
    };
  } catch {
    return null;
  }
}


