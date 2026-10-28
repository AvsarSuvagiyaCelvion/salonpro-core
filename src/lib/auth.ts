import { SignJWT, jwtVerify } from 'jose';

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('FATAL SECURITY ERROR: SESSION_SECRET environment variable is missing.');
  }
  return new TextEncoder().encode(secret);
}

export const COOKIE_NAME = 'salonpro_session';

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

export const CUSTOMER_COOKIE_NAME = 'salonpro_customer_session';

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
export const ADMIN_COOKIE_NAME = 'salonpro_admin_session';

export async function createAdminSessionToken(payload: { email: string; role?: string }) {
  return await new SignJWT({ ...payload, role: 'super_admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifyAdminSessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== 'super_admin') return null;
    return payload as unknown as {
      email: string;
      role: string;
    };
  } catch {
    return null;
  }
}


